import { resolve } from 'node:path'

export enum Template {
  MonorepoLayout = 'monorepo-layout',
  MonorepoPkgUniversal = 'monorepo-pkg-universal',
  MonorepoPkgNode = 'monorepo-pkg-node',
  MonorepoPkgCli = 'monorepo-pkg-cli',
  MonorepoPkgPrivate = 'monorepo-pkg-private',
}

export function resolveTemplate(template: Template) {
  // from lib/index.js -> templates/
  return resolve(__dirname, '..', 'templates', template)
}
