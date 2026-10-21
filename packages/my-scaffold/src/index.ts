#!/usr/bin/env node
import { resolve } from 'node:path'
import minimist from 'minimist'
import { generators, getGenerator } from './generators'

async function main() {
  const args = minimist(process.argv.slice(2), {
    boolean: ['help', 'install', 'git'],
    default: { install: true, git: true },
  })
  const [name, target] = args._
  if (args.help || !name) {
    console.log('Usage: ms <generator> [target-dir] [--no-install] [--no-git]')
    for (const [name, generator] of Object.entries(generators)) console.log(`  ${name}: ${generator.description}`)
    return
  }
  const generator = getGenerator(name)
  if (generator.prompt && !process.stdin.isTTY) throw new Error(`${name} requires interactive input`)
  const input = generator.prompt ? await generator.prompt() : {}
  await generator.run(input, { target: resolve(target ?? process.cwd()), install: args.install, git: args.git })
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
