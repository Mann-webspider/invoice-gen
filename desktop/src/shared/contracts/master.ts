import { z } from 'zod'

/**
 * Master data — everything the Admin Panel edits.
 *
 * The web backend had a separate controller per entity with copy-pasted CRUD
 * (ExporterDropdown, SupplierDropdown, ArnDeclaration, ProductCategory,
 * ProductSizeDropdown, DropdownOption, plus country options), each with its own
 * routes. Here every entity is one entry in this file plus one entry in the
 * main-process registry, reached through a single `master:*` channel set.
 */

export const MasterEntity = z.enum([
  'exporter',
  'supplier',
  'arn',
  'productCategory',
  'productSize',
  'countryOption',
  'dropdownOption'
])
export type MasterEntity = z.infer<typeof MasterEntity>

const required = (label: string): z.ZodString =>
  z.string().trim().min(1, `${label} is required`)

/* ------------------------------------------------------------------ *
 * Entity payloads
 * ------------------------------------------------------------------ */

export const ExporterInput = z.object({
  companyName: required('Company name'),
  companyAddress: required('Company address'),
  contactNumber: required('Contact number'),
  email: z.string().trim().email('Enter a valid email address'),
  taxId: required('Tax ID'),
  ieCode: required('IE code'),
  panNumber: required('PAN number'),
  gstinNumber: required('GSTIN number'),
  stateCode: required('State code'),
  authorizedName: required('Authorised name'),
  authorizedDesignation: required('Authorised designation'),
  companyPrefix: required('Invoice prefix'),
  /**
   * Where numbering stands for this exporter. The web app kept these as
   * columns on exporters_dropdown and incremented last_invoice_number in place;
   * here they are written through to invoice_sequence, which is what actually
   * allocates numbers.
   */
  invoiceYear: required('Invoice year'),
  lastInvoiceNumber: z.coerce
    .number({ invalid_type_error: 'Enter a whole number' })
    .int('Enter a whole number')
    .min(0, 'Cannot be negative')
})
export type ExporterInput = z.infer<typeof ExporterInput>

export const SupplierInput = z.object({
  name: required('Supplier name'),
  address: required('Address'),
  gstinNumber: required('GSTIN number'),
  permission: z.string().trim().default('')
})
export type SupplierInput = z.infer<typeof SupplierInput>

export const ArnInput = z.object({
  arn: required('Application reference number'),
  gstCircular: required('GST circular')
})
export type ArnInput = z.infer<typeof ArnInput>

export const ProductCategoryInput = z.object({
  description: required('Description'),
  hsnCode: required('HSN code')
})
export type ProductCategoryInput = z.infer<typeof ProductCategoryInput>

export const ProductSizeInput = z.object({
  size: required('Size'),
  /**
   * Not a number: the live data holds both 1.44 and the placeholder '-' for
   * products that are not sold by area.
   */
  sqm: required('SQM')
})
export type ProductSizeInput = z.infer<typeof ProductSizeInput>

export const CountryOptionInput = z.object({
  finalDestination: required('Final destination'),
  portOfDischarge: required('Port of discharge'),
  isActive: z.boolean().default(true)
})
export type CountryOptionInput = z.infer<typeof CountryOptionInput>

export const DropdownOptionInput = z.object({
  category: required('Category'),
  value: required('Value'),
  isActive: z.boolean().default(true)
})
export type DropdownOptionInput = z.infer<typeof DropdownOptionInput>

/* ------------------------------------------------------------------ *
 * Records as returned to the renderer
 * ------------------------------------------------------------------ */

// Return type is deliberately inferred: spelling out ZodObject's extended shape
// would be less accurate than what zod derives, and the exported *Record types
// below are the contract that actually matters.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const withId = <T extends z.ZodRawShape>(shape: z.ZodObject<T>) =>
  shape.extend({ id: z.string() })

export const ExporterRecord = withId(ExporterInput).extend({
  /** Which letterhead images exist on disk, for the upload widgets. */
  images: z.object({
    header: z.boolean(),
    footer: z.boolean(),
    signature: z.boolean()
  }),
  /** Per fiscal year, from invoice_sequence. Read-only in the UI. */
  sequences: z.array(z.object({ fiscalYear: z.string(), last: z.number() }))
})
export type ExporterRecord = z.infer<typeof ExporterRecord>

export const SupplierRecord = withId(SupplierInput)
export type SupplierRecord = z.infer<typeof SupplierRecord>

export const ArnRecord = withId(ArnInput)
export type ArnRecord = z.infer<typeof ArnRecord>

export const ProductCategoryRecord = withId(ProductCategoryInput)
export type ProductCategoryRecord = z.infer<typeof ProductCategoryRecord>

export const ProductSizeRecord = withId(ProductSizeInput)
export type ProductSizeRecord = z.infer<typeof ProductSizeRecord>

export const CountryOptionRecord = withId(CountryOptionInput).extend({
  position: z.number()
})
export type CountryOptionRecord = z.infer<typeof CountryOptionRecord>

export const DropdownOptionRecord = withId(DropdownOptionInput).extend({
  position: z.number()
})
export type DropdownOptionRecord = z.infer<typeof DropdownOptionRecord>

/** Discriminated by entity, so one channel can serve every master list. */
export interface MasterRecordMap {
  exporter: ExporterRecord
  supplier: SupplierRecord
  arn: ArnRecord
  productCategory: ProductCategoryRecord
  productSize: ProductSizeRecord
  countryOption: CountryOptionRecord
  dropdownOption: DropdownOptionRecord
}

export interface MasterInputMap {
  exporter: ExporterInput
  supplier: SupplierInput
  arn: ArnInput
  productCategory: ProductCategoryInput
  productSize: ProductSizeInput
  countryOption: CountryOptionInput
  dropdownOption: DropdownOptionInput
}

/* ------------------------------------------------------------------ *
 * Request envelopes
 * ------------------------------------------------------------------ */

export const MasterListInput = z.object({
  entity: MasterEntity,
  /** dropdownOption only: restrict to one category. */
  category: z.string().optional()
})
export type MasterListInput = z.infer<typeof MasterListInput>

export const MasterCreateInput = z.object({
  entity: MasterEntity,
  data: z.unknown()
})

export const MasterUpdateInput = z.object({
  entity: MasterEntity,
  id: z.string().min(1),
  data: z.unknown()
})

export const MasterRemoveInput = z.object({
  entity: MasterEntity,
  id: z.string().min(1)
})
export type MasterRemoveInput = z.infer<typeof MasterRemoveInput>

export const MasterReorderInput = z.object({
  entity: MasterEntity,
  /** Ids in their new display order. */
  ids: z.array(z.string().min(1))
})
export type MasterReorderInput = z.infer<typeof MasterReorderInput>

/* ------------------------------------------------------------------ *
 * Exporter letterhead assets
 * ------------------------------------------------------------------ */

export const AssetKind = z.enum(['header', 'footer', 'signature'])
export type AssetKind = z.infer<typeof AssetKind>

export const AssetPickInput = z.object({
  exporterId: z.string().min(1),
  kind: AssetKind
})
export type AssetPickInput = z.infer<typeof AssetPickInput>

export const AssetGetInput = z.object({
  exporterId: z.string().min(1),
  kind: AssetKind
})
export type AssetGetInput = z.infer<typeof AssetGetInput>

/** data: URL for <img src>, or null when nothing has been uploaded. */
export const AssetResult = z.object({
  dataUrl: z.string().nullable()
})
export type AssetResult = z.infer<typeof AssetResult>
