import { resolve } from 'node:path'
import minimist from 'minimist'
import { Plop, run } from 'plop'

function pickConfig(command: string) {
  if (command === 'init') {
    return require.resolve('./init.plopfile')
  }
  if (command === 'pkg') {
    return require.resolve('./pkg.plopfile')
  }
  console.error(`Unknown command: ${command}. Use 'init' or 'pkg'`)
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

function main() {
  const cwd = process.cwd()
  const args = minimist(process.argv.slice(2))

  const command = args._[0]
  const target = args._[1] ? resolve(cwd, args._[1]) : cwd

  const configPath = pickConfig(command)
  runPlop(configPath, target)
}

main()
