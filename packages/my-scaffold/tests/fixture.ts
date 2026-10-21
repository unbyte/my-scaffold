import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { TestContext } from 'vitest'

export async function fixture(test: TestContext) {
  const playground = resolve(__dirname, '../../../playground')
  await mkdir(playground, { recursive: true })
  const path = await mkdtemp(join(playground, 'scaffold-test-'))
  test.onTestFinished(() => rm(path, { recursive: true, force: true }))
  return path
}
