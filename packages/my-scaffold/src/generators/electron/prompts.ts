import type { z } from 'zod'
import { validateWith } from '../input'
import { electronAppId, electronName, type electronSchema } from './schema'

export async function promptElectronInit() {
  const { default: inquirer } = await import('inquirer')
  return inquirer.prompt<z.input<typeof electronSchema>>([
    { type: 'input', name: 'name', message: 'App package name', validate: validateWith(electronName) },
    {
      type: 'input',
      name: 'appId',
      message: 'Application ID',
      default: electronAppId.parse(undefined),
      validate: validateWith(electronAppId),
    },
  ])
}
