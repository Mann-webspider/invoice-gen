import { relations, sql } from 'drizzle-orm'
import { index, integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

/**
 * Schema for the desktop app.
 *
 * Three deliberate departures from the web app's schema:
 *
 * 1. Master vs snapshot. The old createInvoice inserted a fresh row into
 *    exporter_details / buyer_details / shipping_details for every invoice, so
 *    those tables grew one row per invoice and there was no editable "master"
 *    record at all. Here *_master is what the Admin Panel edits, and *_snapshot
 *    is the frozen copy taken when an invoice is created, so correcting a
 *    master never rewrites printed history.
 *
 * 2. Real foreign keys. product_details.product_ids, invoice.supplier_ids and
 *    vgm.containers_id were JSON arrays inside BLOB columns with no constraints,
 *    which is why deleteInvoice needed ~300 lines of hand-rolled cascade. They
 *    are junction tables now, with ON DELETE CASCADE.
 *
 * 3. Money and weights are TEXT. The old columns were declared INT but SQLite's
 *    type affinity let through 30503.98, '583 BOX' and '-'. Numeric values are
 *    computed with decimal.js and stored as strings; free-text values survive
 *    unchanged.
 */

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`)
}

/* ------------------------------------------------------------------ *
 * Accounts
 * ------------------------------------------------------------------ */

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  /** Argon2id hash. The web app stored the password in clear text. */
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'user'] })
    .notNull()
    .default('user'),
  ...timestamps
})

/* ------------------------------------------------------------------ *
 * Master data — edited in the Admin Panel
 * ------------------------------------------------------------------ */

export const exporterMaster = sqliteTable('exporter_master', {
  id: text('id').primaryKey(),
  companyName: text('company_name').notNull(),
  companyAddress: text('company_address').notNull(),
  contactNumber: text('contact_number').notNull(),
  email: text('email').notNull(),
  taxId: text('tax_id').notNull(),
  ieCode: text('ie_code').notNull(),
  panNumber: text('pan_number').notNull(),
  gstinNumber: text('gstin_number').notNull(),
  stateCode: text('state_code').notNull(),
  authorizedName: text('authorized_name').notNull(),
  authorizedDesignation: text('authorized_designation').notNull(),
  companyPrefix: text('company_prefix').notNull(),
  /**
   * Letterhead and stamp images live on disk under
   * assets/exporters/{id}/{header|footer|signature}.png. The old table stored
   * an API route ('/upload/header/{id}') in a column, which meant the document
   * generator had to HTTP-fetch its own logos.
   */
  ...timestamps
})

export const supplierMaster = sqliteTable('supplier_master', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  permission: text('permission').notNull(),
  gstinNumber: text('gstin_number').notNull(),
  ...timestamps
})

export const arnMaster = sqliteTable('arn_master', {
  id: text('id').primaryKey(),
  arn: text('arn').notNull(),
  gstCircular: text('gst_circular').notNull(),
  ...timestamps
})

export const productCategory = sqliteTable('product_category', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
  hsnCode: text('hsn_code').notNull(),
  ...timestamps
})

export const productSize = sqliteTable('product_size', {
  id: text('id').primaryKey(),
  size: text('size').notNull(),
  /** TEXT: the live data contains both 1.44 and the placeholder '-'. */
  sqm: text('sqm').notNull(),
  ...timestamps
})

/** final_destination -> port_of_discharge pairs for the shipping form. */
export const countryOption = sqliteTable('country_option', {
  id: text('id').primaryKey(),
  finalDestination: text('final_destination').notNull(),
  portOfDischarge: text('port_of_discharge').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  position: integer('position').notNull().default(0),
  ...timestamps
})

/**
 * Generic single-value dropdowns (port_of_loading, place_of_receipt,
 * country_of_final_destination, unit_type, ...). `position` backs the reorder
 * endpoint, which the old table had no column for — it reordered by rewriting
 * rows.
 */
export const dropdownOption = sqliteTable(
  'dropdown_option',
  {
    id: text('id').primaryKey(),
    category: text('category').notNull(),
    value: text('value').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    position: integer('position').notNull().default(0),
    ...timestamps
  },
  (t) => [index('idx_dropdown_option_category').on(t.category)]
)

/* ------------------------------------------------------------------ *
 * Invoice-scoped snapshots
 * ------------------------------------------------------------------ */

export const exporterSnapshot = sqliteTable('exporter_snapshot', {
  id: text('id').primaryKey(),
  companyName: text('company_name').notNull().default(''),
  companyAddress: text('company_address').notNull().default(''),
  contactNumber: text('contact_number').notNull().default(''),
  email: text('email').notNull().default(''),
  taxId: text('tax_id').notNull().default(''),
  ieCode: text('ie_code').notNull().default(''),
  panNumber: text('pan_number').notNull().default(''),
  gstinNumber: text('gstin_number').notNull().default(''),
  stateCode: text('state_code').notNull().default(''),
  authorizedName: text('authorized_name').notNull().default(''),
  authorizedDesignation: text('authorized_designation').notNull().default(''),
  /** Which master this was copied from, so documents can find the letterhead. */
  masterId: text('master_id').references(() => exporterMaster.id, { onDelete: 'set null' })
})

export const buyerSnapshot = sqliteTable('buyer_snapshot', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().default(''),
  orderDate: text('order_date').notNull().default(''),
  poNumber: text('po_number').notNull().default(''),
  consignee: text('consignee').notNull().default(''),
  notifyParty: text('notify_party').notNull().default('')
})

export const shippingSnapshot = sqliteTable('shipping_snapshot', {
  id: text('id').primaryKey(),
  preCarriage: text('pre_carriage').notNull().default(''),
  placeOfReceipt: text('place_of_receipt').notNull().default(''),
  shippingNumber: text('shipping_number').notNull().default(''),
  portOfLoading: text('port_of_loading').notNull().default(''),
  portOfDischarge: text('port_of_discharge').notNull().default(''),
  finalDestination: text('final_destination').notNull().default(''),
  countryOfOrigin: text('country_of_origin').notNull().default(''),
  originDetails: text('origin_details').notNull().default(''),
  countryOfFinalDestination: text('country_of_final_destination').notNull().default(''),
  termsOfDelivery: text('terms_of_delivery').notNull().default(''),
  payment: text('payment').notNull().default(''),
  vesselFlightNo: text('vessel_flight_no').notNull().default(''),
  shippingMethod: text('shipping_method').notNull().default('')
})

export const packageSnapshot = sqliteTable('package_snapshot', {
  id: text('id').primaryKey(),
  /** Free text in practice, e.g. '583 BOX'. */
  numberOfPackage: text('number_of_package').notNull().default(''),
  totalGrossWeight: text('total_gross_weight').notNull().default(''),
  totalNetWeight: text('total_net_weight').notNull().default(''),
  gstCircular: text('gst_circular').notNull().default(''),
  appRefNumber: text('app_ref_number').notNull().default(''),
  lutDate: text('lut_date').notNull().default(''),
  totalAmount: text('total_amount').notNull().default(''),
  totalSqm: text('total_sqm').notNull().default(''),
  taxableValue: text('taxable_value').notNull().default(''),
  gstAmount: text('gst_amount').notNull().default(''),
  amountInWords: text('amount_in_words').notNull().default('')
})

export const supplierSnapshot = sqliteTable('supplier_snapshot', {
  id: text('id').primaryKey(),
  supplierName: text('supplier_name').notNull().default(''),
  supplierAddress: text('supplier_address').notNull().default(''),
  gstinNumber: text('gstin_number').notNull().default(''),
  taxInvoiceNo: text('tax_invoice_no').notNull().default(''),
  date: text('date').notNull().default(''),
  masterId: text('master_id').references(() => supplierMaster.id, { onDelete: 'set null' })
})

export const annexure = sqliteTable('annexure', {
  id: text('id').primaryKey(),
  invoiceDate: text('invoice_date').notNull().default(''),
  invoiceNumber: text('invoice_number').notNull().default(''),
  commissionerate: text('commissionerate').notNull().default(''),
  division: text('division').notNull().default(''),
  range: text('range').notNull().default(''),
  containerized: text('containerized').notNull().default(''),
  nonContainerized: text('non_containerized').notNull().default(''),
  examDate: text('exam_date').notNull().default(''),
  grossWeight: text('gross_weight').notNull().default(''),
  netWeight: text('net_weight').notNull().default(''),
  binNo: text('bin_no').notNull().default(''),
  branchNo: text('branch_no').notNull().default(''),
  lutDate: text('lut_date').notNull().default(''),
  officerDesignation1: text('officer_designation1').notNull().default(''),
  officerDesignation2: text('officer_designation2').notNull().default(''),
  question9a: text('question9a').notNull().default(''),
  question9b: text('question9b').notNull().default(''),
  question9c: text('question9c').notNull().default(''),
  totalPackages: text('total_packages').notNull().default(''),
  locationCode: text('location_code').notNull().default(''),
  manufacturerName: text('manufacturer_name').notNull().default(''),
  manufacturerAddress: text('manufacturer_address').notNull().default(''),
  manufacturerGstinNo: text('manufacturer_gstin_no').notNull().default(''),
  manufacturerPermission: text('manufacturer_permission').notNull().default('')
})

export const vgm = sqliteTable('vgm', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().default(''),
  shipperName: text('shipper_name').notNull().default(''),
  ieCode: text('ie_code').notNull().default(''),
  authorizedName: text('authorized_name').notNull().default(''),
  authorizedContact: text('authorized_contact').notNull().default(''),
  containerNumber: text('container_number').notNull().default(''),
  containerSize: text('container_size').notNull().default(''),
  permissibleWeight: text('permissible_weight').notNull().default(''),
  weighbridgeRegistration: text('weighbridge_registration').notNull().default(''),
  verifiedGrossMass: text('verified_gross_mass').notNull().default(''),
  unitOfMeasurement: text('unit_of_measurement').notNull().default(''),
  dtWeighing: text('dt_weighing').notNull().default(''),
  weighingSlipNo: text('weighing_slip_no').notNull().default(''),
  type: text('type').notNull().default(''),
  imdgClass: text('imdg_class').notNull().default(''),
  forwarderEmail: text('forwarder_email').notNull().default('')
})

/** Was vgm.containers_id, a double-encoded JSON array in a BLOB column. */
export const vgmContainer = sqliteTable(
  'vgm_container',
  {
    id: text('id').primaryKey(),
    vgmId: text('vgm_id')
      .notNull()
      .references(() => vgm.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    bookingNo: text('booking_no').notNull().default(''),
    containerNo: text('container_no').notNull().default(''),
    tareWeight: text('tare_weight').notNull().default(''),
    grossWeight: text('gross_weight').notNull().default(''),
    totalVgm: text('total_vgm').notNull().default('')
  },
  (t) => [index('idx_vgm_container_vgm').on(t.vgmId)]
)

/** One product row on an invoice. Was product_lists. */
export const productLine = sqliteTable(
  'product_line',
  {
    id: text('id').primaryKey(),
    categoryId: text('category_id').references(() => productCategory.id, {
      onDelete: 'set null'
    }),
    productName: text('product_name').notNull().default(''),
    size: text('size').notNull().default(''),
    unit: text('unit').notNull().default(''),
    quantity: text('quantity').notNull().default(''),
    sqm: text('sqm').notNull().default(''),
    totalSqm: text('total_sqm').notNull().default(''),
    price: text('price').notNull().default(''),
    totalPrice: text('total_price').notNull().default(''),
    netWeight: text('net_weight').notNull().default(''),
    grossWeight: text('gross_weight').notNull().default('')
  },
  (t) => [index('idx_product_line_category').on(t.categoryId)]
)

/** One physical container on an invoice. Was container_information. */
export const containerLine = sqliteTable('container_line', {
  id: text('id').primaryKey(),
  containerNumber: text('container_number').notNull().default(''),
  lineSealNumber: text('line_seal_number').notNull().default(''),
  rfidNumber: text('rfid_number').notNull().default(''),
  designNo: text('design_no').notNull().default(''),
  quantityBox: text('quantity_box').notNull().default(''),
  netWeight: text('net_weight').notNull().default(''),
  grossWeight: text('gross_weight').notNull().default('')
})

/* ------------------------------------------------------------------ *
 * Invoice
 * ------------------------------------------------------------------ */

export const invoice = sqliteTable(
  'invoice',
  {
    id: text('id').primaryKey(),
    /**
     * UNIQUE. The live database contains INV/0018/2024-25 three times — the
     * same form submitted at 07:20, 07:22 and 07:27 — because numbers were
     * allocated with an unlocked read-modify-write and nothing enforced
     * uniqueness. See numbering.service.
     */
    invoiceNumber: text('invoice_number').notNull().unique(),
    invoiceDate: text('invoice_date').notNull().default(''),
    integratedTax: text('integrated_tax').notNull().default(''),
    paymentTerm: text('payment_term').notNull().default(''),
    productType: text('product_type').notNull().default(''),
    currencyType: text('currency_type').notNull().default(''),
    currencyRate: text('currency_rate').notNull().default(''),

    // Invoice-level fields that used to sit in product_details, a table that
    // otherwise existed only to hold two JSON arrays of ids.
    marks: text('marks').notNull().default(''),
    nos: text('nos').notNull().default(''),
    freight: text('freight').notNull().default(''),
    insurance: text('insurance').notNull().default(''),
    totalPrice: text('total_price').notNull().default(''),
    totalPalletCount: text('total_pallet_count').notNull().default(''),

    exporterId: text('exporter_id')
      .notNull()
      .references(() => exporterSnapshot.id, { onDelete: 'cascade' }),
    buyerId: text('buyer_id')
      .notNull()
      .references(() => buyerSnapshot.id, { onDelete: 'cascade' }),
    shippingId: text('shipping_id')
      .notNull()
      .references(() => shippingSnapshot.id, { onDelete: 'cascade' }),
    packageId: text('package_id')
      .notNull()
      .references(() => packageSnapshot.id, { onDelete: 'cascade' }),
    annexureId: text('annexure_id')
      .notNull()
      .references(() => annexure.id, { onDelete: 'cascade' }),
    vgmId: text('vgm_id')
      .notNull()
      .references(() => vgm.id, { onDelete: 'cascade' }),
    ...timestamps
  },
  (t) => [index('idx_invoice_created').on(t.createdAt)]
)

export const invoiceProduct = sqliteTable(
  'invoice_product',
  {
    invoiceId: text('invoice_id')
      .notNull()
      .references(() => invoice.id, { onDelete: 'cascade' }),
    productLineId: text('product_line_id')
      .notNull()
      .references(() => productLine.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0)
  },
  (t) => [primaryKey({ columns: [t.invoiceId, t.productLineId] })]
)

export const invoiceContainer = sqliteTable(
  'invoice_container',
  {
    invoiceId: text('invoice_id')
      .notNull()
      .references(() => invoice.id, { onDelete: 'cascade' }),
    containerLineId: text('container_line_id')
      .notNull()
      .references(() => containerLine.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0)
  },
  (t) => [primaryKey({ columns: [t.invoiceId, t.containerLineId] })]
)

export const invoiceSupplier = sqliteTable(
  'invoice_supplier',
  {
    invoiceId: text('invoice_id')
      .notNull()
      .references(() => invoice.id, { onDelete: 'cascade' }),
    supplierSnapshotId: text('supplier_snapshot_id')
      .notNull()
      .references(() => supplierSnapshot.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0)
  },
  (t) => [primaryKey({ columns: [t.invoiceId, t.supplierSnapshotId] })]
)

/**
 * Invoice number allocation. Replaces exporters_dropdown.last_invoice_number,
 * which was incremented with a read-modify-write outside any transaction.
 */
export const invoiceSequence = sqliteTable(
  'invoice_sequence',
  {
    exporterId: text('exporter_id')
      .notNull()
      .references(() => exporterMaster.id, { onDelete: 'cascade' }),
    fiscalYear: text('fiscal_year').notNull(),
    last: integer('last').notNull().default(0)
  },
  (t) => [
    primaryKey({ columns: [t.exporterId, t.fiscalYear] }),
    unique('uq_invoice_sequence').on(t.exporterId, t.fiscalYear)
  ]
)

/* ------------------------------------------------------------------ *
 * Drafts
 * ------------------------------------------------------------------ */

/**
 * Whole-form JSON, same as form_drafts. This stays a blob on purpose: a draft
 * is an in-progress form, not a validated invoice, so it must be able to hold
 * partial and invalid state. The difference from the web app is that this is
 * now the *only* cross-step store — the wizard no longer also writes
 * invoiceFormData, invoiceData2, orderData, vgmData and annexureData2 into
 * localStorage.
 */
export const draft = sqliteTable(
  'draft',
  {
    id: text('id').primaryKey(),
    invoiceNumber: text('invoice_number').notNull().default(''),
    data: text('data').notNull(),
    lastPage: text('last_page').notNull().default(''),
    isSubmitted: integer('is_submitted', { mode: 'boolean' }).notNull().default(false),
    ...timestamps
  },
  (t) => [index('idx_draft_updated').on(t.updatedAt)]
)

/* ------------------------------------------------------------------ *
 * Relations
 * ------------------------------------------------------------------ */

export const invoiceRelations = relations(invoice, ({ one, many }) => ({
  exporter: one(exporterSnapshot, {
    fields: [invoice.exporterId],
    references: [exporterSnapshot.id]
  }),
  buyer: one(buyerSnapshot, { fields: [invoice.buyerId], references: [buyerSnapshot.id] }),
  shipping: one(shippingSnapshot, {
    fields: [invoice.shippingId],
    references: [shippingSnapshot.id]
  }),
  package: one(packageSnapshot, {
    fields: [invoice.packageId],
    references: [packageSnapshot.id]
  }),
  annexure: one(annexure, { fields: [invoice.annexureId], references: [annexure.id] }),
  vgm: one(vgm, { fields: [invoice.vgmId], references: [vgm.id] }),
  products: many(invoiceProduct),
  containers: many(invoiceContainer),
  suppliers: many(invoiceSupplier)
}))

export const invoiceProductRelations = relations(invoiceProduct, ({ one }) => ({
  invoice: one(invoice, { fields: [invoiceProduct.invoiceId], references: [invoice.id] }),
  productLine: one(productLine, {
    fields: [invoiceProduct.productLineId],
    references: [productLine.id]
  })
}))

export const invoiceContainerRelations = relations(invoiceContainer, ({ one }) => ({
  invoice: one(invoice, { fields: [invoiceContainer.invoiceId], references: [invoice.id] }),
  containerLine: one(containerLine, {
    fields: [invoiceContainer.containerLineId],
    references: [containerLine.id]
  })
}))

export const invoiceSupplierRelations = relations(invoiceSupplier, ({ one }) => ({
  invoice: one(invoice, { fields: [invoiceSupplier.invoiceId], references: [invoice.id] }),
  supplier: one(supplierSnapshot, {
    fields: [invoiceSupplier.supplierSnapshotId],
    references: [supplierSnapshot.id]
  })
}))

export const vgmRelations = relations(vgm, ({ many }) => ({
  containers: many(vgmContainer)
}))

export const vgmContainerRelations = relations(vgmContainer, ({ one }) => ({
  vgm: one(vgm, { fields: [vgmContainer.vgmId], references: [vgm.id] })
}))

export const productLineRelations = relations(productLine, ({ one }) => ({
  category: one(productCategory, {
    fields: [productLine.categoryId],
    references: [productCategory.id]
  })
}))
