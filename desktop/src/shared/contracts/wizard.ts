import { z } from 'zod'

/**
 * The canonical wizard model — one shape for all four steps.
 *
 * The web app had no single model. State was spread across a root
 * react-hook-form instance, a FormContext, the drafts API, and 142 raw
 * localStorage writes under keys like invoiceFormData, invoiceData2, orderData,
 * vgmData and annexureData2. The cost is visible in the client's own saved
 * drafts: each container row carries BOTH camelCase and snake_case copies of
 * the same fields, holding different values —
 *
 *   { containerNo: 'container-1', netWeight: '125', grossWeight: '652',
 *     container_no: 'container-1', net_weight: '33', gross_weight: '254' }
 *
 * — because the invoice page and the packing-list page each wrote their own
 * naming into the same row, and whichever ran last won. The same drafts also
 * store `containerRows` and `totalPallet` at the top level as duplicates of
 * `invoice.products.containers` and `invoice.products.total_pallet_count`.
 *
 * Here each value exists exactly once, in snake_case, matching the column names
 * the document generator already reads.
 *
 * Values stay strings. These fields are printed onto customs paperwork, where
 * '-' is a meaningful entry and trailing zeros matter; parsing them to numbers
 * and back is what turned prices into 30503.98 stored in an INT column.
 */

const str = z.string().default('')
const required = (label: string): z.ZodString =>
  z.string().trim().min(1, `${label} is required`)

/* ------------------------------------------------------------------ *
 * Parties
 * ------------------------------------------------------------------ */

export const WizardExporter = z.object({
  /** exporter_master.id — resolves the letterhead images at generation time. */
  id: str,
  company_name: str,
  company_address: str,
  contact_number: str,
  email: str,
  tax_id: str,
  ie_code: str,
  pan_number: str,
  gstin_number: str,
  state_code: str,
  authorized_name: str,
  authorized_designation: str,
  company_prefix: str,
  invoice_year: str
})

export const WizardBuyer = z.object({
  buyer_order_no: str,
  buyer_order_date: str,
  po_no: str,
  consignee: str,
  notify_party: str
})

export const WizardShipping = z.object({
  pre_carriage_by: str,
  place_of_receipt: str,
  vessel_flight_no: str,
  port_of_loading: str,
  port_of_discharge: str,
  final_destination: str,
  country_of_origin: str,
  country_of_final_destination: str,
  origin_details: str,
  terms_of_delivery: str,
  payment: str,
  shipping_method: str
})

export const WizardSupplier = z.object({
  /** supplier_master.id when chosen from the dropdown, blank when typed in. */
  id: str,
  name: str,
  address: str,
  gstin_number: str,
  tax_invoice_number: str,
  date: str
})

/* ------------------------------------------------------------------ *
 * Goods
 * ------------------------------------------------------------------ */

export const WizardProduct = z.object({
  id: str,
  category_id: str,
  category_name: str,
  hsn_code: str,
  product_name: str,
  size: str,
  quantity: str,
  unit: str,
  sqm: str,
  total_sqm: str,
  price: str,
  total_price: str,
  net_weight: str,
  gross_weight: str
})

/**
 * One physical container. Single naming — see the note at the top of this file
 * for what happened when there were two.
 */
export const WizardContainer = z.object({
  id: str,
  container_no: str,
  line_seal_no: str,
  rfid_seal: str,
  design_no: str,
  quantity: str,
  net_weight: str,
  gross_weight: str
})

export const WizardProducts = z.object({
  /** Marks is derived: `${leftValue} X ${rightValue}`, e.g. "10 X 20'". */
  leftValue: str,
  rightValue: str,
  marks: str,
  nos: str,
  goods: str,
  freight: str,
  insurance: str,
  total_price: str,
  total_pallet_count: str,
  product_list: z.array(WizardProduct).default([]),
  containers: z.array(WizardContainer).default([])
})

export const WizardPackage = z.object({
  no_of_packages: str,
  no_of_sqm: str,
  total_sqm: str,
  total_fob: str,
  taxable_value: str,
  gst_amount: str,
  amount_in_words: str,
  gst_circular: str,
  arn_no: str,
  lut_date: str,
  total_gross_weight: str,
  total_net_weight: str
})

/* ------------------------------------------------------------------ *
 * Steps 3 and 4
 * ------------------------------------------------------------------ */

export const WizardAnnexure = z.object({
  invoice_date: str,
  commissionerate: str,
  division: str,
  range: str,
  containerized: str,
  non_containerized: str,
  exam_date: str,
  gross_weight: str,
  net_weight: str,
  total_packages: str,
  bin_number: str,
  branch_code: str,
  location_code: str,
  lut_date: str,
  officer_designation1: str,
  officer_designation2: str,
  question9a: str,
  question9b: str,
  question9c: str,
  selected_manufacturer: z
    .object({
      name: str,
      address: str,
      gstin_number: str,
      permission: str
    })
    .default({})
})

export const WizardVgmContainer = z.object({
  id: str,
  booking_no: str,
  container_no: str,
  tare_weight: str,
  gross_weight: str,
  total_vgm: str
})

export const WizardVgm = z.object({
  shipper_name: str,
  ie_code: str,
  authorized_name: str,
  authorized_contact: str,
  container_number: str,
  container_size: str,
  permissible_weight: str,
  weighbridge_registration: str,
  verified_gross_mass: str,
  unit_of_measurement: str,
  dt_weighing: str,
  weighing_slip_no: str,
  type: str,
  imdg_class: str,
  forwarder_email: str,
  containers: z.array(WizardVgmContainer).default([])
})

/* ------------------------------------------------------------------ *
 * The whole form
 * ------------------------------------------------------------------ */

