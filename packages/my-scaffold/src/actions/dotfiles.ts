import { readdir, rename } from 'node:fs/promises'
import { join } from 'node:path'
import type { ActionType } from 'plop'

export function renameDotfiles(path: string): ActionType {
  return async () => {
    async function walk(dir: string) {
      const entries = await readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullpath = join(dir, entry.name)
          await walk(fullpath)
        }
      }

      for (const entry of entries) {
        if (entry.name.startsWith('_')) {
          const oldpath = join(dir, entry.name)
          const newpath = join(dir, `.${entry.name.slice(1)}`)
          await rename(oldpath, newpath)
        }
      }
    }

    await walk(path)
    return 'dotfiles renamed'
  }
}
