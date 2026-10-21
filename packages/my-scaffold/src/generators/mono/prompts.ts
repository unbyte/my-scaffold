import { buildTargets, directoryName, validateWith } from '../input'
import {
  binaryName,
  type MonorepoInput,
  monorepoSchema,
  type PackageInput,
  packageDirectory,
  packageName,
  primaryCandidates,
} from './schema'

export async function promptPackage(): Promise<PackageInput> {
  const { default: inquirer } = await import('inquirer')
  const base = await inquirer.prompt<{ name: string; directory: string; access: 'public' | 'private' }>([
    { type: 'input', name: 'name', message: 'Enter package name', validate: validateWith(packageName) },
    {
      type: 'input',
      name: 'directory',
      message: 'Enter directory name',
      default: ({ name }: { name: string }) => packageDirectory({ name }),
      validate: validateWith(directoryName),
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
  ])
  if (base.access === 'private') return { ...base, access: 'private' }

  const { targets } = await inquirer.prompt<{ targets: ('lib' | 'bin')[] }>([
    {
      type: 'checkbox',
      name: 'targets',
      message: 'Select build targets',
      choices: ['lib', 'bin'],
      default: buildTargets.parse(undefined),
      validate: validateWith(buildTargets),
    },
  ])
  const { bin } = targets.includes('bin')
    ? await inquirer.prompt<{ bin: string }>([
        { type: 'input', name: 'bin', message: 'Enter binary name', validate: validateWith(binaryName) },
      ])
    : { bin: undefined }
  return { ...base, access: 'public', targets, bin }
}

export async function promptMonorepoInit(): Promise<MonorepoInput> {
  const { default: inquirer } = await import('inquirer')
  const packages: PackageInput[] = []
  let addMore = true
  while (addMore) {
    packages.push(await promptPackage())
    const { continueAdding } = await inquirer.prompt<{ continueAdding: boolean }>([
      { type: 'confirm', name: 'continueAdding', message: 'Add more packages?', default: true },
    ])
    addMore = continueAdding
  }
  const { releaseStyle } = await inquirer.prompt<{ releaseStyle: 'primary' | 'all' }>([
    {
      type: 'list',
      name: 'releaseStyle',
      message: 'Select release commit message style',
      default: monorepoSchema.shape.releaseStyle.parse(undefined),
      choices: [
        { name: 'only primary  (chore(release): <version>)', value: 'primary', short: 'primary' },
        { name: 'all packages  (chore: release packages)', value: 'all', short: 'all' },
      ],
    },
  ])
  const candidates = primaryCandidates(packages)
  if (releaseStyle === 'all' || candidates.length === 1) return { packages, releaseStyle }
  const { main } = await inquirer.prompt<{ main: string }>([
    { type: 'list', name: 'main', message: 'Select the primary package', choices: candidates.map((pkg) => pkg.name) },
  ])
  return { packages, releaseStyle, main }
}
