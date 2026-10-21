---
"@unbyte/my-scaffold": minor
---

Choose how to release a monorepo after creating it:

- Run `ms changeset/local` for local versioning and publishing, with release commits listing all changed packages.
- Run `ms changeset/ci` for GitHub version pull requests and automated npm publishing. Setup asks for your repository, release branch, and workflow settings, and includes instructions for npm trusted publishing.

`mono/init` now creates the workspace without Changesets. Run one of the new generators at the workspace root to add release support. Remove `releaseStyle` and `main` from existing `mono/init` JSON inputs; release messages now always use the all-packages style.
