import { readdir, rename } from 'node:fs/promises'
import { join } from 'node:path'
import execa from 'execa'
import type { ActionType } from 'plop'
import type { PromptInitAnswer, PromptPackageAnswer } from './prompts'
import { resolveTemplate } from './templates'

export function addPackage(path: string, pkg: PromptPackageAnswer): ActionType {
  // 如果包含 scope, 只取 name
  const dirname = pkg.name.split('/').pop()!

  const templateBase = resolveTemplate(pkg.template)

  return {
    type: 'addMany',
    destination: join(path, 'packages', dirname),
    base: templateBase,
    templateFiles: `${templateBase}/**/*`,
    data: {
      pkgName: pkg.name,
      binName: pkg.bin,
    },
  }
}

export function initRepo(path: string, repo: PromptInitAnswer): ActionType {
  const layoutTemplate = resolveTemplate(repo.layout)
  return {
    type: 'addMany',
    destination: path,
    base: layoutTemplate,
    templateFiles: `${layoutTemplate}/**/*`,
    data: {
      main: repo.main,
    },
  }
}

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

export function renameDotfiles(path: string): ActionType {
  return async () => {
    async function walk(dir: string) {
      const entries = await readdir(dir, { withFileTypes: true })

      // 先重命名子目录中的 dotfiles
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullpath = join(dir, entry.name)
          await walk(fullpath)
        }
      }

      // 再处理当前目录下的
      for (const entry of entries) {
        // 这回不区分是否为目录
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
