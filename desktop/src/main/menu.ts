import { app, Menu, shell, type BrowserWindow } from 'electron'
import { paths } from './storage/paths'

/**
 * The application menu.
 *
 * On Windows and Linux the menu is hidden and this exists only so the standard
 * accelerators keep working. On macOS it is mandatory: without an Edit menu
 * carrying the cut/copy/paste/selectAll roles, Cmd+C and Cmd+V do nothing at
 * all — including inside text inputs — because the OS routes those shortcuts
 * through the menu bar.
 */
export const buildMenu = (getWindow: () => BrowserWindow | null): void => {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([
          {
            label: app.getName(),
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ] as Electron.MenuItemConstructorOptions[])
      : []),

    {
      label: '&File',
      submenu: [
        {
          label: 'Open data folder',
          click: () => void shell.openPath(paths.root())
        },
        {
          label: 'Open documents folder',
          click: () => void shell.openPath(paths.documents())
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },

    {
      label: '&Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? ([
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' }
            ] as Electron.MenuItemConstructorOptions[])
          : ([{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }] as Electron.MenuItemConstructorOptions[]))
      ]
    },

    {
      label: '&View',
      submenu: [
        { role: 'reload' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        // Left available deliberately: it is the fastest way to get a stack
        // trace out of a client machine.
        { role: 'toggleDevTools' }
      ]
    },

    {
      label: '&Window',
      submenu: isMac
        ? ([
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' }
          ] as Electron.MenuItemConstructorOptions[])
        : ([{ role: 'minimize' }, { role: 'close' }] as Electron.MenuItemConstructorOptions[])
    },

    {
      label: '&Help',
      submenu: [
        {
          label: 'Show log file',
          click: () => void shell.openPath(paths.logs())
        },
        {
          label: 'About Invoice Generator',
          click: () => {
            getWindow()?.webContents.send('evt:showAbout')
          }
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
