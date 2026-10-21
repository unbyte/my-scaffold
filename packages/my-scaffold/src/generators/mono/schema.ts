import { z } from 'zod'
import { buildTargets, checkPackageDuplicates, directoryName } from '../../input'
import { Template } from '../../templates'

export const packageName = z
  .string()
  .max(214)
  .regex(/^(@[a-z0-9~][a-z0-9-._~]*\/)?[a-z0-9~][a-z0-9-._~]*$/, 'Invalid npm package name')

export const binaryName = z.string().regex(/^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/, 'Invalid binary name')

const packageFields = {
  name: packageName.describe('npm package name, optionally scoped'),
  directory: directoryName.optional().describe('Directory inside packages/; defaults to the unscoped package name'),
}

export const publicPackageSchema = z
  .strictObject({
    ...packageFields,
    access: z.literal('public'),
    targets: buildTargets,
    bin: binaryName.optional().describe('Required when targets includes bin; otherwise omit'),
  })
  .superRefine((pkg, context) => {
    if (pkg.targets.includes('bin') !== (pkg.bin !== undefined)) {
      context.addIssue({ code: 'custom', path: ['bin'], message: 'Provide bin exactly when targets includes bin' })
    }
  })

export const packageSchema = z
  .discriminatedUnion('access', [
    publicPackageSchema,
    z.strictObject({ ...packageFields, access: z.literal('private') }),
  ])
  .superRefine((pkg, context) => {
    if (!directoryName.safeParse(packageDirectory(pkg)).success) {
      context.addIssue({ code: 'custom', path: ['directory'], message: 'Provide a portable directory name' })
    }
  })
  .meta({
    description: 'A monorepo package. Private packages are unbundled; public packages select lib and/or bin targets.',
    examples: [{ name: '@example/core', access: 'public', targets: ['lib'] }],
  })

export type PackageInput = z.input<typeof packageSchema>
export type PackageConfig = z.output<typeof packageSchema>

export function packageDirectory(pkg: { name: string; directory?: string }) {
  return pkg.directory ?? pkg.name.split('/').pop()!
}

export function primaryCandidates(packages: PackageInput[]) {
  const publicPackages = packages.filter((pkg) => pkg.access === 'public')
  return publicPackages.length > 0 ? publicPackages : packages
}

export const monorepoSchema = z
  .strictObject({
    packages: z.array(packageSchema).min(1),
    releaseStyle: z.enum(['primary', 'all']).default('primary'),
    main: packageName
      .optional()
      .describe('Primary package; inferred only when there is one eligible package. Omit for all.'),
  })
  .superRefine((input, context) => {
    checkPackageDuplicates(
      input.packages.map((pkg) => ({ ...pkg, directory: packageDirectory(pkg) })),
      context,
    )
    if (input.releaseStyle === 'all') {
      if (input.main !== undefined) {
        context.addIssue({ code: 'custom', path: ['main'], message: 'Omit main when releaseStyle is all' })
      }
      return
    }
    const candidates = primaryCandidates(input.packages)
    if (input.main === undefined && candidates.length > 1) {
      context.addIssue({
        code: 'custom',
        path: ['main'],
        message: 'Select a primary package when several are eligible',
      })
    } else if (input.main !== undefined && !candidates.some((pkg) => pkg.name === input.main)) {
      context.addIssue({
        code: 'custom',
        path: ['main'],
        message: 'Select an existing public package, or a private package if none are public',
      })
    }
  })
  .meta({
    description: 'A monorepo with unique package names and directories. Primary releases prefer public packages.',
    examples: [{ packages: [{ name: '@example/core', access: 'public' }], releaseStyle: 'primary' }],
  })

export type MonorepoInput = z.input<typeof monorepoSchema>

export function normalizePackage(pkg: PackageConfig) {
  let template = Template.MonorepoPkgPrivate
  if (pkg.access === 'public') {
    template = pkg.targets.includes('bin')
      ? pkg.targets.includes('lib')
        ? Template.MonorepoPkgBinLib
        : Template.MonorepoPkgBin
      : Template.MonorepoPkgLib
  }
  return {
    name: pkg.name,
    directory: packageDirectory(pkg),
    template,
    bin: pkg.access === 'public' ? pkg.bin : undefined,
  }
}

export function normalizeMonorepo(input: z.output<typeof monorepoSchema>) {
  return {
    packages: input.packages.map(normalizePackage),
    releaseStyle: input.releaseStyle,
    main: input.releaseStyle === 'primary' ? (input.main ?? primaryCandidates(input.packages)[0].name) : undefined,
  }
}
