# Releases

Add a changeset with `pnpm exec changeset` for each change that needs a release. Commit the changeset with your code.

Run `pnpm exec changeset version` to update package versions and changelogs. This creates a `chore: release packages` commit listing the released packages and their versions. Review the result, build the packages with `pnpm build`, and run `pnpm exec changeset publish` when ready to publish.

Private packages are not versioned. The release branch is configured in `config.json`. Local publishing uses your npm credentials and each package's access settings.

If setup ran with `--no-install`, run `pnpm install` before using Changesets. See the [Changesets documentation](https://changesets.dev).
