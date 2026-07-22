module.exports = {
  async getVersionMessage(releasePlan, _options) {
{{#if releaseAll}}
    const released = releasePlan.releases.filter((release) => release.type !== 'none')

    if (released.length === 0) {
      throw new Error(`no packages to release`)
    }

    const lines = released.map((release) => `- ${release.name}@${release.newVersion}`)

    return `chore: release packages\n\n${lines.join('\n')}`
{{else}}
    const pkg = releasePlan.releases.find((release) => release.name === '{{ main }}')

    if (!pkg) {
      throw new Error(`main package not found in release plan`)
    }

    return `chore(release): ${pkg.newVersion}`
{{/if}}
  },
}
