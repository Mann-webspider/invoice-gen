import { registerAppIpc } from './app.ipc'
import { registerAssetIpc } from './asset.ipc'
import { registerAuthIpc } from './auth.ipc'
import { registerBackupIpc } from './backup.ipc'
import { registerDocumentIpc } from './document.ipc'
import { registerMasterIpc } from './master.ipc'
import { registerSetupIpc } from './setup.ipc'
import { registerWizardIpc } from './wizard.ipc'

/**
 * Single registration point for the IPC surface.
 */
export const registerIpc = (): void => {
  registerAppIpc()
  registerSetupIpc()
  registerAuthIpc()
  registerMasterIpc()
  registerAssetIpc()
  registerWizardIpc()
  registerDocumentIpc()
  registerBackupIpc()
}
