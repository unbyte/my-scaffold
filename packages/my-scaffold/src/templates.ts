import { dirname, join } from 'node:path'
import { name } from '../package.json'

export enum Template {
  MonorepoLayout = 'monorepo-layout',
  MonorepoPkgCli = 'monorepo-pkg-cli',
  MonorepoPkgNode = 'monorepo-pkg-node',
  MonorepoPkgPrivate = 'monorepo-pkg-private',
  MonorepoPkgUniversal = 'monorepo-pkg-universal',
  ScriptLayout = 'script-layout',
}

export function resolveTemplate(template: Template) {
  const packageRoot = dirname(require.resolve(`${name}/package.json`))
  return join(packageRoot, 'templates', template)
}
