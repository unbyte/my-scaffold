import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, BrowserWindow, ipcMain, session } from 'electron'
import { isRendererUrl } from './navigation'

const rendererUrl =
  (!app.isPackaged && process.env.VITE_DEV_SERVER_URL) ||
  pathToFileURL(join(app.getAppPath(), 'dist/index.html')).href

async function createWindow() {
  const window = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: join(app.getAppPath(), 'dist-electron/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event, url) => {
    if (!isRendererUrl(url, rendererUrl)) event.preventDefault()
  })

  await window.loadURL(rendererUrl)
}

function exitOnError(error: unknown) {
  console.error(error)
  app.exit(1)
}

app
  .whenReady()
  .then(async () => {
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => {
      callback(false)
    })
    session.defaultSession.setPermissionCheckHandler(() => false)

    ipcMain.handle('app:version', (event) => {
      if (
        !event.senderFrame ||
        event.senderFrame !== event.sender.mainFrame ||
        !isRendererUrl(event.senderFrame.url, rendererUrl)
      ) {
        throw new Error('Unexpected IPC sender')
      }
      return app.getVersion()
    })

    await createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow().catch(exitOnError)
    })
  })
  .catch(exitOnError)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
