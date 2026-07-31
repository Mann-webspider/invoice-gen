import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { ensureStorageTree } from './storage/paths'
import { initLogger } from './logger'
import { log } from './log'
import { closeDatabase, getConnection, openDatabase } from './db/client'
import { runMigrations } from './db/migrate'
import { registerIpc } from './ipc'

// Must run before any app.getPath('userData') call — Electron caches the path
// on first read, and this determines the %APPDATA% folder name.
app.setName('InvoiceGen')

let mainWindow: BrowserWindow | null = null

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    title: 'Invoice Generator',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // The renderer is untrusted UI code: no Node, isolated context, sandboxed.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // External links open in the user's browser, never inside the app shell.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  // The renderer is a fixed local bundle; it must never navigate elsewhere.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devServer = process.env['ELECTRON_RENDERER_URL']
    if (!devServer || !url.startsWith(devServer)) {
      event.preventDefault()
      log.warn(`Blocked navigation to ${url}`)
    }
  })

  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// A second instance would open the same SQLite file twice; focus the first instead.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  void app.whenReady().then(() => {
    ensureStorageTree()
    initLogger()
    log.info(`Starting ${app.getName()} ${app.getVersion()}`)

    openDatabase()
    runMigrations(getConnection())

    registerIpc()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    app.quit()
  })

  // Checkpoint the WAL and release the file cleanly, so a backup taken right
  // after closing the app is complete.
  app.on('will-quit', () => {
    closeDatabase()
  })
}
