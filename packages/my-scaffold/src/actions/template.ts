import type { ActionType } from 'plop'
import { resolveTemplate, type Template } from '#templates'

export function addTemplate(path: string, template: Template, data: Record<string, unknown> = {}): ActionType {
  const layoutTemplate = resolveTemplate(template)
  return {
    type: 'addMany',
    destination: path,
    base: layoutTemplate,
    templateFiles: `${layoutTemplate}/**/*`,
    data,
  }
}
