# @unbyte/my-scaffold

`ms` creates personal project layouts for TypeScript monorepos, Rust workspaces, scripts, and Vite applications.

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
  ],
  "releaseStyle": "primary",
  "main": "@example/core"
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

Schemas describe types, allowed fields, static defaults, and input examples. Runtime validation also enforces relationships such as unique package names and directories, valid primary packages, and conditional binary names. Some of these rules cannot be represented by JSON Schema; field and generator descriptions document them.

| Generator | Input |
| --- | --- |
| `mono/init` | `packages`, optional `releaseStyle` (`primary` by default), and `main` when several primary packages are eligible |
| `mono/pkg` | `name`, `access` (`public` or `private`), optional `directory`; public packages also accept `targets` and `bin` |
| `cargo/init` | `packages`, containing crate inputs |
| `cargo/pkg` | `name`, optional `directory`, `publish` (false by default), and `targets` (`["lib"]` by default) |
| `script/init` | `{}`; no input file needed |
| `vite/init` | `template`, such as `react-ts` or `vanilla-ts`; see `--schema` for supported templates |
| `vite/wrangler` | `{}`; targets an existing project with `package.json`; no input file needed |

Package directories default to the unscoped npm name or crate name. Each directory must be a single portable name inside `packages/` or `crates/`. Public npm packages default to `targets: ["lib"]`. A `bin` name is required exactly when `targets` includes `bin`. Private npm packages accept neither `targets` nor `bin`.

For primary monorepo releases, public packages are eligible if any exist; otherwise private packages are eligible. A sole eligible package is inferred. With several candidates, specify `main`. With `releaseStyle: "all"`, omit `main`.

A minimal Cargo input is:

```json
{ "packages": [{ "name": "core" }, { "name": "app", "targets": ["bin"] }] }
```

A minimal Vite input is:

```json
{ "template": "react-ts" }
```

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
