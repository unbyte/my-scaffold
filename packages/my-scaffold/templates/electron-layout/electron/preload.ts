import { contextBridge, ipcRenderer } from 'electron'
import type { DesktopApi } from '../shared/desktop'

const desktop: DesktopApi = {
  getVersion: () => ipcRenderer.invoke('app:version'),
}

contextBridge.exposeInMainWorld('desktop', desktop)
