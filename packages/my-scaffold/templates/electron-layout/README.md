# {{name}}

An Electron app with a Vanilla TypeScript renderer, Vite, Biome, Lefthook, and Vitest. Use Node.js 22.18+, 24.11+, or 26+ and pnpm 11.

## Development

```sh
pnpm install
pnpm dev
```

`vite-plugin-electron/simple` starts Electron after building the main process and preload. Renderer changes use Vite HMR, main-process changes restart Electron, and preload changes reload the renderer.

`electron/main.ts` owns windows and native APIs. `electron/preload.ts` exposes the typed `window.desktop` API from `shared/desktop.ts`. `src/` runs in the browser sandbox. Add specific IPC methods to the bridge when the renderer needs native functionality; validate their inputs and senders in the main process.

The main process builds as ESM and the sandboxed preload as a single CommonJS `preload.cjs` bundle. The renderer has no Node.js integration. Relative Vite asset paths let the production renderer load from the packaged app. Use hash routes if adding client-side routing.

## Checks and tests

```sh
pnpm check
pnpm fix
pnpm test
pnpm test:watch
pnpm cov
```

Vitest uses its own config and runs unit tests in Node without starting Electron or loading the Electron Vite plugin. The included tests exercise the renderer URL policy used for navigation and IPC. Keep testable application logic separate from Electron entry points. Entry points and type declarations are excluded from coverage; browser and Electron integration tests are not configured.

Renderer and Node code have separate TypeScript configs. Lefthook formats and checks staged files before commits. The Electron runtime downloads on first use; packaging may download additional platform tools. `pnpm-workspace.yaml` records dependency build-script rules, including disabling the unused Squirrel installer helper. If generation used `--no-git`, run `git init` and `pnpm exec lefthook install` when ready to enable hooks.

## Build and package

```sh
pnpm build
pnpm start
pnpm run pack
pnpm dist
```

`build` checks types and compiles all three processes into `dist/` and `dist-electron/`. `start` opens those compiled files in Electron; it needs a completed build. `pack` builds an unpacked app in `release/`. `dist` creates the host platform's installer: DMG on macOS, NSIS on Windows, or AppImage on Linux. Both packaging commands explicitly disable publishing.

Before distributing, set your stable app ID in `electron-builder.json` and your author, description, and version in `package.json`. Configure application icons and platform signing/notarization for your release environment. Build and validate each target on its native OS. The scaffold does not configure signing credentials, publishing, or automatic updates.

For native Node dependencies, declare them in `dependencies`, externalize them in the main process Vite build, and configure electron-builder's native module rebuilds. The starter itself has no native Node add-ons.

References: [vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron), [electron-builder](https://www.electron.build/), [Electron security](https://www.electronjs.org/docs/latest/tutorial/security), [Vitest configuration](https://vitest.dev/config/).
