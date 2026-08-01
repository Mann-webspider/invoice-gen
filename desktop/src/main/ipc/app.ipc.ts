import { app } from 'electron'
import { CH } from '@shared/ipc-channels'
import type { AppInfo } from '@shared/contracts'
import { paths } from '../storage/paths'
import { handle } from './guard'

export const registerAppIpc = (): void => {
  handle<void, AppInfo>(CH.app.info, null, () => ({
    name: app.getName(),
    version: app.getVersion(),
    electron: process.versions.electron,
    platform: process.platform,
    userDataPath: paths.root(),
    isPackaged: app.isPackaged
  }))
}
