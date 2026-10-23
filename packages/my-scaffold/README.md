# @unbyte/my-scaffold

`ms` creates personal project layouts for TypeScript monorepos, Rust workspaces, scripts, Vite applications, and Electron desktop apps.

```sh
pnpm add -g @unbyte/my-scaffold
ms list
```

## Generate a project

Choose a generator and an optional target directory. The target defaults to the current directory.

```sh
ms mono/init ./my-project
```

In a terminal, generators ask for their input before writing files. For unattended use, provide a complete JSON input file:

```sh
ms mono/init ./my-project --input scaffold.json
```

Example `scaffold.json`:

```json
{
  "packages": [
    { "name": "@example/core", "access": "public", "targets": ["lib"] },
    { "name": "@example/cli", "access": "public", "targets": ["bin"], "bin": "example" }
  ]
}
```

You can also pipe JSON to stdin:

```sh
printf '%s\n' '{"name":"@example/utils","access":"public"}' |
  ms mono/pkg ./my-project --input - --no-install
```

Input paths are relative to the current working directory, independently of the target. Providing `--input` disables prompts even in a terminal. Without a terminal, generators that need answers fail immediately if input is missing. `--non-interactive` enforces this behavior in a terminal too.

Unknown fields and invalid input are rejected before generation. The CLI exits nonzero on validation, filesystem, or command failures. Generation is not transactional: a later failure can leave earlier files in place. Existing template files are never overwritten, and there is no force option.

## Discover inputs

```sh
ms list --json
ms mono/init --help
ms mono/init --schema
```

`list --json` prints names and descriptions. `--help` includes an input example. `--schema` prints only the generator's input JSON Schema on stdout. Discovery does not require a destination, interactive input, Rust, Git, or pnpm subprocesses.

Schemas describe types, allowed fields, static defaults, and input examples. Runtime validation also enforces relationships such as unique package names and directories, matching pnpm versions, and conditional binary names. Some of these rules cannot be represented by JSON Schema; field and generator descriptions document them.

| Generator | Input |
| --- | --- |
| `mono/init` | `packages` |
| `changeset/local` | Optional `baseBranch` (inferred from Git origin HEAD); targets a workspace created by `mono/init` |
| `changeset/ci` | Optional `baseBranch` (inferred from Git origin HEAD), `repository` (`owner/repo`, inferred from Git origin), `pnpmVersion`, `nodeVersion`, `buildScript`, and `access` |
| `mono/pkg` | `name`, `access` (`public` or `private`), optional `directory`; public packages also accept `targets` and `bin` |
| `cargo/init` | `packages`, containing crate inputs |
| `cargo/pkg` | `name`, optional `directory`, `publish` (false by default), and `targets` (`["lib"]` by default) |
| `script/init` | `{}`; no input file needed |
| `electron/init` | `name` (lowercase letters, numbers, and hyphens; starts with a letter; portable directory name), optional `appId` (reverse-domain identifier, defaults to `com.example.desktop`) |
| `vite/init` | `template`, such as `react-ts` or `vanilla-ts`; see `--schema` for supported templates |
| `vite/wrangler` | `{}`; targets an existing project with `package.json`; no input file needed |

Package directories default to the unscoped npm name or crate name. Each directory must be a single portable name inside `packages/` or `crates/`. Public npm packages default to `targets: ["lib"]`. A `bin` name is required exactly when `targets` includes `bin`. Private npm packages accept neither `targets` nor `bin`.

A minimal Cargo input is:

```json
{ "packages": [{ "name": "core" }, { "name": "app", "targets": ["bin"] }] }
```

A minimal Vite input is:

```json
{ "template": "react-ts" }
```

## Create an Electron app

```sh
ms electron/init ./my-desktop
```

For JSON input:

```json
{ "name": "my-desktop", "appId": "com.example.desktop" }
```

`electron/init` creates a Vanilla TypeScript app using `vite-plugin-electron/simple`, with Biome, Lefthook, Vitest, coverage, and separate renderer and Node type checks. It requires an empty or nonexistent target. Generation uses local templates; `--no-install --no-git` runs without external tools or network access. Generated projects require Node.js 22.18+, 24.11+, or 26+ and pnpm 11.

