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

export function gitInit(path: string): ActionType {
  return async () => {
    await execa('git', ['init'], {
      cwd: path,
      stdio: 'inherit',
    })
    return 'git initialized'
  }
}
