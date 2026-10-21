import type { GeneratorContext } from '../definition'
import { validateWith } from '../input'
import { pinnedPnpmVersion, readProject } from './files'
import { inferRepository } from './repository'
import { baseBranch, buildScript, type CiInput, ciSchema, type LocalInput, pnpmVersion, repository } from './schema'

export async function promptLocal(): Promise<LocalInput> {
  const { default: inquirer } = await import('inquirer')
  return inquirer.prompt<LocalInput>([
    {
      type: 'input',
      name: 'baseBranch',
      message: 'Release branch',
      default: 'main',
      validate: validateWith(baseBranch),
    },
  ])
}

export async function promptCi(context: Pick<GeneratorContext, 'target'>): Promise<CiInput> {
  const pkg = await readProject(context.target)
  const pinned = pinnedPnpmVersion(pkg.packageManager)
  const inferredRepository = await inferRepository(context.target)
  const { default: inquirer } = await import('inquirer')
  const input = await inquirer.prompt<Omit<CiInput, 'buildScript'>>([
    {
      type: 'input',
      name: 'repository',
      message: 'GitHub repository (owner/repository)',
      when: inferredRepository === undefined,
      validate: validateWith(repository),
    },
    {
      type: 'input',
      name: 'baseBranch',
      message: 'Release branch',
      default: 'main',
      validate: validateWith(baseBranch),
    },
    {
      type: 'list',
      name: 'access',
      message: 'Default npm package access',
      choices: ['public', 'restricted'],
      default: ciSchema.shape.access.parse(undefined),
    },
    {
      type: 'list',
      name: 'nodeVersion',
      message: 'Node.js version for release jobs',
      choices: ['22', '24', '26'],
      default: ciSchema.shape.nodeVersion.parse(undefined),
    },
    {
      type: 'input',
      name: 'pnpmVersion',
      message: 'pnpm version to pin',
      when: pinned === undefined,
      validate: validateWith(pnpmVersion),
    },
  ])
  const scripts = Object.keys(pkg.scripts ?? {}).filter((script) => buildScript.safeParse(script).success)
  const build = await inquirer.prompt<Pick<CiInput, 'buildScript'>>([
    {
      type: 'list',
      name: 'buildScript',
      message: 'Script to build packages before publishing',
      choices: [
        ...scripts.map((script) => ({ name: script, value: script })),
        { name: 'No build needed', value: false },
      ],
      default: scripts.includes('build') ? 'build' : false,
    },
  ])
  return { ...input, ...build, repository: inferredRepository ?? input.repository }
}
