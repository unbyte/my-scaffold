---
"@unbyte/my-scaffold": minor
---

Support unattended scaffolding from JSON input alongside interactive prompts.

- Accept complete generator input through `--input <file>` or `--input -` for stdin, with shared Zod validation before generation.
- Add `list --json`, per-generator `--schema`, and input examples in `--help` for discovery.
- Add `--non-interactive`, `--no-install`, and `--no-git`. Missing required input without a terminal now fails immediately.
- Replace Plop with ordinary async generators and shared file helpers. Template copying checks for conflicts and maps dotfiles without renaming unrelated destination files.
- Run Vite scaffolding with an explicit template and disabled prompts. Vite initialization now requires an empty or nonexistent target directory.

The CLI now requires Node.js 18.3 or newer. `--no-install` skips pnpm installation; Vite creation and Cargo lockfile updates still run.
