import { existsSync } from 'node:fs'
import { realpath } from 'node:fs/promises'
import { join } from 'node:path'
import execa from 'execa'
import type { ActionType } from 'plop'
import { addTemplate } from '#actions/template'
import { Template } from '#templates'
import type { PromptCargoPackageAnswer } from './prompts'

export function resolveRustVersion() {
  const { stdout } = execa.sync('rustc', ['--version'])
  const version = /^rustc (\d+\.\d+\.\d+)(?: |$)/.exec(stdout)?.[1]
  if (!version) throw new Error('cargo/init requires a stable Rust toolchain to pin rust-toolchain.toml')

  const [major, minor] = version.split('.').map(Number)
  if (major < 1 || (major === 1 && minor < 85)) {
    throw new Error('cargo/init requires Rust 1.85 or newer for edition 2024')
  }
  return version
}

export function addCargoPackage(path: string, pkg: PromptCargoPackageAnswer): ActionType {
  const ignore = []
  if (!pkg.targets.includes('lib')) ignore.push('src/lib.rs')
  if (!pkg.targets.includes('bin')) ignore.push('src/main.rs')

  return addTemplate(
    join(path, 'crates', pkg.directory),
    Template.CargoPkg,
    { pkgName: pkg.name, publish: pkg.publish },
    ignore,
  )
}

export function checkCargoWorkspace(path: string, pkg: PromptCargoPackageAnswer): ActionType {
  return async () => {
    const { stdout } = await execa('cargo', ['metadata', '--no-deps', '--format-version', '1'], { cwd: path })
    const metadata = JSON.parse(stdout) as {
      workspace_root: string
      packages: { name: string }[]
    }
    if ((await realpath(metadata.workspace_root)) !== (await realpath(path))) {
      throw new Error('Run cargo/pkg with the Cargo workspace root as the target directory')
    }
    if (metadata.packages.some(({ name }) => name === pkg.name)) {
      throw new Error(`Crate ${pkg.name} already exists in the workspace`)
    }
    if (existsSync(join(path, 'crates', pkg.directory))) {
      throw new Error(`Directory crates/${pkg.directory} already exists`)
    }
    return 'Cargo workspace checked'
  }
}

export function cargoLockfile(path: string): ActionType {
  return async () => {
    await execa('cargo', ['update', '--workspace'], { cwd: path, stdio: 'inherit' })
    return 'Cargo.lock updated'
  }
}
