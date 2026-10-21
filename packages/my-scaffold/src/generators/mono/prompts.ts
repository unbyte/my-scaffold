import { buildTargets, directoryName, validateWith } from '../input'
import { binaryName, type MonorepoInput, type PackageInput, packageDirectory, packageName } from './schema'

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
  return { packages }
}
