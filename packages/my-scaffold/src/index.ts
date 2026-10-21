#!/usr/bin/env node
import { formatError, runCli } from './cli'

runCli(process.argv.slice(2)).catch((error: unknown) => {
  console.error(formatError(error))
  process.exitCode = 1
})
