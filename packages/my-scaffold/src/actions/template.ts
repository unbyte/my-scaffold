import type { ActionType } from 'plop'
import { resolveTemplate, type Template } from '#templates'

export function addTemplate(
  path: string,
  template: Template,
  data: Record<string, unknown> = {},
  ignore: string[] = [],
): ActionType {
  const layoutTemplate = resolveTemplate(template)
  return {
    type: 'addMany',
    destination: path,
    base: layoutTemplate,
    templateFiles: `${layoutTemplate}/**/*`,
    globOptions: { ignore: ignore.map((pattern) => `${layoutTemplate}/${pattern}`) },
    data,
  }
}
