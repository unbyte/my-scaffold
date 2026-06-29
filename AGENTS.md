# CLAUDE.md

## What this is

`@unbyte/my-scaffold` is a CLI (`ms`) that scaffolds the author's personal project layouts. It's a thin wrapper around [Plop](https://plopjs.com): the CLI dispatches to one of several Plop generators, each of which prompts the user (via inquirer) and copies a template tree into the target directory.

This repo is itself a pnpm + Turbo monorepo, but currently contains a single package: `packages/my-scaffold`.

## Commands

Run from the repo root:

- `pnpm build` — build all packages via Turbo (delegates to `tsup` per package).
- `pnpm check` — Biome lint/format check (does **not** typecheck or run `tsc`).
- `pnpm fix` — Biome autofix + organize imports. Also runs automatically on staged `*.{ts,json}` via the lefthook pre-commit hook.

There are no tests in this repo (the `tsc`/vitest scripts you may see live inside the *generated template*, `templates/monorepo-layout/package.json`, not here).

To run the CLI locally without building, use the `go` script (runs the source entry via `tsx`):

```
pnpm go <generator> [target-dir]
# e.g.
pnpm go mono/init ./tmp-out
```

Releases use Changesets (`baseBranch: master`); the release commit message is forced to `chore(release): <version>` by `.changeset/message.js`, keyed off the `@unbyte/my-scaffold` version.

## Architecture

**Dispatch (`src/index.ts`).** Parses argv with minimist. `args._[0]` is the generator name; `args._[1]` is an optional target dir (defaults to cwd). The generator name maps directly to a plopfile path: `generators/<name>.plopfile`. The list of valid names lives in the `generators` array — **this array is the source of truth and must be kept in sync** with the actual plopfiles. Plop runs programmatically with `dest` set to the resolved target.

**Generators (`src/generators/<group>/<name>.plopfile.ts`).** Each plopfile default-exports a `(plop: NodePlopAPI) => void` that registers one generator with `prompts` + an `actions(answer)` callback returning an array of Plop actions. Generator names are slash-namespaced (`mono/init`, `mono/pkg`, `script/init`) and the slash maps to the directory layout. Prompts are factored into sibling `prompts.ts` files; the answer object is cast to a typed interface inside `actions`.

**Reusable actions (`src/actions/`).** Factory functions returning Plop `ActionType`s, shared across generators:
- `addTemplate` / `addPackage` — Plop `addMany` from a template dir (Handlebars-interpolated).
- `renameDotfiles` — recursively renames `_foo` → `.foo` after files are copied (see Templates below).
- `pnpmInstall`, `gitInit` — shell out via `execa`.

**Templates (`templates/<name>/`).** Plain file trees copied verbatim except for Handlebars placeholders like `{{ pkgName }}` and `{{ binName }}`, filled from the `data` passed to `addMany`. Two conventions matter:
- **Dotfiles are stored with a `_` prefix** (`_gitignore`, `_github/`, `_changeset/`) so they survive packaging and git, then `renameDotfiles` restores the leading dot at generation time. Any new dotfile in a template must use this prefix.
- Templates are **excluded from Biome** (`!**/templates` in `biome.json`) and are **not** type-checked or bundled, so their `.ts` files can reference dependencies that don't exist in this repo.

`Template` is an enum in `src/templates.ts` mapping each variant to its directory name. `resolveTemplate` locates the templates dir via `require.resolve('@unbyte/my-scaffold/package.json')`, which resolves correctly both in dev (against `src`) and from the published package (against `lib` + bundled `templates`).

**Build (`tsup.config.ts`).** Bundles to CJS in `lib/`. The entry list is `src/index.ts` **plus** `src/generators/**/*.plopfile.ts` — the plopfiles must be separate entries because they're loaded at runtime via `require.resolve`, not statically imported. A new generator therefore needs no tsup change (the glob covers it) but does need a `lib/index.js` shim only via the `generators` array registration.

The package uses Node subpath imports (`#templates`, `#actions/*`) declared in `packages/my-scaffold/package.json`. The published `bin` is overridden to `./lib/index.js` via `publishConfig`.

## Adding a generator

1. Create `src/generators/<group>/<name>.plopfile.ts` (default-export a function registering the generator) and a `prompts.ts` beside it.
2. Add `'<group>/<name>'` to the `generators` array in `src/index.ts`.
3. Reuse actions from `src/actions/` and `src/generators/<group>/actions.ts` where possible.

## Adding a template

1. Create `templates/<name>/` with the file tree; use `_`-prefixed names for dotfiles.
2. Add the variant to the `Template` enum in `src/templates.ts`.
3. Reference Handlebars vars (`{{ pkgName }}`, etc.) matching the `data` your action passes to `addMany`.
