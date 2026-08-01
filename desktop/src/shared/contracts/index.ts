import { CH } from '../ipc-channels'
import type { AppInfo } from './app'
import type {
  ChangePasswordInput,
  CreateAdminInput,
  LoginInput,
  SessionState,
  SessionUser,
  SetPasswordInput
} from './auth'
import type {
  AssetGetInput,
  AssetPickInput,
  AssetResult,
  MasterEntity,
  MasterInputMap,
  MasterListInput,
  MasterRecordMap,
  MasterRemoveInput,
  MasterReorderInput
} from './master'
import type {
  AllocatedNumber,
  AllocateNumberInput,
  CreateInvoiceInput,
  DraftRecord,
  DraftSaveInput,
  DraftWithData,
  DocumentFile,
  GenerateDocumentsResult,
  InvoiceSummary,
  WizardData
} from './wizard'

export * from './app'
export * from './auth'
export * from './master'
export * from './wizard'

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

  [CH.auth.session]: { req: void; res: SessionState }
  [CH.auth.login]: { req: LoginInput; res: SessionUser }
  [CH.auth.logout]: { req: void; res: null }
  [CH.auth.setPassword]: { req: SetPasswordInput; res: SessionUser }
  [CH.auth.createAdmin]: { req: CreateAdminInput; res: SessionUser }
  [CH.auth.changePassword]: { req: ChangePasswordInput; res: null }

  [CH.master.list]: {
    req: MasterListInput
    res: MasterRecordMap[MasterEntity][]
  }
  [CH.master.create]: {
    req: { entity: MasterEntity; data: MasterInputMap[MasterEntity] }
    res: MasterRecordMap[MasterEntity]
  }
  [CH.master.update]: {
    req: { entity: MasterEntity; id: string; data: MasterInputMap[MasterEntity] }
    res: MasterRecordMap[MasterEntity]
  }
  [CH.master.remove]: { req: MasterRemoveInput; res: null }
  [CH.master.reorder]: { req: MasterReorderInput; res: null }

  [CH.asset.pick]: { req: AssetPickInput; res: AssetResult }
  [CH.asset.get]: { req: AssetGetInput; res: AssetResult }
  [CH.asset.remove]: { req: AssetGetInput; res: null }

  [CH.draft.list]: { req: void; res: DraftRecord[] }
  [CH.draft.get]: { req: { id: string }; res: DraftWithData }
  [CH.draft.save]: { req: DraftSaveInput; res: DraftRecord }
  [CH.draft.remove]: { req: { id: string }; res: null }

  [CH.invoice.list]: { req: void; res: InvoiceSummary[] }
  [CH.invoice.get]: { req: { id: string }; res: WizardData & { id: string } }
  [CH.invoice.create]: { req: CreateInvoiceInput; res: InvoiceSummary }
  [CH.invoice.remove]: { req: { id: string }; res: null }
  [CH.invoice.allocateNumber]: { req: AllocateNumberInput; res: AllocatedNumber }

  [CH.document.generate]: { req: { invoiceId: string }; res: GenerateDocumentsResult }
  [CH.document.list]: { req: { invoiceId: string }; res: DocumentFile[] }
  [CH.document.open]: { req: { path: string }; res: null }
  [CH.document.reveal]: { req: { path: string }; res: null }
}

export type IpcChannel = keyof IpcContract
export type IpcRequest<K extends IpcChannel> = IpcContract[K]['req']
export type IpcResponse<K extends IpcChannel> = IpcContract[K]['res']
