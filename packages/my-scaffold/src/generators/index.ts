import { cargoInit } from './cargo/init'
import { cargoPackage } from './cargo/pkg'
import { changesetCi } from './changeset/ci'
import { changesetLocal } from './changeset/local'
import { electronInit } from './electron/init'
import { monoInit } from './mono/init'
import { monoPackage } from './mono/pkg'
import { scriptInit } from './script/init'
import { viteInit } from './vite/init'
import { viteWrangler } from './vite/wrangler'

export const generators = {
  'cargo/init': cargoInit,
  'cargo/pkg': cargoPackage,
  'changeset/local': changesetLocal,
  'changeset/ci': changesetCi,
  'electron/init': electronInit,
  'mono/init': monoInit,
  'mono/pkg': monoPackage,
  'script/init': scriptInit,
  'vite/init': viteInit,
  'vite/wrangler': viteWrangler,
}

export function getGenerator(name: string) {
  if (!Object.hasOwn(generators, name)) throw new Error(`Unknown generator: ${name}`)
  return generators[name as keyof typeof generators]
}
