import { readFile, writeFile } from 'node:fs/promises'
import type { ActionType } from 'plop'

export function modifyJson<T = Record<string, unknown>>(
  path: string,
  modifier: (json: T) => T | undefined,
): ActionType {
  return async () => {
    const json = JSON.parse(await readFile(path, 'utf8')) as T
    const result = modifier(json) ?? json
    await writeFile(path, `${JSON.stringify(result, null, 2)}\n`)
    return `modified ${path}`
  }
}

export function mergeJson(targetPath: string, sourcePath: string): ActionType {
  return async () => {
    const source = JSON.parse(await readFile(sourcePath, 'utf8'))
    const target = JSON.parse(await readFile(targetPath, 'utf8'))
    const result = deepMerge(target, source) as Record<string, unknown>
    await writeFile(targetPath, `${JSON.stringify(result, null, 2)}\n`)
    return `merged ${targetPath}`
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMerge(target: unknown, source: unknown): unknown {
  if (!isPlainObject(target) || !isPlainObject(source)) return source
  const result: Record<string, unknown> = { ...target }
  for (const [key, value] of Object.entries(source)) {
    result[key] = key in result ? deepMerge(result[key], value) : value
  }
  return result
}
