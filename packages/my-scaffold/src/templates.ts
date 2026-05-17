import { resolve } from 'node:path'

export enum Template {
  MonorepoLayout = 'monorepo-layout',
  ScriptLayout = 'script-layout',
  MonorepoPkgUniversal = 'monorepo-pkg-universal',
  MonorepoPkgNode = 'monorepo-pkg-node',
  MonorepoPkgCli = 'monorepo-pkg-cli',
  MonorepoPkgPrivate = 'monorepo-pkg-private',
}

export type LayoutTemplate = Template.MonorepoLayout | Template.ScriptLayout

export type PackageTemplate =
  | Template.MonorepoPkgUniversal
  | Template.MonorepoPkgNode
  | Template.MonorepoPkgCli
  | Template.MonorepoPkgPrivate

export function resolveTemplate(template: Template) {
  // from lib/index.js -> templates/
  return resolve(__dirname, '..', 'templates', template)
}