| Generated command | Behavior |
| --- | --- |
| `pnpm dev` | Start Vite and Electron; renderer HMR, main-process restarts, preload reloads |
| `pnpm check` / `pnpm fix` | Biome and TypeScript checks / Biome autofix |
| `pnpm test` / `pnpm test:watch` / `pnpm cov` | Vitest unit tests, watch mode, and coverage without launching Electron |
| `pnpm build` | Type-check and compile renderer, main, and preload |
| `pnpm start` | Run the compiled app after building |
| `pnpm run pack` | Build an unpacked desktop app with electron-builder |
| `pnpm dist` | Build the host platform's installer without publishing |

The plugin handles production compilation; electron-builder handles app packaging into `release/` (DMG, NSIS, or AppImage on the corresponding host). The generated README covers app identity, signing, and native dependencies. The renderer uses a typed preload bridge with context isolation and sandboxing; Node integration is disabled. Vitest has an independent config and an example test for the navigation/IPC URL policy. UI and Electron integration tests are not configured.

## Set up releases

After `mono/init`, choose one Changesets setup at the workspace root:

```sh
ms changeset/local ./my-project
# Or use GitHub Actions:
ms changeset/ci ./my-project
```

Both use the all-packages release style. Changesets determines which packages need releases from your changeset files; private packages are not versioned. Existing Changesets configuration and release workflows are preserved: the generators fail on conflicts rather than converting an existing setup.

Both generators infer the release branch from the locally recorded `origin/HEAD` at the target Git root. They do not contact the remote or use the current checkout branch, which may be a feature branch. An explicit `baseBranch` takes precedence. If the remote default is unavailable, interactive setup asks for the branch; JSON input must supply it.

To specify the release branch explicitly:

```json
{ "baseBranch": "main" }
```

`changeset/local` installs Changesets and adds a commit hook. Running `pnpm exec changeset version` updates versions and changelogs and creates a `chore: release packages` commit listing the released packages. Build and publish locally when ready.

For GitHub Actions, the repository is inferred from the target’s Git `origin` remote when the target is the Git root. HTTPS, SSH, and Git URLs on `github.com` are supported. An explicit `repository` overrides inference. If Git or a suitable remote is unavailable, interactive setup asks for the repository; JSON input must supply it. A parent checkout’s remote is never inherited.

To specify the repository explicitly:

```json
{
  "repository": "example/project",
  "baseBranch": "main",
  "pnpmVersion": "11.21.0"
}
```

`changeset/ci` adds `.github/workflows/release.yml`, GitHub changelogs, and repository metadata for public packages under `packages/`. It uses Changesets 3 and upgrades an existing Changesets dependency to that version range. The workflow opens version PRs, builds and packs packages, then publishes the prepared packages to npm and creates GitHub releases.

Omit `pnpmVersion` when the root `package.json` already pins an exact pnpm version through `packageManager`. Otherwise provide one; setup records the pin. An explicit version must match an existing pin. Release jobs use Node 24 by default; `nodeVersion` also accepts `"22"` and `"26"`. The build defaults to the root `build` script; choose another script with `buildScript`, or set it to `false` for packages that need no build. The default npm access is `public`; `access: "restricted"` changes that default, while individual package `publishConfig.access` settings take precedence.

Before publishing, allow GitHub Actions to create pull requests in the repository settings and configure an [npm trusted publisher](https://docs.npmjs.com/trusted-publishers) for each package, pointing to `release.yml` with direct publishing enabled. The generated `.changeset/README.md` includes setup instructions. Commit the generated files and updated lockfile; run `pnpm install` first if you used `--no-install`.

## External commands

```sh
ms mono/init ./my-project --input scaffold.json --no-install --no-git
```

- `--no-install` skips pnpm installation while retaining dependency declarations in manifests. It does not skip create-vite or Cargo lockfile updates and does not guarantee an offline run.
- `--no-git` skips Git initialization for new projects.
- Child commands receive closed stdin. All questions are answered before generation; command failures propagate to the CLI.

`mono/pkg` expects the workspace root, with `pnpm-workspace.yaml`, `package.json`, and a JSON `tsconfig.json`. `cargo/pkg` expects the Cargo workspace root. `cargo/init` requires stable Rust 1.85 or newer and pins the installed version. Cargo generators update `Cargo.lock`.

`vite/init` requires an empty or nonexistent target. It runs create-vite with an explicit template, disables its prompts and automatic installation/start, then applies the shared configuration. Its Node.js requirements depend on the current create-vite version. `vite/wrangler` preserves an existing Wrangler dependency or declares Wrangler 4, then installs unless `--no-install` is set.

The CLI itself requires Node.js 18.3 or newer. A newer Node.js version may be required by generated projects and scaffolders.
