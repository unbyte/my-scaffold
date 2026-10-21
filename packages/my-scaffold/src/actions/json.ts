import { readFile, writeFile } from 'node:fs/promises'
import { pathStats } from './files'

export async function readJson<T = Record<string, unknown>>(path: string): Promise<T> {
  const stats = await pathStats(path)
  if (!stats?.isFile()) throw new Error(`Expected a regular JSON file: ${path}`)
  return JSON.parse(await readFile(path, 'utf8')) as T
}

export async function modifyJson<T = Record<string, unknown>>(path: string, modifier: (json: T) => T) {
  const result = modifier(await readJson<T>(path))
  await writeFile(path, `${JSON.stringify(result, null, 2)}\n`)
}

export async function mergeJson(targetPath: string, sourcePath: string) {
  const source = await readJson(sourcePath)
  await modifyJson(targetPath, (target) => deepMerge(target, source) as Record<string, unknown>)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMerge(target: unknown, source: unknown): unknown {
  if (!isPlainObject(target) || !isPlainObject(source)) return source
  const result = { ...target }
  for (const [key, value] of Object.entries(source)) {
    Object.defineProperty(result, key, {
      value: Object.hasOwn(target, key) ? deepMerge(target[key], value) : value,
      enumerable: true,
      configurable: true,
      writable: true,
    })
  }
  return result
}
