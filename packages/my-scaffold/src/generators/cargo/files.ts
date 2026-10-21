import { realpath } from 'node:fs/promises'
import { join } from 'node:path'
import execa from 'execa'
import { runCommand } from '../../commands'
import { checkDirectory } from '../../files'
import { renderTemplate } from '../../template'
import { Template } from '../../templates'
import type { normalizeCrate } from './schema'

type Crate = ReturnType<typeof normalizeCrate>

export function resolveRustVersion() {
  const { stdout } = execa.sync('rustc', ['--version'], { stdin: 'ignore' })
  const version = /^rustc (\d+\.\d+\.\d+)(?: |$)/.exec(stdout)?.[1]
  if (!version) throw new Error('cargo/init requires a stable Rust toolchain to pin rust-toolchain.toml')
  const [major, minor] = version.split('.').map(Number)
  if (major < 1 || (major === 1 && minor < 85)) {
    throw new Error('cargo/init requires Rust 1.85 or newer for edition 2024')
  }
  return version
}

export function addCrate(path: string, pkg: Crate) {
  const exclude = []
  if (!pkg.targets.includes('lib')) exclude.push('src/lib.rs')
  if (!pkg.targets.includes('bin')) exclude.push('src/main.rs')
  return renderTemplate(
    join(path, 'crates', pkg.directory),
    Template.CargoPkg,
    { pkgName: pkg.name, publish: pkg.publish },
    exclude,
  )
}

export async function checkCargoWorkspace(path: string, pkg: Crate) {
  await checkDirectory(path)
  const { stdout } = await execa('cargo', ['metadata', '--no-deps', '--format-version', '1'], {
    cwd: path,
    stdin: 'ignore',
  })
  const metadata = JSON.parse(stdout) as { workspace_root: string; packages: { name: string }[] }
  if ((await realpath(metadata.workspace_root)) !== (await realpath(path))) {
    throw new Error('Run cargo/pkg with the Cargo workspace root as the target directory')
  }
  if (metadata.packages.some(({ name }) => name === pkg.name)) {
    throw new Error(`Crate ${pkg.name} already exists in the workspace`)
  }
}

export function cargoLockfile(path: string) {
  return runCommand(path, 'cargo', ['update', '--workspace'])
}
