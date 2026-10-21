import { z } from 'zod'

export const baseBranch = z
  .string()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9/._-]*$/, 'Enter a branch name, such as main or release/next')
  .refine(
    (value) =>
      !value.includes('..') &&
      !value.includes('//') &&
      !value.endsWith('.') &&
      !value.endsWith('/') &&
      value.split('/').every((part) => !part.startsWith('.') && !part.endsWith('.lock')),
    'Enter a valid Git branch name',
  )
  .describe('Release branch; must match the branch used for version PRs and publishing')

export const repository = z
  .string()
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\/[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/, 'Use owner/repository')
  .describe('GitHub repository in owner/repository form')

export const pnpmVersion = z.string().regex(/^\d+\.\d+\.\d+$/, 'Enter an exact pnpm version, such as 11.21.0')
export const buildScript = z.string().regex(/^[a-zA-Z][a-zA-Z0-9:_-]*$/, 'Enter a package.json script name')

export const localSchema = z.strictObject({ baseBranch }).meta({
  description: 'Set up local Changesets releases with an all-packages release commit message.',
  examples: [{ baseBranch: 'main' }],
})

export const ciSchema = z
  .strictObject({
    repository,
    baseBranch,
    access: z.enum(['public', 'restricted']).default('public').describe('Default npm access for published packages'),
    nodeVersion: z.enum(['22', '24', '26']).default('24').describe('Node.js major version for release jobs'),
    pnpmVersion: pnpmVersion
      .optional()
      .describe('Required if package.json has no exact pnpm packageManager pin; must match an existing pin'),
    buildScript: z
      .union([buildScript, z.literal(false)])
      .default('build')
      .describe('Existing root package.json script to run before packing; false skips the build'),
  })
  .meta({
    description: 'Set up Changesets version PRs and npm trusted publishing on GitHub Actions in a pnpm project.',
    examples: [{ repository: 'example/project', baseBranch: 'main', pnpmVersion: '11.21.0' }],
  })

export type LocalInput = z.input<typeof localSchema>
export type CiInput = z.input<typeof ciSchema>
