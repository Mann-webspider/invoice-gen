import { CH } from '@shared/ipc-channels'
import type {
  AppInfo,
  ArnRecord,
  AssetGetInput,
  AssetPickInput,
  AssetResult,
  ChangePasswordInput,
  CountryOptionRecord,
  CreateAdminInput,
  DropdownOptionRecord,
  ExporterRecord,
  IpcChannel,
  IpcRequest,
  IpcResponse,
  LoginInput,
  MasterEntity,
  MasterInputMap,
  MasterRecordMap,
  ProductCategoryRecord,
  ProductSizeRecord,
  SessionState,
  SessionUser,
  SetPasswordInput,
  SupplierRecord
} from '@shared/contracts'
import type { ErrorCode } from '@shared/result'

/**
 * The renderer's only way to reach the main process.
 *
 * Replaces four overlapping client layers from the web app — lib/axios.ts,
 * lib/apiService.ts, services/api.ts and lib/dataService.ts — with one typed
 * module. Errors throw as IpcError so TanStack Query's error state and the
 * toast handler see them; nothing is silently swallowed.
 */

export class IpcError extends Error {
  readonly code: ErrorCode
  readonly details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'IpcError'
    this.code = code
    this.details = details
  }

  /** Field-level messages from a VALIDATION failure, for react-hook-form setError. */
  get fieldErrors(): Record<string, string[]> {
    return this.code === 'VALIDATION' && this.details
      ? (this.details as Record<string, string[]>)
      : {}
  }
}

/** Unwraps the Result envelope: returns data, or throws IpcError. */
export const call = async <K extends IpcChannel>(
  channel: K,
  payload: IpcRequest<K>
): Promise<IpcResponse<K>> => {
  const result = await window.api.invoke(channel, payload)
  if (result.ok) return result.data
  throw new IpcError(result.code, result.message, result.details)
}

/**
 * Typed per-entity wrappers over the single `master:*` channel set, so callers
 * get the right record type back without casting at every call site.
 */
// Inferred: each call site below narrows this to the concrete record type.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const masterApi = <E extends MasterEntity>(entity: E) => ({
  list: (category?: string) =>
    call(CH.master.list, { entity, category }) as Promise<MasterRecordMap[E][]>,
  create: (data: MasterInputMap[E]) =>
    call(CH.master.create, { entity, data }) as Promise<MasterRecordMap[E]>,
  update: (id: string, data: MasterInputMap[E]) =>
    call(CH.master.update, { entity, id, data }) as Promise<MasterRecordMap[E]>,
  remove: (id: string) => call(CH.master.remove, { entity, id }),
  reorder: (ids: string[]) => call(CH.master.reorder, { entity, ids })
})

export const ipc = {
  app: {
    info: (): Promise<AppInfo> => call(CH.app.info, undefined)
  },

  auth: {
    session: (): Promise<SessionState> => call(CH.auth.session, undefined),
    login: (input: LoginInput): Promise<SessionUser> => call(CH.auth.login, input),
    logout: (): Promise<null> => call(CH.auth.logout, undefined),
    setPassword: (input: SetPasswordInput): Promise<SessionUser> =>
      call(CH.auth.setPassword, input),
    createAdmin: (input: CreateAdminInput): Promise<SessionUser> =>
      call(CH.auth.createAdmin, input),
    changePassword: (input: ChangePasswordInput): Promise<null> =>
      call(CH.auth.changePassword, input)
  },

  exporter: masterApi('exporter') as {
    list: () => Promise<ExporterRecord[]>
    create: (data: MasterInputMap['exporter']) => Promise<ExporterRecord>
    update: (id: string, data: MasterInputMap['exporter']) => Promise<ExporterRecord>
    remove: (id: string) => Promise<null>
    reorder: (ids: string[]) => Promise<null>
  },
  supplier: masterApi('supplier') as {
    list: () => Promise<SupplierRecord[]>
    create: (data: MasterInputMap['supplier']) => Promise<SupplierRecord>
    update: (id: string, data: MasterInputMap['supplier']) => Promise<SupplierRecord>
    remove: (id: string) => Promise<null>
    reorder: (ids: string[]) => Promise<null>
  },
  arn: masterApi('arn') as {
    list: () => Promise<ArnRecord[]>
    create: (data: MasterInputMap['arn']) => Promise<ArnRecord>
    update: (id: string, data: MasterInputMap['arn']) => Promise<ArnRecord>
    remove: (id: string) => Promise<null>
    reorder: (ids: string[]) => Promise<null>
  },
  productCategory: masterApi('productCategory') as {
    list: () => Promise<ProductCategoryRecord[]>
    create: (data: MasterInputMap['productCategory']) => Promise<ProductCategoryRecord>
    update: (
      id: string,
      data: MasterInputMap['productCategory']
    ) => Promise<ProductCategoryRecord>
    remove: (id: string) => Promise<null>
    reorder: (ids: string[]) => Promise<null>
  },
  productSize: masterApi('productSize') as {
    list: () => Promise<ProductSizeRecord[]>
    create: (data: MasterInputMap['productSize']) => Promise<ProductSizeRecord>
    update: (id: string, data: MasterInputMap['productSize']) => Promise<ProductSizeRecord>
    remove: (id: string) => Promise<null>
    reorder: (ids: string[]) => Promise<null>
  },
  countryOption: masterApi('countryOption') as {
    list: () => Promise<CountryOptionRecord[]>
    create: (data: MasterInputMap['countryOption']) => Promise<CountryOptionRecord>
    update: (id: string, data: MasterInputMap['countryOption']) => Promise<CountryOptionRecord>
    remove: (id: string) => Promise<null>
    reorder: (ids: string[]) => Promise<null>
  },
  dropdownOption: masterApi('dropdownOption') as {
    list: (category?: string) => Promise<DropdownOptionRecord[]>
    create: (data: MasterInputMap['dropdownOption']) => Promise<DropdownOptionRecord>
    update: (
      id: string,
      data: MasterInputMap['dropdownOption']
    ) => Promise<DropdownOptionRecord>
    remove: (id: string) => Promise<null>
    reorder: (ids: string[]) => Promise<null>
  },

  asset: {
    get: (input: AssetGetInput): Promise<AssetResult> => call(CH.asset.get, input),
    pick: (input: AssetPickInput): Promise<AssetResult> => call(CH.asset.pick, input),
    remove: (input: AssetGetInput): Promise<null> => call(CH.asset.remove, input)
  }
}
