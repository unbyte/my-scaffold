import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'vitest'
import { getGenerator } from '../src/generators'
import { fixture } from './fixture'

test('monorepo generators accept complete input and produce packages and references', async (t) => {
  const target = join(await fixture(t), 'project')
  const context = { target, install: false, git: false }
  await getGenerator('mono/init').run(
    {
      packages: [
        { name: '@example/core', access: 'public' },
        { name: '@example/cli', access: 'public', targets: ['bin'], bin: 'example' },
      ],
    },
    context,
  )
  const cli = JSON.parse(await readFile(join(target, 'packages/cli/package.json'), 'utf8'))
  assert.equal(cli.name, '@example/cli')
  assert.equal(cli.bin.example, './src/index.ts')
  await getGenerator('mono/pkg').run({ name: '@example/internal', access: 'private' }, context)
  const config = JSON.parse(await readFile(join(target, 'tsconfig.json'), 'utf8'))
  assert.deepEqual(config.references, [
    { path: './tsconfig.node.json' },
    { path: './packages/core' },
    { path: './packages/cli' },
    { path: './packages/internal' },
  ])
  const internal = JSON.parse(await readFile(join(target, 'packages/internal/package.json'), 'utf8'))
  assert.equal(internal.private, true)
  await assert.rejects(
    getGenerator('mono/pkg').run({ name: '@example/core', directory: 'duplicate', access: 'public' }, context),
    /already exists/,
  )
  assert.deepEqual((await readdir(join(target, 'packages'))).sort(), ['cli', 'core', 'internal'])
  const entries = await readdir(target)
  assert.ok(!entries.includes('.git') && !entries.includes('node_modules'))
})

test('invalid input and invalid workspace targets do not create files', async (t) => {
  const root = await fixture(t)
  const context = { target: join(root, 'project'), install: false, git: false }
  await assert.rejects(
    getGenerator('mono/init').run({ packages: [{ name: 'core', access: 'public', targets: ['bin'] }] }, context),
  )
  await assert.rejects(
    getGenerator('mono/init').run(
      { packages: [{ name: 'core', access: 'public', platform: 'browser', format: ['cjs'] }] },
      context,
    ),
  )
  await assert.rejects(getGenerator('mono/pkg').run({ name: 'core', access: 'public' }, context))
  assert.deepEqual(await readdir(root), [])
})

