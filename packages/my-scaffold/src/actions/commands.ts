import execa from 'execa'

export async function runCommand(cwd: string, command: string, args: string[]) {
  await execa(command, args, { cwd, stdio: ['ignore', 'inherit', 'inherit'] })
}

export function pnpmInstall(path: string) {
  return runCommand(path, 'pnpm', ['install'])
}

export function gitInit(path: string) {
  return runCommand(path, 'git', ['init'])
}
