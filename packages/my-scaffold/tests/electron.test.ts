import assert from 'node:assert/strict'
import { mkdir, readdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'vitest'
import { z } from 'zod'
import { getGenerator } from '../src/generators'
import { electronSchema } from '../src/generators/electron/schema'
import { fixture } from './fixture'

test('Electron input validates portable app names and app IDs before creating files', async (t) => {
  const root = await fixture(t)
  const context = { target: join(root, 'desktop'), install: false, git: false }
  for (const input of [
    {},
    { name: '../desktop' },
    { name: '@example/desktop' },
    { name: 'My Desktop' },
    { name: 'con' },
    { name: 'desktop', appId: 'invalid' },
    { name: 'desktop', appId: 'com.example."app' },
    { name: 'desktop', template: 'react-ts' },
  ]) {
    await assert.rejects(getGenerator('electron/init').run(input, context))
  }
  assert.deepEqual(await readdir(root), [])
  assert.deepEqual(electronSchema.parse({ name: 'my-desktop' }), {
    name: 'my-desktop',
    appId: 'com.example.desktop',
  })
  const schema = z.toJSONSchema(electronSchema, { io: 'input' })
  assert.deepEqual(schema.required, ['name'])
  assert.equal(schema.additionalProperties, false)
})

test('Electron generation supplies development, testing, and packaging without installing', async (t) => {
  const target = join(await fixture(t), 'desktop')
  await getGenerator('electron/init').run(
    { name: 'my-desktop', appId: 'dev.example.desktop' },
    { target, install: false, git: false },
  )
  const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  assert.equal(pkg.name, 'my-desktop')
  assert.equal(pkg.private, true)
  assert.equal(pkg.main, 'dist-electron/main.js')
  for (const dependency of [
    'electron',
    'vite',
    'vite-plugin-electron',
    'electron-builder',
    'vitest',
    '@biomejs/biome',
    'lefthook',
  ]) {
    assert.ok(pkg.devDependencies[dependency], dependency)
  }
  assert.equal(pkg.devDependencies.vitest, pkg.devDependencies['@vitest/coverage-v8'])
  assert.equal(pkg.scripts.dev, 'vite')
  assert.match(pkg.scripts.build, /check:types.*vite build/)
  assert.match(pkg.scripts.pack, /pnpm build.*electron-builder --dir --publish never/)
  assert.match(pkg.scripts.dist, /pnpm build.*electron-builder --publish never/)
  assert.equal(pkg.scripts.test, 'vitest run')
  const builder = JSON.parse(await readFile(join(target, 'electron-builder.json'), 'utf8'))
  assert.equal(builder.appId, 'dev.example.desktop')
  assert.equal(builder.productName, 'my-desktop')
  assert.ok(builder.files.includes('dist/**/*'))
  assert.ok(builder.files.includes('dist-electron/**/*'))
  assert.match(await readFile(join(target, 'index.html'), 'utf8'), /<title>my-desktop<\/title>/)
  assert.match(await readFile(join(target, 'pnpm-workspace.yaml'), 'utf8'), /electron: true/)
  for (const file of [
    '.gitignore',
    'biome.json',
    'lefthook.yml',
    'vitest.config.ts',
    'tsconfig.node.json',
    'electron/main.ts',
    'electron/preload.ts',
    'src/main.ts',
    'tests/navigation.test.ts',
  ]) {
    assert.ok((await readFile(join(target, file))).length > 0, file)
  }
  const entries = await readdir(target)
  assert.ok(!entries.includes('node_modules') && !entries.includes('.git'))
})

test('Electron initialization rejects occupied directories, files, and symlinks without modifying them', async (t) => {
  const root = await fixture(t)
  const occupied = join(root, 'occupied')
  await mkdir(occupied)
  await writeFile(join(occupied, 'keep.txt'), 'keep')
  const file = join(root, 'file')
  await writeFile(file, 'keep')
  const link = join(root, 'link')
  await symlink(occupied, link, 'dir')
  for (const target of [occupied, file, link]) {
    await assert.rejects(
      getGenerator('electron/init').run({ name: 'desktop' }, { target, install: false, git: false }),
      /Expected an? (empty target )?directory/,
    )
  }
  assert.deepEqual(await readdir(occupied), ['keep.txt'])
  assert.equal(await readFile(join(occupied, 'keep.txt'), 'utf8'), 'keep')
  assert.equal(await readFile(file, 'utf8'), 'keep')
})