test('package platforms and formats render matching build settings and publish entry points', async (t) => {
  const target = await fixture(t)
  const context = { target, install: false, git: false }
  await getGenerator('mono/init').run({ packages: [{ name: 'internal', access: 'private' }] }, context)
  for (const platform of ['node', 'browser', 'neutral']) {
    for (const targets of [['lib'], ['bin'], ['lib', 'bin']]) {
      if (platform !== 'node' && targets.includes('bin')) continue
      for (const format of [undefined, ['esm'], ['cjs'], ['esm', 'cjs'], ['cjs', 'esm']]) {
        if (platform === 'browser' && format?.includes('cjs')) continue
        const name = [platform, ...targets, ...(format ?? ['default'])].join('-')
        await getGenerator('mono/pkg').run(
          { name, access: 'public', targets, platform, format, ...(targets.includes('bin') ? { bin: name } : {}) },
          context,
        )
        const directory = join(target, 'packages', name)
        const { publishConfig } = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
        const config = await readFile(join(directory, 'tsdown.config.ts'), 'utf8')
        const expectedFormat = format ?? (platform === 'browser' ? ['esm'] : ['esm', 'cjs'])
        assert.ok(config.includes(`platform: '${platform}'`))
        assert.ok(config.includes(`format: [${expectedFormat.map((value) => `'${value}'`).join(', ')}]`))
        const esm = expectedFormat.includes('esm')
        const cjs = expectedFormat.includes('cjs')
        if (targets.includes('lib')) {
          const esmExtension = platform === 'node' ? 'mjs' : 'js'
          const esmDeclarationExtension = platform === 'node' ? 'mts' : 'ts'
          assert.equal(publishConfig.main, `lib/index.${cjs ? 'cjs' : esmExtension}`)
          assert.equal(publishConfig.module, esm ? `lib/index.${esmExtension}` : undefined)
          assert.equal(publishConfig.types, `lib/index.d.${esm ? esmDeclarationExtension : 'cts'}`)
          assert.deepEqual(publishConfig.exports['.'], {
            ...(esm
              ? {
                  import: { types: `./lib/index.d.${esmDeclarationExtension}`, default: `./lib/index.${esmExtension}` },
                }
              : {}),
            ...(cjs
              ? { [esm ? 'require' : 'default']: { types: './lib/index.d.cts', default: './lib/index.cjs' } }
              : {}),
          })
        } else {
          assert.equal(publishConfig.exports, undefined)
          assert.ok(config.includes('dts: false'))
        }
        if (targets.includes('bin')) {
          const entry = targets.includes('lib') ? 'bin' : 'index'
          assert.match(await readFile(join(directory, `src/${entry}.ts`), 'utf8'), /^#!\/usr\/bin\/env node\n/)
          assert.equal(publishConfig.bin[name], `./lib/${entry}.${esm ? 'mjs' : 'cjs'}`)
        }
        const { compilerOptions } = JSON.parse(await readFile(join(directory, 'tsconfig.json'), 'utf8'))
        assert.deepEqual(compilerOptions.types, platform === 'node' ? ['node'] : [])
        assert.deepEqual(compilerOptions.lib, platform === 'browser' ? ['esnext', 'dom', 'dom.iterable'] : ['esnext'])
      }
    }
  }
})

test('published library exports resolve for ESM consumers and for CJS consumers when CJS is built', async (t) => {
  const target = await fixture(t)
  const packages = ['node', 'browser', 'neutral'].flatMap((platform) =>
    [['esm'], ['cjs'], ['esm', 'cjs']]
      .filter((format) => platform !== 'browser' || !format.includes('cjs'))
      .map((format) => ({ name: `library-${platform}-${format.join('-')}`, access: 'public', platform, format })),
  )
  await getGenerator('mono/init').run({ packages }, { target, install: false, git: false })
  for (const pkg of packages) {
    const cwd = join(target, 'packages', pkg.name)
    const manifest = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'))
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ ...manifest, ...manifest.publishConfig }))
    await mkdir(join(cwd, 'lib'))
    if (pkg.format.includes('esm')) {
      await writeFile(join(cwd, `lib/index.${pkg.platform === 'node' ? 'mjs' : 'js'}`), "export const format = 'esm'")
    }
    if (pkg.format.includes('cjs')) await writeFile(join(cwd, 'lib/index.cjs'), "exports.format = 'cjs'")
    const imported = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', `import { format } from '${pkg.name}'; console.log(format)`],
      { cwd, encoding: 'utf8' },
    )
    assert.equal(imported.status, 0, imported.stderr)
    assert.equal(imported.stdout.trim(), pkg.format.includes('esm') ? 'esm' : 'cjs')
    if (pkg.format.includes('cjs')) {
      const required = spawnSync(process.execPath, ['-e', `console.log(require('${pkg.name}').format)`], {
        cwd,
        encoding: 'utf8',
      })
      assert.equal(required.status, 0, required.stderr)
      assert.equal(required.stdout.trim(), 'cjs')
    }
  }
})

test('script scaffolding needs no answers and preserves existing unrelated files', async (t) => {
  const target = await fixture(t)
  await writeFile(join(target, '_keep'), 'existing')
  await getGenerator('script/init').run({}, { target, install: false, git: false })
  assert.ok((await readdir(target)).includes('.gitignore'))
  assert.equal(await readFile(join(target, '_keep'), 'utf8'), 'existing')
  const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  assert.ok(pkg.devDependencies.tsx)
})

test('Wrangler declares its dependency without installing and preserves existing scripts and versions', async (t) => {
  const root = await fixture(t)
  for (const existing of [false, true]) {
    const target = join(root, String(existing))
    await mkdir(target)
    await writeFile(
      join(target, 'package.json'),
      JSON.stringify({
        name: 'example',
        scripts: { dev: 'vite' },
        devDependencies: existing ? { wrangler: '4.80.0' } : {},
      }),
    )
    await getGenerator('vite/wrangler').run({}, { target, install: false, git: false })
    const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
    assert.equal(pkg.scripts.dev, 'vite')
    assert.equal(pkg.scripts['cf:dev'], 'wrangler dev')
    assert.equal(pkg.devDependencies.wrangler, existing ? '4.80.0' : '^4')
    assert.ok((await readdir(target)).includes('wrangler.jsonc'))
    assert.ok(!(await readdir(target)).includes('node_modules'))
  }
})
