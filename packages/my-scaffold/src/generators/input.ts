import { z } from 'zod'

export const directoryName = z
  .string()
  .regex(/^[a-zA-Z0-9_~][a-zA-Z0-9._~-]*$/, 'Use a single directory name')
  .refine((name) => !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(name) && !name.endsWith('.'), {
    message: 'Use a portable directory name',
  })

export const buildTargets = z
  .array(z.enum(['lib', 'bin']))
  .min(1, 'Select at least one target')
  .max(2)
  .refine((targets) => new Set(targets).size === targets.length, 'Targets must be unique')
  .default(['lib'])
  .describe('Build targets; each target may appear only once')

export function validateWith(schema: z.ZodType) {
  return (value: unknown) => {
    const result = schema.safeParse(value)
    return result.success || result.error.issues[0].message
  }
}

export function checkPackageDuplicates(packages: { name: string; directory: string }[], context: z.RefinementCtx) {
  const names = new Set<string>()
  const directories = new Set<string>()
  for (const [index, pkg] of packages.entries()) {
    if (names.has(pkg.name)) {
      context.addIssue({ code: 'custom', path: ['packages', index, 'name'], message: 'Package name already used' })
    }
    const directory = pkg.directory.toLowerCase()
    if (directories.has(directory)) {
      context.addIssue({
        code: 'custom',
        path: ['packages', index, 'directory'],
        message: 'Directory name already used',
      })
    }
    names.add(pkg.name)
    directories.add(directory)
  }
}
