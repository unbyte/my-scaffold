import { pnpmInstall } from '../../actions/commands'
import { checkNewPath } from '../../actions/files'
import { modifyJson } from '../../actions/json'
import { renderTemplate } from '../../actions/template'
import { Template } from '../../templates'
import { defineGenerator } from '../definition'
import { listPackages } from '../mono/files'
import { checkSetup, configureProject, pinnedPnpmVersion } from './files'
import { inferRepository, resolveBaseBranch } from './git'
import { promptCi } from './prompts'
import { ciSchema } from './schema'

export const changesetCi = defineGenerator({
  description: 'Set up Changesets releases on GitHub Actions',
  schema: ciSchema,
  prompt: promptCi,
  async generate(input, context) {
    const pkg = await checkSetup(context.target)
    const packages = (await listPackages(context.target)).filter((pkg) => !pkg.manifest.private)
    if (packages.length === 0) throw new Error('The workspace needs at least one public package to publish')
    await checkNewPath(context.target, '.github/workflows/release.yml')
    const repository = input.repository ?? (await inferRepository(context.target))
    if (repository === undefined) {
      throw new Error(
        'Could not infer a GitHub repository from origin at the target Git root; provide repository as owner/repository',
      )
    }
    const pinned = pinnedPnpmVersion(pkg.packageManager)
    const baseBranch = await resolveBaseBranch(context.target, input.baseBranch)
    const pnpmVersion = input.pnpmVersion ?? pinned
    if (pnpmVersion === undefined) throw new Error('Provide pnpmVersion or pin pnpm in package.json packageManager')
    if (pinned !== undefined && pnpmVersion !== pinned) {
      throw new Error(`pnpmVersion must match package.json packageManager (${pinned})`)
    }
    if (input.buildScript !== false && !pkg.scripts?.[input.buildScript]) {
      throw new Error(`Missing package.json script: ${input.buildScript}; set buildScript to false to skip building`)
    }
    await renderTemplate(context.target, Template.ChangesetCi, {
      repository,
      repositoryJson: JSON.stringify(repository),
      baseBranchJson: JSON.stringify(baseBranch),
      accessJson: JSON.stringify(input.access),
      nodeVersionJson: JSON.stringify(input.nodeVersion),
      buildScript: input.buildScript,
    })
    await configureProject(context.target, 'ci', pnpmVersion)
    for (const pkg of packages) {
      await modifyJson(pkg.path, (manifest) => ({
        ...manifest,
        repository: {
          type: 'git',
          url: `git+https://github.com/${repository}.git`,
          directory: pkg.directory,
        },
      }))
    }
    if (context.install) await pnpmInstall(context.target)
  },
})
