import { CH } from '../ipc-channels'
import type { AppInfo } from './app'

export * from './app'

/**
 * The typed IPC surface: channel name -> { req, res }.
 *
 * Channels are added here as each phase implements them, so an unimplemented
 * channel is a compile error in the renderer rather than a runtime 404 — the
 * failure mode of the old `services/api.ts`, which shipped calls to
 * `/products`, `/company/profile` and `/invoice/history` that the backend
 * never had.
 */
export interface IpcContract {
  [CH.app.info]: { req: void; res: AppInfo }
}

export type IpcChannel = keyof IpcContract
export type IpcRequest<K extends IpcChannel> = IpcContract[K]['req']
export type IpcResponse<K extends IpcChannel> = IpcContract[K]['res']
