import { z } from 'zod'
import { directoryName } from '../input'

export const electronName = z
  .string()
  .max(214)
  .regex(/^[a-z][a-z0-9-]*$/, 'Use a lowercase app name with letters, numbers, and hyphens')
  .pipe(directoryName)
  .describe('Unscoped app package name; must also be a portable directory name')

export const electronAppId = z
  .string()
  .regex(
    /^[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9-]*)+$/,
    'Use a reverse-domain app ID, such as com.example.desktop',
  )
  .default('com.example.desktop')
  .describe('Stable application identifier used by electron-builder; replace the example before distributing')

export const electronSchema = z
  .strictObject({
    name: electronName,
    appId: electronAppId,
  })
  .meta({ examples: [{ name: 'my-desktop', appId: 'com.example.desktop' }] })
