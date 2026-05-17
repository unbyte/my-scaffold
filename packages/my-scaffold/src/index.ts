import { resolve } from 'node:path'
import minimist from 'minimist'
import { Plop, run } from 'plop'

const generators = ['mono/init', 'mono/pkg', 'script/init']

main()

function main() {
  const cwd = process.cwd()
  const args = minimist(process.argv.slice(2))

  const command = args._[0] || ''
  const target = args._[1] ? resolve(cwd, args._[1]) : cwd

  const configPath = pickPlop(command)
  runPlop(configPath, target)
}

function pickPlop(generator: string) {
  if (generators.includes(generator)) {
    return require.resolve(`./generators/${generator}.plopfile`)
  }

  console.error(`Unknown generator: ${generator}.`)
  console.error(`Use one of: ${generators.map((generator) => `  - ${generator}`).join('\n')}`)
  process.exit(1)
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
