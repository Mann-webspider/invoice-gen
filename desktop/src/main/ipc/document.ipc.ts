import { BrowserWindow } from 'electron'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { CH, EVT } from '@shared/ipc-channels'
import type { DocumentProgress } from '@shared/contracts'
import * as documents from '../services/document.service'
import { requireUser } from '../services/auth.service'
import { handle } from './guard'

const ByInvoice = z.object({ invoiceId: z.string().min(1) })
const ByPath = z.object({ path: z.string().min(1) })

/** Pushes progress to every open window; there is only ever one. */
const emit = (progress: DocumentProgress): void => {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(EVT.documentProgress, progress)
  }
}

export const registerDocumentIpc = (): void => {
  handle(CH.document.generate, ByInvoice, async (input) => {
    requireUser()
    const jobId = randomUUID()

    try {
      const result = await documents.generateDocuments(
        input.invoiceId,
        (step, title, status) => emit({ jobId, step, title, status })
      )
      emit({ jobId, step: 'DONE', title: 'Documents ready', status: 'completed' })
      return result
    } catch (error) {
      emit({
        jobId,
        step: 'DONE',
        title: 'Generation failed',
        status: 'failed',
        message: error instanceof Error ? error.message : undefined
      })
      throw error
    }
  })

  handle(CH.document.list, ByInvoice, (input) => {
    requireUser()
    return documents.listDocuments(input.invoiceId)
  })

  handle(CH.document.open, ByPath, (input) => {
    requireUser()
    return documents.openDocument(input.path)
  })

  handle(CH.document.reveal, ByPath, (input) => {
    requireUser()
    return documents.revealDocument(input.path)
  })
}
