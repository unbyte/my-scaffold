import { resolve } from 'node:path'
import minimist from 'minimist'
import { Plop, run } from 'plop'

const generators = ['mono/init', 'mono/pkg', 'script/init']

main()

function main() {
  const cwd = process.cwd()
  const args = minimist(process.argv.slice(2))

  const generator = args._[0]
  if (!generator) {
    console.error('No generator specified.')
    printGenerators()
    process.exit(1)
  }
  const plop = pickPlop(generator)
  if (!plop) {
    console.error(`Unknown generator: ${generator}.`)
    printGenerators()
    process.exit(1)
  }
  const target = args._[1] ? resolve(cwd, args._[1]) : cwd

  runPlop(plop, target)
}

function pickPlop(generator: string) {
  if (generators.includes(generator)) {
    return require.resolve(`./generators/${generator}.plopfile`)
  }
}

function runPlop(configPath: string, target: string) {
  Plop.prepare(
    {
      cwd: target,
      configPath,
    },
    (env) => {
      Plop.execute(env, (env) => {
        const options = {
          ...env,
          dest: target,
        }
        return run(options, undefined, true)
      })
    },
  )
}

function printGenerators() {
  console.log('Available generators:')
  for (const generator of generators) {
    console.log(`  - ${generator}`)
  }
}
