import type { z } from 'zod'

export interface GeneratorContext {
  target: string
  install: boolean
  git: boolean
}

export function defineGenerator<S extends z.ZodType>(definition: {
  description: string
  schema: S
  prompt?: () => Promise<z.input<S>>
  generate: (input: z.output<S>, context: GeneratorContext) => Promise<void>
}) {
  return {
    description: definition.description,
    schema: definition.schema,
    prompt: definition.prompt,
    async run(input: unknown, context: GeneratorContext) {
      await definition.generate(definition.schema.parse(input), context)
    },
  }
}
