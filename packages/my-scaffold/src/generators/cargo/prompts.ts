import { buildTargets, validateWith } from '../input'
import { type CargoWorkspaceInput, type CrateInput, crateDirectory, crateName, crateSchema } from './schema'

export async function promptCargoPackage(): Promise<CrateInput> {
  const { default: inquirer } = await import('inquirer')
  return inquirer.prompt<CrateInput>([
    { type: 'input', name: 'name', message: 'Enter crate name', validate: validateWith(crateName) },
    {
      type: 'input',
      name: 'directory',
      message: 'Enter directory name (inside crates/)',
      default: ({ name }: { name: string }) => name,
      validate: validateWith(crateDirectory),
    },
    {
      type: 'confirm',
      name: 'publish',
      message: 'Allow publishing this crate?',
      default: crateSchema.shape.publish.parse(undefined),
    },
    {
      type: 'checkbox',
      name: 'targets',
      message: 'Select build targets',
      choices: ['lib', 'bin'],
      default: buildTargets.parse(undefined),
      validate: validateWith(buildTargets),
    },
  ])
}

export async function promptCargoInit(): Promise<CargoWorkspaceInput> {
  const { default: inquirer } = await import('inquirer')
  const packages: CrateInput[] = []
  let addMore = true
  while (addMore) {
    packages.push(await promptCargoPackage())
    const { continueAdding } = await inquirer.prompt<{ continueAdding: boolean }>([
      { type: 'confirm', name: 'continueAdding', message: 'Add more crates?', default: true },
    ])
    addMore = continueAdding
  }
  return { packages }
}
