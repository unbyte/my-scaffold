# Releases

Add a changeset with `pnpm exec changeset` for each change that needs a release. Commit the changeset with your code.

The release workflow opens a version pull request. Review and merge it to publish the new package versions to npm and create GitHub releases. Packages are built and packed in a separate job before publishing.

## Before the first release

1. In the GitHub repository's **Settings → Actions → General**, enable **Allow GitHub Actions to create and approve pull requests**.
2. Configure an npm trusted publisher for every package you publish. Select GitHub Actions, repository `{{ repository }}`, and workflow filename `release.yml`. Enable direct publishing with `npm publish`. Leave the environment name empty; this workflow does not use a GitHub environment.
3. If a package does not exist on npm yet, publish its first version manually before configuring its trusted publisher.
4. Commit the generated files, updated `package.json`, and `pnpm-lock.yaml`. If setup ran with `--no-install`, run `pnpm install` first.

Public package manifests include repository metadata for this GitHub repository. Keep it in sync if the repository moves.

Authentication uses GitHub's built-in token and npm trusted publishing. No npm token secret is required. Package access defaults to the value in `config.json`; a package's `publishConfig.access` can override it.

See the [Changesets automation guide](https://changesets.dev/guide/automating) and [npm trusted publishing guide](https://docs.npmjs.com/trusted-publishers).
