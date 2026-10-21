import { z } from 'zod'
import { buildTargets, checkPackageDuplicates } from '../../input'

const reservedNames = new Set(
  `as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut
  pub ref return self static struct super trait true type unsafe use where while abstract become box do final gen
  macro override priv try typeof unsized virtual yield`.split(/\s+/),
)

export const crateDirectory = z
  .string()
  .regex(/^[a-z][a-z0-9_-]*$/, 'Use a single directory name starting with a lowercase letter')
  .refine((name) => !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/.test(name), 'Use a portable directory name')

export const crateName = crateDirectory.max(64).refine((name) => !reservedNames.has(name), 'Invalid crate name')

export const crateSchema = z
  .strictObject({
    name: crateName,
    directory: crateDirectory.optional().describe('Directory inside crates/; defaults to the crate name'),
    publish: z.boolean().default(false),
    targets: buildTargets,
  })
  .meta({ examples: [{ name: 'core', targets: ['lib'], publish: false }] })

export type CrateInput = z.input<typeof crateSchema>

export function normalizeCrate(input: z.output<typeof crateSchema>) {
  return { ...input, directory: input.directory ?? input.name }
}

export const cargoWorkspaceSchema = z
  .strictObject({ packages: z.array(crateSchema).min(1) })
  .superRefine((input, context) => checkPackageDuplicates(input.packages.map(normalizeCrate), context))
  .meta({
    description: 'A Cargo workspace with unique crate names and directories',
    examples: [{ packages: [{ name: 'core' }] }],
  })

export type CargoWorkspaceInput = z.input<typeof cargoWorkspaceSchema>
