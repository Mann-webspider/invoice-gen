import { contextBridge, ipcRenderer } from 'electron'
import { EVT } from '@shared/ipc-channels'
import type { DocumentProgress, IpcChannel, IpcRequest, IpcResponse } from '@shared/contracts'
import type { Result } from '@shared/result'

/**
 * The entire surface the renderer can reach. There is no HTTP server, no open
 * port and no CORS: the renderer runs sandboxed with contextIsolation on and
 * talks to the main process only through these two functions.
 */
const api = {
  invoke<K extends IpcChannel>(channel: K, payload: IpcRequest<K>): Promise<Result<IpcResponse<K>>> {
    return ipcRenderer.invoke(channel, payload) as Promise<Result<IpcResponse<K>>>
  },

  /** Subscribe to document-generation progress. Returns an unsubscribe function. */
  onDocumentProgress(listener: (progress: DocumentProgress) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, progress: DocumentProgress): void =>
      listener(progress)
    ipcRenderer.on(EVT.documentProgress, handler)
    return () => {
      ipcRenderer.off(EVT.documentProgress, handler)
    }
  }
}

export type RendererApi = typeof api

contextBridge.exposeInMainWorld('api', api)
