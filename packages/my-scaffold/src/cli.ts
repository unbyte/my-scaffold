import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { version } from '../package.json'
import { generators, getGenerator } from './generators'

const usage = `Usage:
  ms <generator> [target-dir] [options]
  ms list [--json]

Options:
  -i, --input <file|->   Read complete generator input as JSON; - reads stdin
      --schema           Print the generator's input JSON Schema
      --non-interactive  Fail instead of prompting for missing input
      --no-install       Skip pnpm install
      --no-git           Skip Git initialization
  -h, --help             Print help and an input example
  -v, --version          Print the CLI version

Input files are resolved relative to the current working directory.
Without --input, prompts are available only in a terminal.
Vite creation and Cargo lockfile updates still run with --no-install.`

export async function runCli(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      input: { type: 'string', short: 'i' },
      schema: { type: 'boolean' },
      json: { type: 'boolean' },
      'non-interactive': { type: 'boolean' },
      'no-install': { type: 'boolean' },
      'no-git': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  })
  if (values.version) {
    console.log(version)
    return
  }
  const [name, target] = positionals
  if (name === 'list') {
    if (positionals.length > 1 || Object.keys(values).some((key) => key !== 'json' && key !== 'help')) {
      throw new Error('Usage: ms list [--json]')
    }
    const list = Object.entries(generators).map(([name, generator]) => ({ name, description: generator.description }))
    if (values.json) printJson(list)
    else for (const entry of list) console.log(`${entry.name}: ${entry.description}`)
    return
  }
  if (values.json) throw new Error('--json is supported by ms list; use --schema to inspect a generator')
  if (positionals.length > 2) throw new Error('Expected a generator and an optional target directory')
  if (!name) {
    if (values.schema || values.input !== undefined) throw new Error('Specify a generator')
    console.log(usage)
    console.log('\nGenerators:')
    for (const [name, generator] of Object.entries(generators)) console.log(`  ${name}: ${generator.description}`)
    return
  }
  const generator = getGenerator(name)
  if (values.schema) {
    printJson(z.toJSONSchema(generator.schema, { io: 'input' }))
    return
  }
  if (values.help) {
    console.log(`${name}: ${generator.description}\n\n${usage}`)
    const examples = generator.schema.meta()?.examples
    const example: unknown = Array.isArray(examples) ? examples[0] : undefined
    if (example !== undefined) {
      console.log('\nExample input:')
      printJson(example)
    }
    console.log(`\nFull input contract: ms ${name} --schema`)
    return
  }

  const destination = resolve(target ?? process.cwd())
  let input: unknown = {}
  if (values.input !== undefined) {
    if (!values.input) throw new Error('--input requires a filename or - for stdin')
    input = await readInput(values.input)
  } else if (generator.prompt) {
    if (values['non-interactive'] || !process.stdin.isTTY || !process.stdout.isTTY) {
      if (!generator.schema.safeParse({}).success) {
        throw new Error(`Input required for ${name}. Use --input <file|-> and inspect ms ${name} --schema`)
      }
    } else {
      input = await generator.prompt({ target: destination })
    }
  }
  await generator.run(input, {
    target: destination,
    install: !values['no-install'],
    git: !values['no-git'],
  })
  console.error(`${name}: generated ${destination}`)
}

async function readInput(source: string): Promise<unknown> {
  let content: string
  if (source === '-') {
    if (process.stdin.isTTY) throw new Error('--input - requires JSON piped to stdin')
    content = ''
    process.stdin.setEncoding('utf8')
    for await (const chunk of process.stdin) content += chunk
  } else {
    content = await readFile(resolve(source), 'utf8')
  }
  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error(
      `Invalid JSON in ${source === '-' ? 'stdin' : source}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function printJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

export function formatError(error: unknown) {
  if (error instanceof z.ZodError) {
    return `Invalid input:\n${error.issues.map((issue) => `  ${issue.path.join('.') || '(input)'}: ${issue.message}`).join('\n')}`
  }
  return error instanceof Error ? error.message : String(error)
}
