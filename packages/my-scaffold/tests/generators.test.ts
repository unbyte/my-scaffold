import assert from 'node:assert/strict'
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
  await assert.rejects(getGenerator('mono/pkg').run({ name: 'core', access: 'public' }, context))
  assert.deepEqual(await readdir(root), [])
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
