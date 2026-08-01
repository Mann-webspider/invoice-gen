import { registerAppIpc } from './app.ipc'
import { registerAssetIpc } from './asset.ipc'
import { registerAuthIpc } from './auth.ipc'
import { registerMasterIpc } from './master.ipc'

/**
 * Single registration point for the IPC surface.
 * Later phases add: invoice, draft, document, backup.
 */
export const registerIpc = (): void => {
  registerAppIpc()
  registerAuthIpc()
  registerMasterIpc()
  registerAssetIpc()
}
