import { realpath } from 'node:fs/promises'
import execa from 'execa'
import { repository } from './schema'

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
  try {
    const options = { cwd: target, stdin: 'ignore' as const }
    const root = await execa('git', ['rev-parse', '--show-toplevel'], options)
    if ((await realpath(root.stdout.trim())) !== (await realpath(target))) return undefined
    const remote = await execa('git', ['remote', 'get-url', 'origin'], options)
    return parseGitHubRemote(remote.stdout.trim())
  } catch {
    return undefined
  }
}
