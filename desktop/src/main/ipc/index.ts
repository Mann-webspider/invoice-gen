import { registerAppIpc } from './app.ipc'
import { registerAssetIpc } from './asset.ipc'
import { registerAuthIpc } from './auth.ipc'
import { registerDocumentIpc } from './document.ipc'
import { registerMasterIpc } from './master.ipc'
import { registerWizardIpc } from './wizard.ipc'

/**
 * Single registration point for the IPC surface.
 * Later phases add: backup.
 */
export const registerIpc = (): void => {
  registerAppIpc()
  registerAuthIpc()
  registerMasterIpc()
  registerAssetIpc()
  registerWizardIpc()
  registerDocumentIpc()
}
