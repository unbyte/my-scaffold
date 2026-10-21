import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { cargoWorkspaceSchema, crateSchema, normalizeCrate } from '../src/generators/cargo/schema'
import { monorepoSchema, normalizeMonorepo, normalizePackage, packageSchema } from '../src/generators/mono/schema'
import { scriptSchema } from '../src/generators/script/schema'
import { viteSchema, wranglerSchema } from '../src/generators/vite/schema'
import { Template } from '../src/templates'

test('package inputs determine templates and derived directories without prompting', () => {
  const cases = [
    [{ name: '@example/core', access: 'public' }, Template.MonorepoPkgLib],
    [{ name: '@example/core', access: 'public', targets: ['bin'], bin: 'core' }, Template.MonorepoPkgBin],
    [{ name: '@example/core', access: 'public', targets: ['lib', 'bin'], bin: 'core' }, Template.MonorepoPkgBinLib],
    [{ name: '@example/core', access: 'private' }, Template.MonorepoPkgPrivate],
  ] as const
  for (const [input, template] of cases) {
    const result = normalizePackage(packageSchema.parse(input))
    assert.equal(result.directory, 'core')
    assert.equal(result.template, template)
  }
})

test('invalid package combinations and unsafe directories are rejected', () => {
  for (const input of [
    { name: 'core', access: 'public', targets: ['bin'] },
    { name: 'core', access: 'public', bin: 'core' },
    { name: 'core', access: 'private', targets: ['lib'] },
    { name: 'core', access: 'public', targets: [] },
    { name: 'core', access: 'public', targets: ['lib', 'lib'] },
    { name: 'core', access: 'public', directory: '../outside' },
    { name: 'core', access: 'public', directory: '/tmp/outside' },
    { name: 'core', access: 'public', directory: 'CON' },
    { name: 'core', access: 'public', directory: 'core.' },
    { name: 'core', access: 'public', template: 'arbitrary' },
  ])
    assert.equal(packageSchema.safeParse(input).success, false, JSON.stringify(input))
})

test('monorepos validate package relationships and infer only unambiguous primary packages', () => {
  const core = { name: '@example/core', access: 'public' }
  const cli = { name: '@example/cli', access: 'public' }
  assert.equal(normalizeMonorepo(monorepoSchema.parse({ packages: [core] })).main, core.name)
  assert.equal(monorepoSchema.safeParse({ packages: [core, cli] }).success, false)
  assert.equal(monorepoSchema.safeParse({ packages: [core], main: 'missing' }).success, false)
  assert.equal(monorepoSchema.safeParse({ packages: [core], releaseStyle: 'all', main: core.name }).success, false)
  assert.equal(monorepoSchema.safeParse({ packages: [core, core] }).success, false)
  assert.equal(monorepoSchema.safeParse({ packages: [core, { ...cli, directory: 'CORE' }] }).success, false)
  assert.equal(monorepoSchema.safeParse({ packages: [] }).success, false)
  assert.equal(normalizeMonorepo(monorepoSchema.parse({ packages: [core, cli], releaseStyle: 'all' })).main, undefined)
  assert.equal(normalizeMonorepo(monorepoSchema.parse({ packages: [core, cli], main: cli.name })).main, cli.name)
})

test('Cargo defaults and constraints apply to JSON input', () => {
  assert.deepEqual(normalizeCrate(crateSchema.parse({ name: 'core' })), {
    name: 'core',
    directory: 'core',
    publish: false,
    targets: ['lib'],
  })
  for (const name of ['async', 'gen', 'con', 'Bad', '../bad']) {
    assert.equal(crateSchema.safeParse({ name }).success, false)
  }
  assert.equal(
    cargoWorkspaceSchema.safeParse({ packages: [{ name: 'core' }, { name: 'other', directory: 'core' }] }).success,
    false,
  )
  assert.equal(cargoWorkspaceSchema.safeParse({ packages: [] }).success, false)
})

test('all input contracts export JSON Schema and reject unknown fields', () => {
  for (const schema of [
    packageSchema,
    monorepoSchema,
    crateSchema,
    cargoWorkspaceSchema,
    scriptSchema,
    viteSchema,
    wranglerSchema,
  ]) {
    const json = z.toJSONSchema(schema, { io: 'input' })
    assert.ok(json.$schema)
    assert.equal(schema.safeParse({ typo: true }).success, false)
  }
  const json = z.toJSONSchema(crateSchema, { io: 'input' })
  assert.deepEqual(json.required, ['name'])
  const publish = json.properties?.publish
  assert.ok(publish && typeof publish === 'object')
  assert.equal(publish.default, false)
})
