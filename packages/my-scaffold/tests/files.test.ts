import assert from 'node:assert/strict'
import { chmod, mkdir, readdir, readFile, stat, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'vitest'
import { runCommand } from '../src/actions/commands'
import { checkNewPath } from '../src/actions/files'
import { mergeJson, modifyJson } from '../src/actions/json'
import { copyTemplate } from '../src/actions/template'
import { fixture } from './fixture'

test('template copying renders text, preserves binary data and mode, and maps only copied dotfiles', async (t) => {
  const root = await fixture(t)
  const source = join(root, 'source')
  const target = join(root, 'target')
  await mkdir(join(source, '_config'), { recursive: true })
  await mkdir(target)
  await writeFile(join(target, '_unrelated'), 'keep')
  await writeFile(join(source, '_config/run'), '{{#if enabled}}{{name}}{{else}}disabled{{/if}}')
  await chmod(join(source, '_config/run'), 0o755)
  const binary = Buffer.from([0, 255, 123, 123, 110, 97, 109, 101, 125, 125])
  await writeFile(join(source, 'image'), binary)
  await writeFile(join(source, 'excluded'), '{{missing}}')
  await copyTemplate(source, target, { enabled: true, name: 'a&b' }, ['excluded'])
  assert.equal(await readFile(join(target, '.config/run'), 'utf8'), 'a&b')
  assert.deepEqual(await readFile(join(target, 'image')), binary)
  assert.equal((await stat(join(target, '.config/run'))).mode & 0o111, 0o111)
  assert.equal(await readFile(join(target, '_unrelated'), 'utf8'), 'keep')
  assert.deepEqual((await readdir(target)).sort(), ['.config', '_unrelated', 'image'])
})

test('template conflicts and missing variables fail before any template files are written', async (t) => {
  const root = await fixture(t)
  const source = join(root, 'source')
  const target = join(root, 'target')
  await mkdir(source)
  await mkdir(target)
  await writeFile(join(source, 'first'), 'new')
  await writeFile(join(source, 'last'), 'replacement')
  await writeFile(join(target, 'last'), 'existing')
  await assert.rejects(copyTemplate(source, target), /already exists/)
  assert.deepEqual(await readdir(target), ['last'])
  assert.equal(await readFile(join(target, 'last'), 'utf8'), 'existing')
  await writeFile(join(source, 'first'), '{{missing}}')
  await assert.rejects(copyTemplate(source, join(root, 'other')), /missing/)
  await assert.rejects(stat(join(root, 'other')), { code: 'ENOENT' })
})

test('destination checks reject escapes and symlink traversal', async (t) => {
  const root = await fixture(t)
  const target = join(root, 'target')
  const outside = join(root, 'outside')
  await mkdir(target)
  await mkdir(outside)
  await symlink(outside, join(target, 'packages'))
  await assert.rejects(checkNewPath(target, '../escaped'), /inside/)
  await assert.rejects(checkNewPath(target, 'packages/core'), /symlink/)
  assert.deepEqual(await readdir(outside), [])
})

test('JSON edits preserve unrelated values and merge source arrays as replacements', async (t) => {
  const root = await fixture(t)
  const target = join(root, 'package.json')
  const source = join(root, 'partial.json')
  await writeFile(target, JSON.stringify({ scripts: { dev: 'vite' }, keep: true, list: [1] }))
  await writeFile(source, JSON.stringify({ scripts: { build: 'vite build' }, list: [2] }))
  await mergeJson(target, source)
  assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), {
    scripts: { dev: 'vite', build: 'vite build' },
    keep: true,
    list: [2],
  })
  const link = join(root, 'link.json')
  await symlink(target, link)
  await assert.rejects(
    modifyJson(link, (value) => value),
    /regular JSON file/,
  )
})

test('commands receive closed stdin and nonzero exits reject', async (t) => {
  const root = await fixture(t)
  await runCommand(root, process.execPath, [
    '-e',
    "process.stdin.on('end', () => require('fs').writeFileSync('closed', 'yes')); process.stdin.resume()",
  ])
  assert.equal(await readFile(join(root, 'closed'), 'utf8'), 'yes')
  await assert.rejects(runCommand(root, process.execPath, ['-e', 'process.exit(7)']))
})
