---
"@unbyte/my-scaffold": minor
---

Scaffold projects from scripts and coding agents without answering prompts. Pass your configuration with `--input <file>` or pipe JSON through `--input -`. Interactive prompts remain available in a terminal.

- Inspect accepted inputs with `ms <generator> --schema`, see examples with `--help`, and list generators with `ms list --json`.
- Use `--non-interactive` to fail when required input is missing instead of prompting.
- Skip pnpm installation with `--no-install` or Git initialization with `--no-git`.

Requires Node.js 18.3 or newer. `vite/init` now requires an empty or nonexistent target directory.
