import { realpath } from 'node:fs/promises'
import execa from 'execa'
import { baseBranch, repository } from './schema'

export function parseGitHubRemote(remote: string) {
  let path: string
  const scp = /^(?:git@)?github\.com:(.+)$/.exec(remote)
  if (scp) {
    path = scp[1]
  } else {
    let url: URL
    try {
      url = new URL(remote)
    } catch {
      return undefined
    }
    if (
      url.hostname !== 'github.com' ||
      !['https:', 'http:', 'ssh:', 'git:'].includes(url.protocol) ||
      url.search ||
      url.hash
    )
      return undefined
    path = url.pathname.slice(1)
  }
  const result = repository.safeParse(path.replace(/\/$/, '').replace(/\.git$/, ''))
  return result.success ? result.data : undefined
}

export async function inferRepository(target: string) {
  const remote = await readGit(target, ['remote', 'get-url', 'origin'])
  return remote === undefined ? undefined : parseGitHubRemote(remote)
}

export async function inferBaseBranch(target: string) {
  const ref = await readGit(target, ['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD'])
  const prefix = 'refs/remotes/origin/'
  if (!ref?.startsWith(prefix)) return undefined
  const result = baseBranch.safeParse(ref.slice(prefix.length))
  return result.success ? result.data : undefined
}

export async function resolveBaseBranch(target: string, explicit?: string) {
  const branch = explicit ?? (await inferBaseBranch(target))
  if (branch === undefined) {
    throw new Error('Could not infer the release branch from origin/HEAD at the target Git root; provide baseBranch')
  }
  return branch
}

async function readGit(target: string, args: string[]) {
  try {
    const options = { cwd: target, stdin: 'ignore' as const }
    const root = await execa('git', ['rev-parse', '--show-toplevel'], options)
    if ((await realpath(root.stdout.trim())) !== (await realpath(target))) return undefined
    const result = await execa('git', args, options)
    return result.stdout.trim()
  } catch {
    return undefined
  }
}
