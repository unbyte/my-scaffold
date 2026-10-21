import assert from 'node:assert/strict'
import { mkdir, readdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { test } from 'vitest'
import { readJson } from '../src/actions/json'
import { getGenerator } from '../src/generators'
import { ciSchema, localSchema } from '../src/generators/changeset/schema'
import { fixture } from './fixture'

const require = createRequire(import.meta.url)

async function createWorkspace(target: string) {
  const context = { target, install: false, git: false }
  await getGenerator('mono/init').run(
    {
      packages: [
        { name: '@example/core', access: 'public' },
        { name: '@example/utils', access: 'public' },
      ],
    },
    context,
  )
  return context
}

test('local setup adds Changesets to a generated workspace and formats all released packages', async (t) => {
  const target = await fixture(t)
  const context = await createWorkspace(target)
  const before = await readJson(join(target, 'package.json'))
  await getGenerator('changeset/local').run({ baseBranch: 'release/next' }, context)
  const pkg = await readJson<{ scripts: unknown; devDependencies: Record<string, string> }>(
    join(target, 'package.json'),
  )
  assert.deepEqual(pkg.scripts, before.scripts)
  assert.equal(pkg.devDependencies['@changesets/cli'], '^3.0.3')
  const config = await readJson(join(target, '.changeset/config.json'))
  assert.equal(config.baseBranch, 'release/next')
  assert.deepEqual(config.privatePackages, { version: false })
  const [modulePath] = config.commit as string[]
  const { getVersionMessage } = require(join(target, '.changeset', modulePath))
  assert.equal(
    await getVersionMessage({
      releases: [
        { name: '@example/core', type: 'minor', newVersion: '1.1.0' },
        { name: '@example/utils', type: 'patch', newVersion: '2.0.1' },
        { name: '@example/unchanged', type: 'none', newVersion: '1.0.0' },
      ],
    }),
    'chore: release packages\n\n- @example/core@1.1.0\n- @example/utils@2.0.1',
  )
  await assert.rejects(getVersionMessage({ releases: [] }), /no packages to release/)
  assert.ok(!(await readdir(target)).includes('node_modules'))
})

test('CI setup adds a release workflow with artifact handoffs and npm trusted publishing', async (t) => {
  const target = await fixture(t)
  const context = await createWorkspace(target)
  await getGenerator('mono/pkg').run({ name: '@example/internal', access: 'private' }, context)
  const privateManifest = await readFile(join(target, 'packages/internal/package.json'), 'utf8')
  const before = await readJson(join(target, 'package.json'))
  await getGenerator('changeset/ci').run(
    { repository: 'example/project', baseBranch: 'release/next', pnpmVersion: '11.21.0', access: 'restricted' },
    context,
  )
  const pkg = await readJson<{ packageManager: string; scripts: unknown; devDependencies: Record<string, string> }>(
    join(target, 'package.json'),
  )
  assert.equal(pkg.packageManager, 'pnpm@11.21.0')
  assert.deepEqual(pkg.scripts, before.scripts)
  assert.equal(pkg.devDependencies['@changesets/cli'], '^3.0.3')
  assert.equal(pkg.devDependencies['@changesets/changelog-github'], '^1.0.1')
  for (const directory of ['core', 'utils']) {
    const manifest = await readJson(join(target, 'packages', directory, 'package.json'))
    assert.deepEqual(manifest.repository, {
      type: 'git',
      url: 'git+https://github.com/example/project.git',
      directory: `packages/${directory}`,
    })
  }
  assert.equal(await readFile(join(target, 'packages/internal/package.json'), 'utf8'), privateManifest)
  const config = await readJson(join(target, '.changeset/config.json'))
  assert.deepEqual(config.changelog, ['@changesets/changelog-github', { repo: 'example/project' }])
  assert.equal(config.baseBranch, 'release/next')
  assert.equal(config.access, 'restricted')
  assert.equal(config.commit, false)
  const workflow = await readFile(join(target, '.github/workflows/release.yml'), 'utf8')
  assert.match(workflow, /branches:\n\s+- "release\/next"/)
  assert.match(workflow, /run: pnpm run build/)
  assert.match(workflow, /id-token: write/)
  assert.ok(workflow.includes(`publish-plan-artifact-id: \${{ needs.select-mode.outputs.publish-plan-artifact-id }}`))
  assert.ok(workflow.includes(`pack-dir-artifact-id: \${{ needs.pack.outputs.pack-dir-artifact-id }}`))
  assert.match(workflow, /commit-message: "chore: release packages"/)
  assert.doesNotMatch(workflow, /\\\{\{|\{\{ (?:baseBranchJson|nodeVersionJson|buildScript)/)
  const instructions = await readFile(join(target, '.changeset/README.md'), 'utf8')
  assert.ok(instructions.includes('example/project') && instructions.includes('release.yml'))
  assert.ok(!(await readdir(target)).includes('node_modules'))
})

test('CI setup reuses the pnpm pin, upgrades Changesets v2, and supports packages without a build', async (t) => {
  const target = await fixture(t)
  const context = await createWorkspace(target)
  const pkg = await readJson(join(target, 'package.json'))
  const packageManager = 'pnpm@11.21.0+sha512.abcdef'
  await writeFile(
    join(target, 'package.json'),
    JSON.stringify({
      ...pkg,
      packageManager,
      dependencies: { '@changesets/cli': '^2.31.0' },
      devDependencies: { '@changesets/changelog-github': '1.0.1' },
    }),
  )
  await getGenerator('changeset/ci').run(
    { repository: 'example/project', baseBranch: 'main', buildScript: false },
    context,
  )
  const updated = await readJson<{
    packageManager: string
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
  }>(join(target, 'package.json'))
  assert.equal(updated.packageManager, packageManager)
  assert.equal(updated.dependencies['@changesets/cli'], '^3.0.3')
  assert.equal(updated.devDependencies['@changesets/cli'], undefined)
  assert.equal(updated.devDependencies['@changesets/changelog-github'], '1.0.1')
  const workflow = await readFile(join(target, '.github/workflows/release.yml'), 'utf8')
  assert.doesNotMatch(workflow, /run: pnpm run /)
  assert.match(workflow, /uses: changesets\/action\/pack@v2/)
})

test('CI prerequisites fail before adding files or changing the manifest', async (t) => {
  const root = await fixture(t)
  const cases = [
    { packageManager: undefined, input: {}, error: /Provide pnpmVersion/ },
    { packageManager: 'npm@11.5.1', input: {}, error: /exact pnpm version/ },
    { packageManager: 'pnpm@11.21.0', input: { pnpmVersion: '11.9.0' }, error: /must match/ },
    { packageManager: 'pnpm@11.21.0', input: { buildScript: 'missing' }, error: /Missing package.json script/ },
  ]
  for (const [index, item] of cases.entries()) {
    const target = join(root, String(index))
    const context = await createWorkspace(target)
    const path = join(target, 'package.json')
    const pkg = await readJson(path)
    await writeFile(path, JSON.stringify({ ...pkg, packageManager: item.packageManager }))
    const before = await readFile(path, 'utf8')
    await assert.rejects(
      getGenerator('changeset/ci').run({ repository: 'example/project', baseBranch: 'main', ...item.input }, context),
      item.error,
    )
    assert.equal(await readFile(path, 'utf8'), before)
    assert.ok(!(await readdir(target)).includes('.changeset'))
    assert.deepEqual(await readdir(join(target, '.github/workflows')), ['check.yml'])
  }
})

test('existing release setup and workflow symlinks are preserved without partial changes', async (t) => {
  const root = await fixture(t)
  for (const collision of ['changeset', 'workflow', 'symlink']) {
    const target = join(root, collision)
    const context = await createWorkspace(target)
    const manifest = await readFile(join(target, 'package.json'), 'utf8')
    const existing = collision === 'changeset' ? '.changeset/config.json' : '.github/workflows/release.yml'
    if (collision === 'changeset') await mkdir(join(target, '.changeset'))
    if (collision === 'symlink') {
      const outside = join(root, 'outside.yml')
      await writeFile(outside, 'keep')
      await symlink(outside, join(target, existing))
    } else {
      await writeFile(join(target, existing), 'keep')
    }
    await assert.rejects(
      getGenerator('changeset/ci').run(
        { repository: 'example/project', baseBranch: 'main', pnpmVersion: '11.21.0' },
        context,
      ),
      /already exists/,
    )
    assert.equal(await readFile(join(target, 'package.json'), 'utf8'), manifest)
    assert.equal(await readFile(join(target, existing), 'utf8'), 'keep')
    if (collision !== 'changeset') assert.ok(!(await readdir(target)).includes('.changeset'))
    else {
      await assert.rejects(getGenerator('changeset/local').run({ baseBranch: 'main' }, context), /already exists/)
      assert.deepEqual(await readdir(join(target, '.changeset')), ['config.json'])
    }
  }
})

test('CI setup checks workspace packages before changing files', async (t) => {
  const root = await fixture(t)
  for (const kind of ['private', 'malformed']) {
    const target = join(root, kind)
    const context = { target, install: false, git: false }
    await getGenerator('mono/init').run(
      { packages: [{ name: 'core', access: kind === 'private' ? 'private' : 'public' }] },
      context,
    )
    if (kind === 'malformed') await writeFile(join(target, 'packages/core/package.json'), '{')
    const before = await readFile(join(target, 'package.json'), 'utf8')
    await assert.rejects(
      getGenerator('changeset/ci').run(
        { repository: 'example/project', baseBranch: 'main', pnpmVersion: '11.21.0' },
        context,
      ),
      kind === 'private' ? /at least one public package/ : SyntaxError,
    )
    assert.equal(await readFile(join(target, 'package.json'), 'utf8'), before)
    assert.ok(!(await readdir(target)).includes('.changeset'))
    assert.deepEqual(await readdir(join(target, '.github/workflows')), ['check.yml'])
  }
})

test('Changesets inputs reject invalid branches, repository names, versions, and command fragments', () => {
  for (const value of ['', '../main', 'main.lock', 'foo/.hidden', 'foo//bar', `\${{ github.ref }}`, 'main\nnext']) {
    assert.equal(localSchema.safeParse({ baseBranch: value }).success, false, value)
  }
  const valid = { repository: 'example/project', baseBranch: 'main' }
  for (const input of [
    { ...valid, repository: 'https://github.com/example/project' },
    { ...valid, buildScript: 'build; echo injected' },
    { ...valid, pnpmVersion: 'latest' },
    { ...valid, nodeVersion: '18' },
  ])
    assert.equal(ciSchema.safeParse(input).success, false)
})
