import { readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import type { Actions, NodePlopAPI } from 'plop'
import { pnpmAdd } from '#actions/install'
import { modifyJson } from '#actions/json'
import { addTemplate } from '#actions/template'
import { Template } from '#templates'
import { promptViteWrangler } from './prompts'

export default function (plop: NodePlopAPI) {
  const output = plop.getDestBasePath()

  plop.setGenerator('vite/wrangler', {
    description: 'Add Cloudflare Wrangler to a Vite project',
    prompts: promptViteWrangler,
    actions: () => {
      const actions: Actions = []

      const pkgPath = join(output, 'package.json')
      const pkgName = readPackageName(pkgPath) ?? basename(output)
      const compatibilityDate = new Date().toISOString().slice(0, 10)

      actions.push(pnpmAdd(output, ['wrangler'], { dev: true }))
      actions.push(addTemplate(output, Template.ViteWrangler, { pkgName, compatibilityDate }))
      actions.push(
        modifyJson(pkgPath, (json: { scripts?: Record<string, string> }) => {
          json.scripts = {
            ...json.scripts,
            'cf:dev': 'wrangler dev',
            'cf:stage': 'pnpm build && wrangler versions upload --preview-alias staging',
          }
          return json
        }),
      )

      return actions
    },
  })
}

function readPackageName(path: string): string | undefined {
  try {
    const content = readFileSync(path, 'utf8')
    const json = JSON.parse(content) as { name?: string }
    return json.name
  } catch {
    // ignore
  }
}
