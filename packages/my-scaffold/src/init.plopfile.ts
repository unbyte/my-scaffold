import type { Actions, NodePlopAPI } from 'plop'
import { addPackage, gitInit, initRepo, pnpmInstall, renameDotfiles } from './actions'
import { type PromptInitAnswer, promptInit } from './prompts'

export default function (plop: NodePlopAPI) {
  const output = plop.getDestBasePath()

  plop.setGenerator('init', {
    description: 'Generate a new monorepo',
    prompts: promptInit,
    actions: (_answer) => {
      const answer = _answer as PromptInitAnswer

      const actions: Actions = []

      // 先输出 layout
      actions.push(initRepo(output, answer))

      // 重命名 dotfiles
      actions.push(renameDotfiles(output))

      // 循环输出 packages
      for (const pkg of answer.packages) {
        actions.push(addPackage(output, pkg))
      }

      // 初始化 git 和 pnpm
      actions.push(gitInit(output))
      actions.push(pnpmInstall(output))

      return actions
    },
  })
}
