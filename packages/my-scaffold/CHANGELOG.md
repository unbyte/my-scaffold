# @unbyte/my-scaffold

## 0.11.0

### Minor Changes

- 46675ae: feat: add electron app generator

## 0.10.0

### Minor Changes

- ad1614c: Choose how to release a monorepo after creating it:

  - Run `ms changeset/local` for local versioning and publishing, with release commits listing all changed packages.
  - Run `ms changeset/ci` for GitHub version pull requests and automated npm publishing. Setup infers your GitHub repository from Git origin and collects workflow settings. It includes instructions for npm trusted publishing.

  Both generators infer the release branch from Git origin HEAD and ask when it is unavailable. Explicit `repository` and `baseBranch` inputs override Git inference.

  `mono/init` now creates the workspace without Changesets. Run one of the new generators at the workspace root to add release support. Remove `releaseStyle` and `main` from existing `mono/init` JSON inputs; release messages now always use the all-packages style.

- 37d869d: Scaffold projects from scripts and coding agents without answering prompts. Pass your configuration with `--input <file>` or pipe JSON through `--input -`. Interactive prompts remain available in a terminal.

  - Inspect accepted inputs with `ms <generator> --schema`, see examples with `--help`, and list generators with `ms list --json`.
  - Use `--non-interactive` to fail when required input is missing instead of prompting.
  - Skip pnpm installation with `--no-install` or Git initialization with `--no-git`.

  Requires Node.js 18.3 or newer. `vite/init` now requires an empty or nonexistent target directory.

## 0.9.0

### Minor Changes

- a74985b: feat: use typescript 7 and tsdown in monorepo templates
- d08ca24: feat: use project references in monorepo templates

### Patch Changes

- e4ef431: chore: bump monorepo template dependencies

## 0.8.0

### Minor Changes

- afe2477: feat: add templates for cargo workspace

## 0.7.5

### Patch Changes

- 4e9a786: feat: bump pnpm action to v6

  it supports the devEngines.packageManager

## 0.7.4

### Patch Changes

- 8cf99df: fix: write message.js in esm after mark workspace as module

## 0.7.3

### Patch Changes

- af33473: fix: `devEngines.packageManager.version` must only allow versions within one major version
- 4adc31b: feat: mark workspace root as module

## 0.7.2

### Patch Changes

- 0d29a1a: feat: accept custom package directory name
- 6347678: feat: specify pnpm version in standard devEngines

## 0.7.1

### Patch Changes

- 7cdf6a1: tpl: reduce biome line width to 100
- 151907d: tpl: add coverage dir to gitignore list

## 0.7.0

### Minor Changes

- 8e956ca: feat: decide release commit style for monorepo

## 0.6.1

### Patch Changes

- fb4d921: tpl: build workspace deps on publish via `turbo run build`

## 0.6.0

### Minor Changes

- 3b121e6: feat: resolve default git branch when init monorepo

## 0.5.0

### Minor Changes

- 6b40306: feat: allow both lib and bin targets for packages

## 0.4.0

### Minor Changes

- 9b420fa: tpl: add template for adding wrangler to vite project

## 0.3.0

### Minor Changes

- 5975d66: tpl: add new template for vite projects

### Patch Changes

- 35475a4: feat: bump pnpm to v11.9.0

## 0.2.0

### Minor Changes

- 7228923: tpl: add new template for simple script project
- e20b9e1: refactor!: dispatch multiple generators by cli arg

### Patch Changes

- 4a71271: feat: improve error handling for missing generator argument in CLI

## 0.1.1

### Patch Changes

- f0e3640: tpl(private): set type to module
