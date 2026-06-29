import { join } from 'node:path'
import type { Actions, NodePlopAPI } from 'plop'
import { gitInit, pnpmCreate, pnpmInstall } from '#actions/install'
import { mergeJson } from '#actions/json'
import { addTemplate } from '#actions/template'
import { resolveTemplate, Template } from '#templates'
import { promptViteInit } from './prompts'

export default function (plop: NodePlopAPI) {
  const output = plop.getDestBasePath()

  plop.setGenerator('vite/init', {
    description: 'Generate a new Vite project',
    prompts: promptViteInit,
    actions: () => {
      const actions: Actions = []

      actions.push(pnpmCreate(output, ['vite', '.']))
      actions.push(addTemplate(output, Template.ViteLayout, {}, ['package.json']))
      actions.push(mergeJson(join(output, 'package.json'), join(resolveTemplate(Template.ViteLayout), 'package.json')))
      actions.push(gitInit(output))
      actions.push(pnpmInstall(output))

      return actions
    },
  })
}
