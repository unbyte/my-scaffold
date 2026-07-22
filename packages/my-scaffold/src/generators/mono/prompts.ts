import type Inquirer from 'inquirer'
import { Template } from '#templates'

type Access = 'public' | 'private'
type Target = 'lib' | 'bin'
type ReleaseStyle = 'primary' | 'all'

export interface PromptPackageAnswer {
  name: string
  access: Access
  template: Template
  bin?: string
}

function resolvePackageTemplate(access: Access, targets: Target[] = []): Template {
  if (access === 'private') return Template.MonorepoPkgPrivate

  const hasLib = targets.includes('lib')
  const hasBin = targets.includes('bin')

  if (hasLib && hasBin) return Template.MonorepoPkgBinLib
  if (hasBin) return Template.MonorepoPkgBin
  return Template.MonorepoPkgLib
}

export async function promptPackage(inquirer: typeof Inquirer): Promise<PromptPackageAnswer> {
  const { name, access, targets, bin } = await inquirer.prompt<{
    name: string
    access: Access
    targets?: Target[]
    bin?: string
  }>([
    {
      type: 'input',
      name: 'name',
      message: 'Enter package name',
      validate: (input) => {
        const valid = /^(@[a-z0-9~][a-z0-9-._~]*\/)?[a-z0-9~][a-z0-9-._~]*$/.test(input)
        return valid || 'Invalid npm package name'
      },
    },
    {
      type: 'list',
      name: 'access',
      message: 'Select package access',
      choices: [
        { name: 'public  (bundled, esm + cjs)', value: 'public', short: 'public' },
        { name: 'private (unbundled)', value: 'private', short: 'private' },
      ],
    },
    {
      type: 'checkbox',
      name: 'targets',
      message: 'Select build targets',
      choices: [
        { name: 'lib', value: 'lib' },
        { name: 'bin', value: 'bin' },
      ],
      default: ['lib'],
      when: ({ access }) => access === 'public',
      validate: (input: Target[]) => input.length > 0 || 'Select at least one target',
    },
    {
      type: 'input',
      name: 'bin',
      message: 'Enter binary name',
      validate: (input) => {
        const valid = /^[a-z0-9](?:[a-z0-9-_]*[a-z0-9])?$/.test(input)
        return valid || 'Invalid binary name'
      },
      when: ({ access, targets }) => access === 'public' && !!targets?.includes('bin'),
    },
  ])

  return {
    name,
    access,
    template: resolvePackageTemplate(access, targets),
    bin,
  }
}

export interface PromptMonorepoInitAnswer {
  packages: PromptPackageAnswer[]
  releaseStyle: ReleaseStyle
  // The primary package whose version drives the release commit message.
  // Only set (and only meaningful) when releaseStyle is 'primary'.
  main?: string
}

export async function promptMonorepoInit(inquirer: typeof Inquirer): Promise<PromptMonorepoInitAnswer> {
  const packages: PromptPackageAnswer[] = []

  let addMore = true
  while (addMore) {
    const pkg = await promptPackage(inquirer)
    packages.push(pkg)

    const { continueAdding } = await inquirer.prompt<{ continueAdding: boolean }>([
      {
        type: 'confirm',
        name: 'continueAdding',
        message: 'Add more packages?',
        default: true,
      },
    ])

    addMore = continueAdding
  }

  const { releaseStyle } = await inquirer.prompt<{ releaseStyle: ReleaseStyle }>([
    {
      type: 'list',
      name: 'releaseStyle',
      message: 'Select release commit message style',
      choices: [
        { name: 'only primary  (chore(release): <version>)', value: 'primary', short: 'primary' },
        { name: 'all packages  (chore: release packages)', value: 'all', short: 'all' },
      ],
    },
  ])

  if (releaseStyle === 'all') {
    return { packages, releaseStyle }
  }

  const publicPackages = packages.filter((pkg) => pkg.access === 'public')
  const candidates = publicPackages.length > 0 ? publicPackages : packages

  if (candidates.length === 1) {
    return { packages, releaseStyle, main: candidates[0].name }
  }

  const defaultMain = publicPackages.length > 1 ? publicPackages[1].name : candidates[0].name

  const { mainPackage } = await inquirer.prompt<{ mainPackage: string }>([
    {
      type: 'list',
      name: 'mainPackage',
      message: 'Select the primary package',
      choices: candidates.map((pkg) => pkg.name),
      default: defaultMain,
    },
  ])

  return { packages, releaseStyle, main: mainPackage }
}
