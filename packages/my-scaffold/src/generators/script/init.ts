import { gitInit, pnpmInstall } from '../../commands'
import { defineGenerator } from '../../generator'
import { renderTemplate } from '../../template'
import { Template } from '../../templates'
import { scriptSchema } from './schema'

export const scriptInit = defineGenerator({
  description: 'Generate a new script project',
  schema: scriptSchema,
  async generate(_input, context) {
    await renderTemplate(context.target, Template.ScriptLayout)
    if (context.git) await gitInit(context.target)
    if (context.install) await pnpmInstall(context.target)
  },
})
