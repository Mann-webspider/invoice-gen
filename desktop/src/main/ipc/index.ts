import { registerAppIpc } from './app.ipc'

/**
 * Single registration point for the IPC surface.
 * Later phases add: auth, master, asset, invoice, draft, document, backup.
 */
export const registerIpc = (): void => {
  registerAppIpc()
}
