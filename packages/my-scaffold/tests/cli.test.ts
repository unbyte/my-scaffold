import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { test } from 'vitest'
import { fixture } from './fixture'

const require = createRequire(import.meta.url)
const loader = require.resolve('tsx')
const entry = resolve(__dirname, '../src/index.ts')

function cli(args: string[], cwd: string, input = '') {
  const result = spawnSync(process.execPath, ['--import', loader, entry, ...args], {
    cwd,
    input,
    encoding: 'utf8',
    timeout: 5000,
    env: { ...process.env, PATH: '', NODE_NO_WARNINGS: '1' },
  })
  assert.ifError(result.error)
  return result
}

test('discovery prints machine-readable contracts without input, toolchains, or writes', async (t) => {
  const root = await fixture(t)
  const list = cli(['list', '--json'], root)
  assert.equal(list.status, 0, list.stderr)
  const entries = JSON.parse(list.stdout) as { name: string; description: string }[]
  assert.equal(entries.length, 9)
  for (const generator of entries) {
    const result = cli([generator.name, '--schema'], root)
    assert.equal(result.status, 0, result.stderr)
    const schema = JSON.parse(result.stdout)
    assert.ok(schema.$schema)
    assert.ok(schema.examples.length > 0)
    const help = cli([generator.name, '--help'], root)
    assert.equal(help.status, 0, help.stderr)
    assert.match(help.stdout, /Example input:/)
    assert.match(help.stdout, /--schema/)
  }
  assert.deepEqual(await readdir(root), [])
})

test('file and stdin input produce equivalent scaffolds without interaction', async (t) => {
  const root = await fixture(t)
  const input = JSON.stringify({
    packages: [
      { name: '@example/core', access: 'public' },
      { name: '@example/cli', access: 'public', targets: ['bin'], bin: 'example' },
    ],
  })
  await writeFile(join(root, 'input.json'), input)
  const fromFile = cli(['mono/init', 'from-file', '--input', 'input.json', '--no-install', '--no-git'], root)
  assert.equal(fromFile.status, 0, fromFile.stderr)
  const fromStdin = cli(
    ['mono/init', 'from-stdin', '--input', '-', '--non-interactive', '--no-install', '--no-git'],
    root,
    input,
  )
  assert.equal(fromStdin.status, 0, fromStdin.stderr)
  for (const file of ['packages/core/package.json', 'packages/cli/package.json', 'tsconfig.json']) {
    assert.equal(
      await readFile(join(root, 'from-file', file), 'utf8'),
      await readFile(join(root, 'from-stdin', file), 'utf8'),
    )
  }
  const add = cli(
    ['mono/pkg', 'from-file', '-i', '-', '--no-install'],
    root,
    JSON.stringify({ name: 'private-tools', access: 'private' }),
  )
  assert.equal(add.status, 0, add.stderr)
  assert.ok((await readdir(join(root, 'from-file/packages'))).includes('private-tools'))
})

test('missing input, malformed JSON, schema errors, and unknown arguments fail before writes', async (t) => {
  const root = await fixture(t)
  const cases = [
    { args: ['mono/init', 'output'], input: '', error: /Input required/ },
    { args: ['mono/init', 'output', '--non-interactive'], input: '', error: /Input required/ },
    { args: ['mono/init', 'output', '--input', '-'], input: '{', error: /Invalid JSON in stdin/ },
    { args: ['mono/init', 'output', '--input', '-'], input: '{"packages":[]}', error: /packages/ },
    {
      args: ['mono/pkg', 'output', '--input', '-'],
      input: '{"name":"core","access":"public","targets":["bin"]}',
      error: /bin/,
    },
    { args: ['script/init', 'output', '--input', '-'], input: '{"typo":true}', error: /typo/ },
    { args: ['script/init', 'output', '--no-instal'], input: '', error: /Unknown option/ },
    { args: ['script/init', 'output', '--input'], input: '', error: /argument/ },
    { args: ['script/init', 'output', '--input', 'missing.json'], input: '', error: /ENOENT/ },
    { args: ['script/init', 'output', 'unexpected'], input: '', error: /optional target/ },
    { args: ['unknown', 'output'], input: '', error: /Unknown generator/ },
  ]
  for (const item of cases) {
    const result = cli(item.args, root, item.input)
    assert.equal(result.status, 1, `${item.args.join(' ')}: ${result.stderr}`)
    assert.match(result.stderr, item.error)
    assert.equal(result.stdout, '')
    assert.deepEqual(await readdir(root), [])
  }
})

test('generators without questions can run unattended and collisions exit nonzero', async (t) => {
  const root = await fixture(t)
  const args = ['script/init', 'output', '--non-interactive', '--no-install', '--no-git']
  const first = cli(args, root)
  assert.equal(first.status, 0, first.stderr)
  const pkg = await readFile(join(root, 'output/package.json'), 'utf8')
  const second = cli(args, root)
  assert.equal(second.status, 1)
  assert.match(second.stderr, /already exists/)
  assert.equal(await readFile(join(root, 'output/package.json'), 'utf8'), pkg)
})

test('a failed external command stops generation and returns a nonzero status', async (t) => {
  const root = await fixture(t)
  const result = cli(
    ['vite/init', 'output', '--input', '-', '--no-git', '--no-install'],
    root,
    '{"template":"vanilla-ts"}',
  )
  assert.equal(result.status, 1)
  assert.match(result.stderr, /pnpm|ENOENT/)
  assert.deepEqual(await readdir(join(root, 'output')), [])
})
