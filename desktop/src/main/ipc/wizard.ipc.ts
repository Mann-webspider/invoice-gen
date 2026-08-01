import { z } from 'zod'
import { CH } from '@shared/ipc-channels'
import {
  AllocateNumberInput,
  CreateInvoiceInput,
  DraftSaveInput,
  type DraftRecord,
  type InvoiceSummary
} from '@shared/contracts'
import * as drafts from '../services/draft.service'
import * as invoices from '../services/invoice.service'
import { allocateInvoiceNumber } from '../services/numbering.service'
import { requireUser } from '../services/auth.service'
import { handle } from './guard'

const ById = z.object({ id: z.string().min(1) })

export const registerWizardIpc = (): void => {
  handle(CH.draft.list, null, (): DraftRecord[] => {
    requireUser()
    return drafts.listDrafts()
  })

  handle(CH.draft.get, ById, (input) => {
    requireUser()
    return drafts.getDraft(input.id)
  })

  handle(CH.draft.save, DraftSaveInput, (input) => {
    requireUser()
    return drafts.saveDraft(input)
  })

  handle(CH.draft.remove, ById, (input) => {
    requireUser()
    return drafts.removeDraft(input.id)
  })

  handle(CH.invoice.list, null, (): InvoiceSummary[] => {
    requireUser()
    return invoices.listInvoices()
  })

  handle(CH.invoice.get, ById, (input) => {
    requireUser()
    return invoices.getInvoice(input.id)
  })

  handle(CH.invoice.create, CreateInvoiceInput, (input) => {
    requireUser()
    return invoices.createInvoice(input)
  })

  handle(CH.invoice.remove, ById, (input) => {
    requireUser()
    return invoices.removeInvoice(input.id)
  })

  handle(CH.invoice.allocateNumber, AllocateNumberInput, (input) => {
    requireUser()
    return allocateInvoiceNumber(input)
  })
}
