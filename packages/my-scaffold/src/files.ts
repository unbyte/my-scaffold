import { lstat, readdir } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

export async function pathStats(path: string) {
  try {
    return await lstat(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

export async function checkDirectory(path: string) {
  const stats = await pathStats(path)
  if (stats && (!stats.isDirectory() || stats.isSymbolicLink())) {
    throw new Error(`Expected a directory, not a file or symlink: ${path}`)
  }
}

export async function checkNewPath(root: string, path: string) {
  const base = resolve(root)
  const destination = resolve(base, path)
  const local = relative(base, destination)
  if (!local || local === '..' || local.startsWith(`..${sep}`) || isAbsolute(local)) {
    throw new Error(`Path must be inside the target directory: ${path}`)
  }
  let parent = base
  await checkDirectory(parent)
  const parents = relative(base, dirname(destination))
  for (const part of parents ? parents.split(sep) : []) {
    parent = resolve(parent, part)
    await checkDirectory(parent)
  }
  if (await pathStats(destination)) throw new Error(`Path already exists: ${destination}`)
  return destination
}

export async function checkEmptyDirectory(path: string) {
  await checkDirectory(path)
  if ((await pathStats(path)) && (await readdir(path)).length > 0) {
    throw new Error(`Expected an empty target directory: ${path}`)
  }
}
