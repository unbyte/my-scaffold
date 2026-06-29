import { mkdir } from 'node:fs/promises'
import execa from 'execa'
import type { ActionType } from 'plop'

export function pnpmInstall(path: string): ActionType {
  return async () => {
    await execa('pnpm', ['i'], {
      cwd: path,
      stdio: 'inherit',
    })
    return 'pnpm installed'
  }
}

// Runs `pnpm create <args>` with the TTY inherited, so generators can delegate
// to interactive scaffolders (e.g. `pnpm create vite`).
export function pnpmCreate(path: string, args: string[]): ActionType {
  return async () => {
    await mkdir(path, { recursive: true })
    await execa('pnpm', ['create', ...args], {
      cwd: path,
      stdio: 'inherit',
    })
    return `pnpm created (${args.join(' ')})`
  }
}

export function gitInit(path: string): ActionType {
  return async () => {
    await execa('git', ['init'], {
      cwd: path,
      stdio: 'inherit',
    })
    return 'git initialized'
  }
}
