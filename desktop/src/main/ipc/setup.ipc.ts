import { CH } from '@shared/ipc-channels'
import type { ImportSummary, SetupState } from '@shared/contracts'
import * as setup from '../services/setup.service'
import { handle } from './guard'

/**
 * Deliberately unauthenticated: these run before any account exists. They are
 * safe to leave open because each is inert once the machine is set up —
 * importing refuses to run when invoices are already present, and the other two
 * only read.
 */
export const registerSetupIpc = (): void => {
  handle(CH.setup.state, null, (): Promise<SetupState> => setup.getSetupState())

  handle(
    CH.setup.recheckLibreOffice,
    null,
    (): Promise<SetupState> => setup.recheckLibreOffice()
  )

  handle(
    CH.setup.importLegacy,
    null,
    (): Promise<ImportSummary | null> => setup.importFromOldSystem()
  )
}
