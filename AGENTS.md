# my-scaffold

`@unbyte/my-scaffold` is the `ms` CLI for personal project layouts. This pnpm + Turbo monorepo contains one package, `packages/my-scaffold`.

## Commands

Run from the repository root:

- `pnpm build` — bundle the CLI with tsup through Turbo.
- `pnpm check` — Biome lint and formatting checks.
- `pnpm check:types` — TypeScript checks for source and tests.
- `pnpm test` — Vitest tests under `packages/*/tests/`. Generated template tests are excluded.
- `pnpm fix` — Biome autofix and import organization; also runs on staged TypeScript and JSON through lefthook.
- `pnpm go <generator> [target-dir]` — run the source CLI through tsx.

For a generator smoke check, use a disposable directory under `playground/` (gitignored):

```sh
pnpm go mono/init ./playground/example --input scaffold.json --no-install --no-git
pnpm go mono/init --schema
```

Input files are resolved relative to the invocation's working directory. `--input -` reads JSON from stdin. Generators never prompt when input is supplied. Without input, prompts require a terminal; generators with empty input schemas can run unattended.

`--no-install` skips pnpm installation, not create-vite or Cargo lockfile updates. `--no-git` skips Git initialization. Tests create isolated directories under `playground/` and remove them when finished. Real Cargo and Vite smoke checks require the corresponding toolchains and may access the network.

Releases use Changesets with `baseBranch: master`. `.changeset/message.js` owns release commit messages. Do not create release commits manually.

## Architecture

**CLI (`src/index.ts`, `src/cli.ts`).** The entry handles errors and exit status. The CLI uses Node's strict argument parser, selects interactive or JSON input, and invokes the generator. `ms list --json`, per-generator `--help`, and `--schema` are discovery commands and must not inspect the destination or invoke external tools.

**Registry (`src/generators/index.ts`).** This object is the single source of truth for generator names, descriptions, input schemas, prompts, and implementations. Use explicit imports; generators do not need separate build entries.

**Generator contract (`src/generators/definition.ts`).** `defineGenerator` couples a Zod schema to an optional prompt function and a typed async `generate` function. Its `run` method accepts unknown input, validates it, and only then invokes generation. Context contains the resolved target and the `install` and `git` options. There is no action format or execution interpreter: generators call ordinary helpers in sequence.

**Input (`src/generators/<group>/schema.ts`, `src/generators/input.ts`).** Each generator declares a public, strict Zod input schema. Infer input and parsed types from schemas. Reuse domain schemas between initialization and package generators. Keep public input exportable with `z.toJSONSchema(schema, { io: 'input' })`; descriptions must explain runtime constraints that JSON Schema cannot represent. Store static defaults in schemas. Derive directory names and internal template choices in normalization functions. Read environment-dependent values in generation preparation.

**Prompts (`src/generators/<group>/prompts.ts`).** Collect the same public input shape accepted from JSON. Prompts receive the resolved target and may read project settings to offer choices; they must not change files. Import Inquirer lazily so discovery and unattended generation do not load the prompt library. Reuse schema validators and defaults for prompt feedback. Prompts may read local Git metadata to infer input, but do not select internal templates, write files, or run commands that change state. Final validation remains authoritative for both input sources.

**Generators (`src/generators/<group>/*.ts`).** Normalize validated input, check workspace prerequisites, and perform generation through direct async calls. Group-specific file helpers live beside the generators. Complete checks that can be performed upfront before modifying files. Propagate failures; generation does not promise rollback.

**Shared actions (`src/actions/`).** Keep reusable filesystem, rendering, JSON, and command operations here. Generator contracts and shared input rules belong in `src/generators/`; the source root contains the CLI and template registry.

- `src/actions/template.ts` copies template trees using Handlebars. It renders text, preserves binary files and executable bits, maps `_` path segments to dotfiles, and checks all destinations for that template before writing. It rejects existing files and symlink traversal inside the target.
- `src/actions/files.ts` checks directories and new destination paths.
- `src/actions/json.ts` reads and modifies regular JSON files, writes two-space indentation with a trailing newline, and merges objects recursively with source scalars and arrays taking precedence.
- `src/actions/commands.ts` runs commands with explicit working directories and closed stdin. Errors propagate. Generators decide whether to install dependencies or initialize Git; declaring dependencies must not depend on installation being enabled.

**Changesets (`src/generators/changeset/`).** `mono/init` does not configure releases. Run `changeset/local` or `changeset/ci` at the generated workspace root. Both use all-packages release messages. Local setup supplies a CommonJS commit hook; CI setup supplies Changesets v2 sub-actions (requiring Changesets CLI 3), a pnpm pin, GitHub changelogs, and npm trusted publishing instructions. CI reads the existing `packages/` layout through `mono/files.ts`'s `listPackages`, also used by `mono/pkg`, and sets repository metadata on public packages. Explicit repository input takes precedence over Git origin inference. Both generators infer the release branch from local `origin/HEAD`, with explicit `baseBranch` taking precedence. Git inference only applies at the target Git root, never uses the checkout branch, makes no network requests, and is never performed during discovery. Preflight existing setup, workflow paths, package manifests, the pnpm pin, and the build script before writes. GitHub expressions in Handlebars templates must escape their opening braces so rendering preserves them.

## Templates and build

Templates live in `packages/my-scaffold/templates/<name>/`. `Template` in `src/templates.ts` maps variants to directory names. Template resolution is relative to `src/` in development and `lib/` in the published package; it must work without a package self-link.

Store template dotfiles with `_` prefixes (`_gitignore`, `_github/`, `_changeset/`). The copier changes these path segments during copying, without recursively renaming unrelated destination files. Handlebars variables must match the data supplied by the generator. Missing variables fail rendering.

Templates are excluded from Biome and source type checks. Dependencies and tests inside them belong to generated projects, not this repository.

`tsup.config.ts` bundles `src/index.ts` into one CommonJS executable in `lib/`, targeting Node 18. The package publishes `lib/` and `templates/`; `publishConfig.bin` points to `lib/index.js`. Runtime dependencies must be declared directly. The CLI requires Node 18.3+; development tools and generated projects can require newer versions.

## Adding a generator

1. Define a strict public input schema with descriptions and an example; reuse existing domain schemas where appropriate.
2. Add an optional prompt adapter returning the schema's input shape.
3. Define the generator with `defineGenerator` and an async generation function. Validate through `run` before side effects and keep environment checks out of module initialization.
4. Add it to the registry. No build entry change is needed.
5. Test input constraints, resulting files, and relevant failure behavior. Ensure schema export and CLI discovery work without external tools.

## Adding a template

1. Create the template tree with `_`-prefixed dotfiles.
2. Register its directory in the `Template` enum.
3. Supply all rendering variables through `renderTemplate` and test meaningful output behavior.

See `packages/my-scaffold/README.md` for CLI usage and input examples.
