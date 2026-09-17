import type Inquirer from 'inquirer'

type Target = 'lib' | 'bin'

const reservedNames = new Set(
  `as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut
  pub ref return self static struct super trait true type unsafe use where while abstract become box do final gen
  macro override priv try typeof unsized virtual yield`.split(/\s+/),
)

function isPortableName(input: string) {
  return /^[a-z][a-z0-9_-]*$/.test(input) && !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/.test(input)
}

export interface PromptCargoPackageAnswer {
  name: string
  directory: string
  publish: boolean
  targets: Target[]
}

export async function promptCargoPackage(
  inquirer: typeof Inquirer,
  packages: PromptCargoPackageAnswer[] = [],
): Promise<PromptCargoPackageAnswer> {
  return inquirer.prompt<PromptCargoPackageAnswer>([
    {
      type: 'input',
      name: 'name',
      message: 'Enter crate name',
      validate: (input: string) => {
        if (!isPortableName(input) || input.length > 64 || reservedNames.has(input)) return 'Invalid crate name'
        return !packages.some((pkg) => pkg.name === input) || 'Crate name already used'
      },
    },
    {
      type: 'input',
      name: 'directory',
      message: 'Enter directory name (inside crates/)',
      default: ({ name }: { name: string }) => name,
      validate: (input: string) => {
        if (!isPortableName(input)) return 'Use a single directory name starting with a lowercase letter'
        return !packages.some((pkg) => pkg.directory === input) || 'Directory name already used'
      },
    },
    {
      type: 'confirm',
      name: 'publish',
      message: 'Allow publishing this crate?',
      default: false,
    },
    {
      type: 'checkbox',
      name: 'targets',
      message: 'Select build targets',
      choices: ['lib', 'bin'],
      default: ['lib'],
      validate: (input: Target[]) => input.length > 0 || 'Select at least one target',
    },
  ])
}

export interface PromptCargoInitAnswer {
  packages: PromptCargoPackageAnswer[]
}

export async function promptCargoInit(inquirer: typeof Inquirer): Promise<PromptCargoInitAnswer> {
  const packages: PromptCargoPackageAnswer[] = []

  let addMore = true
  while (addMore) {
    packages.push(await promptCargoPackage(inquirer, packages))

    const { continueAdding } = await inquirer.prompt<{ continueAdding: boolean }>([
      {
        type: 'confirm',
        name: 'continueAdding',
        message: 'Add more crates?',
        default: true,
      },
    ])
    addMore = continueAdding
  }

  return { packages }
}
