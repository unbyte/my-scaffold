import type { z } from 'zod'
import { type viteSchema, viteTemplate } from './schema'

export async function promptViteInit() {
  const { default: inquirer } = await import('inquirer')
  return inquirer.prompt<z.input<typeof viteSchema>>([
    { type: 'list', name: 'template', message: 'Select Vite template', choices: viteTemplate.options },
  ])
}
