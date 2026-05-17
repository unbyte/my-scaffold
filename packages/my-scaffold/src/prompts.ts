import type Inquirer from 'inquirer'
import { type LayoutTemplate, type PackageTemplate, Template } from './templates'

export interface PromptPackageAnswer {
  name: string
  bin?: string
  template: PackageTemplate
}

export async function promptPackage(inquirer: typeof Inquirer): Promise<PromptPackageAnswer> {
  const { name, bin, template } = await inquirer.prompt<PromptPackageAnswer>([
    {
      type: 'list',
      name: 'template',
      message: 'Select package type',
      choices: [
        {
          name: 'universal (bundled, esm + cjs)',
          value: Template.MonorepoPkgUniversal,
          short: 'universal',
        },
        {
          name: 'node      (bundled, cjs)',
          value: Template.MonorepoPkgNode,
          short: 'node',
        },
        {
          name: 'cli       (bundled, cjs)',
          value: Template.MonorepoPkgCli,
          short: 'cli',
        },
        {
          name: 'private   (unbundled)',
          value: Template.MonorepoPkgPrivate,
          short: 'private',
        },
      ],
    },
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
      type: 'input',
      name: 'bin',
      message: 'Enter binary name',
      validate: (input) => {
        const valid = /^[a-z0-9](?:[a-z0-9-_]*[a-z0-9])?$/.test(input)
        return valid || 'Invalid binary name'
      },
      when: ({ template }) => template === Template.MonorepoPkgCli,
    },
  ])

  return {
    name,
    bin,
    template,
  }
}

export interface PromptInitAnswer {
  layout: LayoutTemplate
  packages: PromptPackageAnswer[]
  main?: string
}

export async function promptInit(inquirer: typeof Inquirer): Promise<PromptInitAnswer> {
  const { layout } = await inquirer.prompt<{ layout: LayoutTemplate }>([
    {
      type: 'list',
      name: 'layout',
      message: 'Select project layout',
      choices: [
        {
          name: 'monorepo',
          value: Template.MonorepoLayout,
          short: 'monorepo',
        },
        {
          name: 'script',
          value: Template.ScriptLayout,
          short: 'script',
        },
      ],
    },
  ])

  if (layout === Template.ScriptLayout) {
    return { layout, packages: [] }
  }

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

  let main: string
  // 只在 packages 多于 1 个时才需要用户手动选择指定
  if (packages.length > 1) {
    const { mainPackage } = await inquirer.prompt<{ mainPackage: string }>([
      {
        type: 'list',
        name: 'mainPackage',
        message: 'Select the main package',
        choices: packages.map((pkg) => pkg.name),
      },
    ])
    main = mainPackage
  } else {
    main = packages[0].name
  }

  return { layout, packages, main }
}
