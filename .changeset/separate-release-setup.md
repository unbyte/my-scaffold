---
"@unbyte/my-scaffold": minor
---

Choose how to release a monorepo after creating it:

- Run `ms changeset/local` for local versioning and publishing, with release commits listing all changed packages.
- Run `ms changeset/ci` for GitHub version pull requests and automated npm publishing. Setup infers your GitHub repository from Git origin and collects workflow settings. It includes instructions for npm trusted publishing.

Both generators infer the release branch from Git origin HEAD and ask when it is unavailable. Explicit `repository` and `baseBranch` inputs override Git inference.

`mono/init` now creates the workspace without Changesets. Run one of the new generators at the workspace root to add release support. Remove `releaseStyle` and `main` from existing `mono/init` JSON inputs; release messages now always use the all-packages style.