export const WizardInvoice = z.object({
  invoice_number: str,
  invoice_date: str,
  integrated_tax: str,
  payment_term: str,
  product_type: str,
  currency_type: str,
  currency_rate: str,
  exporter: WizardExporter.default({}),
  buyer: WizardBuyer.default({}),
  shipping: WizardShipping.default({}),
  products: WizardProducts.default({}),
  package: WizardPackage.default({}),
  suppliers: z.array(WizardSupplier).default([])
})

/**
 * Every level carries a default, so `WizardData.parse({})` yields a complete
 * empty form and a draft saved by an older build gains any field added since
 * without the wizard crashing on undefined.
 */
export const WizardData = z.object({
  invoice: WizardInvoice.default({}),
  annexure: WizardAnnexure.default({}),
  vgm: WizardVgm.default({})
})
export type WizardData = z.infer<typeof WizardData>
export type WizardProduct = z.infer<typeof WizardProduct>
export type WizardContainer = z.infer<typeof WizardContainer>
export type WizardVgmContainer = z.infer<typeof WizardVgmContainer>
export type WizardSupplier = z.infer<typeof WizardSupplier>

/* ------------------------------------------------------------------ *
 * Per-step validation
 * ------------------------------------------------------------------ */

/**
 * A draft may be incomplete — that is the point of a draft — so WizardData
 * itself requires nothing. These schemas gate moving to the next step, and the
 * full set is checked again before an invoice is created.
 */
export const Step1Schema = z.object({
  invoice: z.object({
    invoice_number: required('Invoice number'),
    invoice_date: required('Invoice date'),
    payment_term: required('Payment term'),
    currency_type: required('Currency'),
    currency_rate: required('Currency rate'),
    exporter: z.object({ id: required('Exporter') }).passthrough(),
    products: z
      .object({
        product_list: z
          .array(z.object({ product_name: required('Product name') }).passthrough())
          .min(1, 'Add at least one product')
      })
      .passthrough()
  })
})

export const Step2Schema = z.object({
  invoice: z.object({
    products: z
      .object({
        containers: z
          .array(z.object({ container_no: required('Container number') }).passthrough())
          .min(1, 'Add at least one container')
      })
      .passthrough()
  })
})

export const Step3Schema = z.object({
  annexure: z
    .object({
      exam_date: required('Examination date'),
      range: required('Range'),
      division: required('Division'),
      commissionerate: required('Commissionerate')
    })
    .passthrough()
})

export const Step4Schema = z.object({
  vgm: z
    .object({
      shipper_name: required('Shipper name'),
      authorized_name: required('Authorised name'),
      containers: z
        .array(z.object({ container_no: required('Container number') }).passthrough())
        .min(1, 'Add at least one container')
    })
    .passthrough()
})

export const WIZARD_STEPS = [
  { id: 'invoice', path: '/invoice', label: 'Invoice', schema: Step1Schema },
  { id: 'packaging-list', path: '/packaging-list', label: 'Packaging List', schema: Step2Schema },
  { id: 'annexure', path: '/annexure', label: 'Annexure', schema: Step3Schema },
  { id: 'vgm-form', path: '/vgm-form', label: 'VGM', schema: Step4Schema }
] as const

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id']

/* ------------------------------------------------------------------ *
 * Drafts
 * ------------------------------------------------------------------ */

export const DraftRecord = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  lastPage: z.string(),
  isSubmitted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
})
export type DraftRecord = z.infer<typeof DraftRecord>

export const DraftWithData = DraftRecord.extend({ data: WizardData })
export type DraftWithData = z.infer<typeof DraftWithData>

export const DraftSaveInput = z.object({
  /** Absent on the first save of a new draft. */
  id: z.string().optional(),
  data: WizardData,
  lastPage: z.string(),
  invoiceNumber: z.string()
})
export type DraftSaveInput = z.infer<typeof DraftSaveInput>

/* ------------------------------------------------------------------ *
 * Invoice numbering and creation
 * ------------------------------------------------------------------ */

export const AllocateNumberInput = z.object({
  exporterId: z.string().min(1, 'Choose an exporter'),
  fiscalYear: z.string().min(1)
})
export type AllocateNumberInput = z.infer<typeof AllocateNumberInput>

export const AllocatedNumber = z.object({
  invoiceNumber: z.string(),
  sequence: z.number(),
  fiscalYear: z.string()
})
export type AllocatedNumber = z.infer<typeof AllocatedNumber>

export const CreateInvoiceInput = z.object({
  data: WizardData,
  /** Marks the draft submitted once the invoice is written. */
  draftId: z.string().optional()
})
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceInput>

export const InvoiceSummary = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  exporterName: z.string(),
  consignee: z.string(),
  currencyType: z.string(),
  totalPrice: z.string(),
  productCount: z.number(),
  createdAt: z.string()
})
export type InvoiceSummary = z.infer<typeof InvoiceSummary>

/* ------------------------------------------------------------------ *
 * Generated documents
 * ------------------------------------------------------------------ */

export const DocumentFile = z.object({
  name: z.string(),
  path: z.string(),
  sizeBytes: z.number(),
  modifiedAt: z.string(),
  kind: z.enum(['xlsx', 'docx', 'pdf'])
})
export type DocumentFile = z.infer<typeof DocumentFile>

export const GenerateDocumentsResult = z.object({
  directory: z.string(),
  /** Prefix the PDFs are named with, e.g. "0089 - POLAND - LCL". */
  baseFileName: z.string(),
  files: z.array(DocumentFile)
})
export type GenerateDocumentsResult = z.infer<typeof GenerateDocumentsResult>
