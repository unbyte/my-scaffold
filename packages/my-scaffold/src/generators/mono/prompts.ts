import { buildTargets, directoryName, validateWith } from '../input'
import {
  binaryName,
  defaultPackageFormats,
  type MonorepoInput,
  type PackageConfig,
  type PackageInput,
  packageDirectory,
  packageFormats,
  packageName,
  packagePlatform,
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
        { name: 'public  (bundled)', value: 'public', short: 'public' },
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
  const { platform } = targets.includes('bin')
    ? { platform: 'node' as const }
    : await inquirer.prompt<Pick<Extract<PackageConfig, { access: 'public' }>, 'platform'>>([
        {
          type: 'list',
          name: 'platform',
          message: 'Select runtime platform',
          choices: packagePlatform.unwrap().options,
          default: packagePlatform.parse(undefined),
        },
      ])
  const { format } =
    platform === 'browser'
      ? { format: defaultPackageFormats(platform) }
      : await inquirer.prompt<Pick<Extract<PackageConfig, { access: 'public' }>, 'format'>>([
          {
            type: 'checkbox',
            name: 'format',
            message: 'Select output formats',
            choices: [
              { name: 'ESM', value: 'esm' },
              { name: 'CommonJS', value: 'cjs' },
            ],
            default: defaultPackageFormats(platform),
            validate: validateWith(packageFormats),
          },
        ])
  return { ...base, access: 'public', targets, bin, platform, format }
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
