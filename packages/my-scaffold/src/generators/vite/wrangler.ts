import { basename, join } from 'node:path'
import { pnpmInstall } from '../../actions/commands'
import { checkDirectory } from '../../actions/files'
import { modifyJson, readJson } from '../../actions/json'
import { renderTemplate } from '../../actions/template'
import { Template } from '../../templates'
import { defineGenerator } from '../definition'
import { wranglerSchema } from './schema'

interface PackageJson {
  name?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

export const viteWrangler = defineGenerator({
  description: 'Add Cloudflare Wrangler to a Vite project',
  schema: wranglerSchema,
  async generate(_input, context) {
    await checkDirectory(context.target)
    const pkgPath = join(context.target, 'package.json')
    const pkg = await readJson<PackageJson>(pkgPath)
    await renderTemplate(context.target, Template.ViteWrangler, {
      pkgName: pkg.name ?? basename(context.target),
      compatibilityDate: new Date().toISOString().slice(0, 10),
    })
    await modifyJson<PackageJson>(pkgPath, (json) => {
      json.scripts = {
        ...json.scripts,
        'cf:dev': 'wrangler dev',
        'cf:stage': 'pnpm build && wrangler versions upload --preview-alias staging',
      }
      if (!json.dependencies?.wrangler && !json.devDependencies?.wrangler) {
        json.devDependencies = { ...json.devDependencies, wrangler: '^4' }
      }
      return json
    })
    if (context.install) await pnpmInstall(context.target)
  },
})
