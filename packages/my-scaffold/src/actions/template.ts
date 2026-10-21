import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, sep } from 'node:path'
import Handlebars from 'handlebars'
import { isBinaryFile } from 'isbinaryfile'
import { resolveTemplate, type Template } from '../templates'
import { checkNewPath } from './files'

export async function copyTemplate(
  source: string,
  target: string,
  data: Record<string, unknown> = {},
  exclude: string[] = [],
) {
  const files: { path: string; content: Buffer | string; mode: number }[] = []
  const destinations = new Set<string>()

  async function visit(directory: string, parts: string[]) {
    const entries = await readdir(directory, { withFileTypes: true })
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const names = [...parts, entry.name]
      if (exclude.includes(names.join('/'))) continue
      const path = join(directory, entry.name)
      if (entry.isDirectory()) {
        await visit(path, names)
      } else if (entry.isFile()) {
        const output = names.map((name) => (name.startsWith('_') ? `.${name.slice(1)}` : name)).join(sep)
        const destination = await checkNewPath(target, output)
        const key = destination.toLowerCase()
        if (destinations.has(key)) throw new Error(`Template paths collide: ${destination}`)
        destinations.add(key)
        const buffer = await readFile(path)
        const content = (await isBinaryFile(buffer))
          ? buffer
          : Handlebars.compile(buffer.toString('utf8'), { strict: true, noEscape: true })(data)
        files.push({ path: destination, content, mode: (await stat(path)).mode & 0o777 })
      } else {
        throw new Error(`Unsupported template entry: ${path}`)
      }
    }
  }

  // Render and check every destination before writing any file in this template.
  await visit(source, [])
  for (const file of files) {
    await mkdir(dirname(file.path), { recursive: true })
    await writeFile(file.path, file.content, { flag: 'wx', mode: file.mode })
  }
}

export function renderTemplate(
  target: string,
  template: Template,
  data: Record<string, unknown> = {},
  exclude: string[] = [],
) {
  return copyTemplate(resolveTemplate(template), target, data, exclude)
}
