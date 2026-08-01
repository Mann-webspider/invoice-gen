import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { runMigrations } from '../db/migrate'
import type { ImportOptions, ImportReport, LegacyRow, LegacyValue } from './legacyTypes'

/* ------------------------------------------------------------------ *
 * Value coercion
 * ------------------------------------------------------------------ */

/** Everything lands in a TEXT column, so normalise to a string. */
const text = (value: LegacyValue): string => {
  if (value === null || value === undefined) return ''
  if (Buffer.isBuffer(value)) return value.toString('utf8')
  return String(value)
}

const int = (value: LegacyValue, fallback = 0): number => {
  const parsed = Number.parseInt(text(value), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const bool = (value: LegacyValue, fallback = true): boolean => {
  if (value === null || value === undefined) return fallback
  return int(value, fallback ? 1 : 0) !== 0
}

/**
 * Parses the id arrays that the web app stored in BLOB columns.
 *
 * The encoding is inconsistent between columns, because the PHP side
 * json_encode'd values that were already JSON strings:
 *   invoice.supplier_ids        -> ["id"]              (single encoded)
 *   product_details.product_ids -> "[\"id\"]"          (double encoded)
 *   vgm.containers_id           -> "[\"id\"]"          (double encoded)
 * Both are handled by decoding until the result stops being a string.
 */
const parseIdList = (value: LegacyValue): string[] => {
  let current: unknown = text(value)
  if (current === '') return []

  for (let depth = 0; depth < 4 && typeof current === 'string'; depth++) {
    try {
      current = JSON.parse(current)
    } catch {
      return []
    }
  }

  if (!Array.isArray(current)) return []
  return current.filter((id): id is string => typeof id === 'string' && id.length > 0)
}

/**
 * Derives the fiscal year from an invoice number such as INV/0018/2024-25.
 * Falls back to the exporter's recorded invoice_year.
 */
const fiscalYearOf = (invoiceNumber: string, fallback: string): string => {
  const match = invoiceNumber.match(/(\d{4}-\d{2})\s*$/)
  return match ? match[1] : fallback
}

/** Trailing sequence number in INV/0018/2024-25 -> 18. */
const sequenceOf = (invoiceNumber: string): number => {
  const parts = invoiceNumber.split('/')
  if (parts.length < 2) return 0
  const parsed = Number.parseInt(parts[1], 10)
  return Number.isFinite(parsed) ? parsed : 0
}

/* ------------------------------------------------------------------ *
 * Import
 * ------------------------------------------------------------------ */

export const importLegacyDatabase = (options: ImportOptions): ImportReport => {
  const startedAt = Date.now()
  const duplicateStrategy = options.duplicateStrategy ?? 'keep-latest'

  const report: ImportReport = {
    imported: {},
    duplicateInvoices: [],
    brokenReferences: [],
    orphanAssets: [],
    assetsCopied: 0,
    documentsCopied: 0,
    sequences: [],
    warnings: [],
    durationMs: 0
  }

  if (!existsSync(options.legacyDbFile)) {
    throw new Error(`Legacy database not found: ${options.legacyDbFile}`)
  }

  const legacy = new Database(options.legacyDbFile, { readonly: true })
  const target = new Database(options.targetDbFile)

  try {
    target.pragma('journal_mode = WAL')
    target.pragma('foreign_keys = ON')
    runMigrations(target)

    const all = (table: string): LegacyRow[] => {
      const exists = legacy
        .prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`)
        .get(table)
      if (!exists) {
        report.warnings.push(`Legacy table ${table} is absent; skipped.`)
        return []
      }
      return legacy.prepare(`SELECT * FROM "${table}"`).all() as LegacyRow[]
    }

    const count = (table: string, n: number): void => {
      report.imported[table] = (report.imported[table] ?? 0) + n
    }

    const run = target.transaction(() => {
      importMasters(target, all, count, report)
      // Snapshots are matched back to their master by company name, not by id:
      // invoice.exporter_id points at a per-invoice exporter_details row that
      // shares no id with exporters_dropdown. The web app resolved letterheads
      // the same way (ExporterDropdown::where('company_name', ...)).
      const exporterMasterByName = new Map(
        (
          target.prepare('SELECT id, company_name FROM exporter_master').all() as {
            id: string
            company_name: string
          }[]
        ).map((r) => [r.company_name, r.id])
      )
      const supplierMasterByName = new Map(
        (
          target.prepare('SELECT id, name FROM supplier_master').all() as {
            id: string
            name: string
          }[]
        ).map((r) => [r.name, r.id])
      )
      importInvoices(
        target,
        all,
        count,
        report,
        duplicateStrategy,
        exporterMasterByName,
        supplierMasterByName
      )
      importDrafts(target, all, count)
      seedSequences(target, all, report, count)

      if (options.dryRun) throw new DryRunRollback()
    })

    try {
      run()
    } catch (error) {
      if (!(error instanceof DryRunRollback)) throw error
      report.warnings.push('Dry run: all database changes were rolled back.')
    }

    copyAssets(options, report)
    copyDocuments(options, report)
  } finally {
    legacy.close()
    target.close()
  }

  report.durationMs = Date.now() - startedAt
  return report
}

class DryRunRollback extends Error {}

/* ------------------------------------------------------------------ *
 * Master data
 * ------------------------------------------------------------------ */

type AllFn = (table: string) => LegacyRow[]
type CountFn = (table: string, n: number) => void

const importMasters = (
  target: Database.Database,
  all: AllFn,
  count: CountFn,
  report: ImportReport
): void => {
  const now = new Date().toISOString()

  const exporters = all('exporters_dropdown')
  const insertExporter = target.prepare(
    `INSERT INTO exporter_master (id, company_name, company_address, contact_number, email,
       tax_id, ie_code, pan_number, gstin_number, state_code, authorized_name,
       authorized_designation, company_prefix, created_at, updated_at)
     VALUES (@id, @companyName, @companyAddress, @contactNumber, @email, @taxId, @ieCode,
       @panNumber, @gstinNumber, @stateCode, @authorizedName, @authorizedDesignation,
       @companyPrefix, @now, @now)`
  )
  for (const row of exporters) {
    insertExporter.run({
      id: text(row.id),
      companyName: text(row.company_name),
      companyAddress: text(row.company_address),
      contactNumber: text(row.contact_number),
      email: text(row.email),
      taxId: text(row.tax_id),
      ieCode: text(row.ie_code),
      panNumber: text(row.pan_number),
      gstinNumber: text(row.gstin_number),
      stateCode: text(row.state_code),
      authorizedName: text(row.authorized_name),
      authorizedDesignation: text(row.authorized_designation),
      companyPrefix: text(row.company_prefix),
      now
    })
  }
  count('exporter_master', exporters.length)

  const suppliers = all('suppliers_dropdown')
  const insertSupplier = target.prepare(
    `INSERT INTO supplier_master (id, name, address, permission, gstin_number, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  for (const row of suppliers) {
    insertSupplier.run(
      text(row.id),
      text(row.name),
      text(row.address),
      text(row.permission),
      text(row.gstin_number),
      now,
      now
    )
  }
  count('supplier_master', suppliers.length)

  const arns = all('arn_dropdown')
  const insertArn = target.prepare(
    `INSERT INTO arn_master (id, arn, gst_circular, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
  )
  for (const row of arns) {
    insertArn.run(text(row.id), text(row.arn), text(row.gst_circular), now, now)
  }
  count('arn_master', arns.length)

  const categories = all('product_category')
  const insertCategory = target.prepare(
    `INSERT INTO product_category (id, description, hsn_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
  )
  for (const row of categories) {
    insertCategory.run(text(row.id), text(row.description), text(row.hsn_code), now, now)
  }
  count('product_category', categories.length)

  const sizes = all('product_size_dropdown')
  const insertSize = target.prepare(
    `INSERT INTO product_size (id, size, sqm, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
  )
  for (const row of sizes) {
    insertSize.run(text(row.id), text(row.size), text(row.sqm), now, now)
  }
  count('product_size', sizes.length)

  const countries = all('country_dropdown_options')
  const insertCountry = target.prepare(
    `INSERT INTO country_option (id, final_destination, port_of_discharge, is_active, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  countries.forEach((row, index) => {
    insertCountry.run(
      text(row.id),
      text(row.final_destination),
      text(row.port_of_discharge),
      bool(row.is_active) ? 1 : 0,
      index,
      text(row.created_at) || now,
      text(row.updated_at) || now
    )
  })
  count('country_option', countries.length)

  // Position is per category: the old table had no ordering column at all.
  const options = all('dropdown_options')
  const insertOption = target.prepare(
    `INSERT INTO dropdown_option (id, category, value, is_active, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const positionByCategory = new Map<string, number>()
  for (const row of options) {
    const category = text(row.category)
    const position = positionByCategory.get(category) ?? 0
    positionByCategory.set(category, position + 1)
    insertOption.run(
      text(row.id),
      category,
      text(row.value),
      bool(row.is_active) ? 1 : 0,
      position,
      text(row.created_at) || now,
      text(row.updated_at) || now
    )
  }
  count('dropdown_option', options.length)

  /**
   * Users are imported without their passwords. The legacy table stores them in
   * clear text ('admin', 'user'), so there is nothing worth migrating and
   * carrying them over would preserve the weakness. Phase 2 asks the client to
   * set a password on first run; until then these accounts cannot sign in.
   */
  const users = all('users')
  const insertUser = target.prepare(
    `INSERT OR IGNORE INTO users (id, name, email, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, '', ?, ?, ?)`
  )
  let usersImported = 0
  for (const row of users) {
    const role = text(row.role) === 'admin' ? 'admin' : 'user'
    const result = insertUser.run(
      text(row.id),
      text(row.name),
      text(row.email),
      role,
      text(row.created_at) || now,
      text(row.updated_at) || now
    )
    usersImported += result.changes
  }
  count('users', usersImported)
  if (users.length > 0) {
    report.warnings.push(
      `${users.length} user account(s) imported without passwords — the legacy database stored them in clear text. Each user must set a new password before signing in.`
    )
  }
}

/* ------------------------------------------------------------------ *
 * Invoices
 * ------------------------------------------------------------------ */

const importInvoices = (
  target: Database.Database,
  all: AllFn,
  count: CountFn,
  report: ImportReport,
  duplicateStrategy: 'keep-latest' | 'keep-all-suffixed',
  exporterMasterByName: Map<string, string>,
  supplierMasterByName: Map<string, string>
): void => {
  const byId = <T extends LegacyRow>(rows: T[]): Map<string, T> =>
    new Map(rows.map((row) => [text(row.id), row]))

  const exporterDetails = byId(all('exporter_details'))
  const buyerDetails = byId(all('buyer_details'))
  const shippingDetails = byId(all('shipping_details'))
  const packageInformation = byId(all('package_information'))
  const annexures = byId(all('annexure'))
  const vgms = byId(all('vgm'))
  const productDetails = byId(all('product_details'))
  const supplierDetails = byId(all('supplier_details'))
  const productLists = byId(all('product_lists'))
  const containerInformation = byId(all('container_information'))
  const vgmContainers = byId(all('vgm_container'))

  const invoices = all('invoice')

  // Resolve duplicates before writing anything, so the report is complete even
  // if a later row fails.
  const grouped = new Map<string, LegacyRow[]>()
  for (const row of invoices) {
    const number = text(row.invoice_number)
    const bucket = grouped.get(number)
    if (bucket) bucket.push(row)
    else grouped.set(number, [row])
  }

  const planned: { row: LegacyRow; invoiceNumber: string }[] = []
  for (const [number, rows] of grouped) {
    if (rows.length === 1) {
      planned.push({ row: rows[0], invoiceNumber: number })
      continue
    }

    const sorted = [...rows].sort((a, b) =>
      text(a.created_at).localeCompare(text(b.created_at))
    )
    const kept = sorted[sorted.length - 1]

    if (duplicateStrategy === 'keep-latest') {
      report.duplicateInvoices.push({
        invoiceNumber: number,
        keptId: text(kept.id),
        droppedIds: sorted.slice(0, -1).map((row) => text(row.id))
      })
      planned.push({ row: kept, invoiceNumber: number })
    } else {
      report.duplicateInvoices.push({
        invoiceNumber: number,
        keptId: text(kept.id),
        droppedIds: []
      })
      sorted.forEach((row, index) => {
        planned.push({
          row,
          invoiceNumber: index === sorted.length - 1 ? number : `${number} (${index + 1})`
        })
      })
    }
  }

  const insertExporterSnapshot = target.prepare(
    `INSERT INTO exporter_snapshot (id, company_name, company_address, contact_number, email,
       tax_id, ie_code, pan_number, gstin_number, state_code, authorized_name,
       authorized_designation, master_id)
     VALUES (@id, @companyName, @companyAddress, @contactNumber, @email, @taxId, @ieCode,
       @panNumber, @gstinNumber, @stateCode, @authorizedName, @authorizedDesignation, @masterId)`
  )
  const insertBuyerSnapshot = target.prepare(
    `INSERT INTO buyer_snapshot (id, order_number, order_date, po_number, consignee, notify_party)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
  const insertShippingSnapshot = target.prepare(
    `INSERT INTO shipping_snapshot (id, pre_carriage, place_of_receipt, shipping_number,
       port_of_loading, port_of_discharge, final_destination, country_of_origin, origin_details,
       country_of_final_destination, terms_of_delivery, payment, vessel_flight_no, shipping_method)
     VALUES (@id, @preCarriage, @placeOfReceipt, @shippingNumber, @portOfLoading, @portOfDischarge,
       @finalDestination, @countryOfOrigin, @originDetails, @countryOfFinalDestination,
       @termsOfDelivery, @payment, @vesselFlightNo, @shippingMethod)`
  )
  const insertPackageSnapshot = target.prepare(
    `INSERT INTO package_snapshot (id, number_of_package, total_gross_weight, total_net_weight,
       gst_circular, app_ref_number, lut_date, total_amount, total_sqm, taxable_value, gst_amount,
       amount_in_words)
     VALUES (@id, @numberOfPackage, @totalGrossWeight, @totalNetWeight, @gstCircular,
       @appRefNumber, @lutDate, @totalAmount, @totalSqm, @taxableValue, @gstAmount, @amountInWords)`
  )
  const insertAnnexure = target.prepare(
    `INSERT INTO annexure (id, invoice_date, invoice_number, commissionerate, division, range,
       containerized, non_containerized, exam_date, gross_weight, net_weight, bin_no, branch_no,
       lut_date, officer_designation1, officer_designation2, question9a, question9b, question9c,
       total_packages, location_code, manufacturer_name, manufacturer_address,
       manufacturer_gstin_no, manufacturer_permission)
     VALUES (@id, @invoiceDate, @invoiceNumber, @commissionerate, @division, @range,
       @containerized, @nonContainerized, @examDate, @grossWeight, @netWeight, @binNo, @branchNo,
       @lutDate, @officerDesignation1, @officerDesignation2, @question9a, @question9b, @question9c,
       @totalPackages, @locationCode, @manufacturerName, @manufacturerAddress,
       @manufacturerGstinNo, @manufacturerPermission)`
  )
  const insertVgm = target.prepare(
    `INSERT INTO vgm (id, invoice_number, shipper_name, ie_code, authorized_name,
       authorized_contact, container_number, container_size, permissible_weight,
       weighbridge_registration, verified_gross_mass, unit_of_measurement, dt_weighing,
       weighing_slip_no, type, imdg_class, forwarder_email)
     VALUES (@id, @invoiceNumber, @shipperName, @ieCode, @authorizedName, @authorizedContact,
       @containerNumber, @containerSize, @permissibleWeight, @weighbridgeRegistration,
       @verifiedGrossMass, @unitOfMeasurement, @dtWeighing, @weighingSlipNo, @type, @imdgClass,
       @forwarderEmail)`
  )
  const insertVgmContainer = target.prepare(
    `INSERT INTO vgm_container (id, vgm_id, position, booking_no, container_no, tare_weight,
       gross_weight, total_vgm)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertProductLine = target.prepare(
    `INSERT OR IGNORE INTO product_line (id, category_id, product_name, size, unit, quantity, sqm,
       total_sqm, price, total_price, net_weight, gross_weight)
     VALUES (@id, @categoryId, @productName, @size, @unit, @quantity, @sqm, @totalSqm, @price,
       @totalPrice, @netWeight, @grossWeight)`
  )
  const insertContainerLine = target.prepare(
    `INSERT OR IGNORE INTO container_line (id, container_number, line_seal_number, rfid_number,
       design_no, quantity_box, net_weight, gross_weight)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertSupplierSnapshot = target.prepare(
    `INSERT OR IGNORE INTO supplier_snapshot (id, supplier_name, supplier_address, gstin_number,
       tax_invoice_no, date, master_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const insertInvoice = target.prepare(
    `INSERT INTO invoice (id, invoice_number, invoice_date, integrated_tax, payment_term,
       product_type, currency_type, currency_rate, marks, nos, freight, insurance, total_price,
       total_pallet_count, exporter_id, buyer_id, shipping_id, package_id, annexure_id, vgm_id,
       created_at, updated_at)
     VALUES (@id, @invoiceNumber, @invoiceDate, @integratedTax, @paymentTerm, @productType,
       @currencyType, @currencyRate, @marks, @nos, @freight, @insurance, @totalPrice,
       @totalPalletCount, @exporterId, @buyerId, @shippingId, @packageId, @annexureId, @vgmId,
       @createdAt, @updatedAt)`
  )
  const linkProduct = target.prepare(
    `INSERT OR IGNORE INTO invoice_product (invoice_id, product_line_id, position) VALUES (?, ?, ?)`
  )
  const linkContainer = target.prepare(
    `INSERT OR IGNORE INTO invoice_container (invoice_id, container_line_id, position) VALUES (?, ?, ?)`
  )
  const linkSupplier = target.prepare(
    `INSERT OR IGNORE INTO invoice_supplier (invoice_id, supplier_snapshot_id, position) VALUES (?, ?, ?)`
  )

  const missing = (rowId: string, column: string, missingId: string): void => {
    report.brokenReferences.push({ table: 'invoice', rowId, column, missingId })
  }

  let invoicesWritten = 0
  let productsWritten = 0
  let containersWritten = 0
  let suppliersWritten = 0
  let vgmContainersWritten = 0

  for (const { row, invoiceNumber } of planned) {
    const invoiceId = text(row.id)

    // Snapshots. Each legacy *_details row belongs to exactly one invoice
    // already — the web app created a fresh one per invoice — so ids carry over.
    const exporterRow = exporterDetails.get(text(row.exporter_id))
    if (!exporterRow) {
      missing(invoiceId, 'exporter_id', text(row.exporter_id))
      continue
    }
    const buyerRow = buyerDetails.get(text(row.buyer_id))
    if (!buyerRow) {
      missing(invoiceId, 'buyer_id', text(row.buyer_id))
      continue
    }
    const shippingRow = shippingDetails.get(text(row.shipping_id))
    if (!shippingRow) {
      missing(invoiceId, 'shipping_id', text(row.shipping_id))
      continue
    }
    const packageRow = packageInformation.get(text(row.package_id))
    if (!packageRow) {
      missing(invoiceId, 'package_id', text(row.package_id))
      continue
    }
    const annexureRow = annexures.get(text(row.annexure_id))
    if (!annexureRow) {
      missing(invoiceId, 'annexure_id', text(row.annexure_id))
      continue
    }
    const vgmRow = vgms.get(text(row.vgm_id))
    if (!vgmRow) {
      missing(invoiceId, 'vgm_id', text(row.vgm_id))
      continue
    }
    const detailRow = productDetails.get(text(row.product_id))
    if (!detailRow) {
      missing(invoiceId, 'product_id', text(row.product_id))
      continue
    }

    // The exporter snapshot points back at its master when one still exists,
    // so the document generator can find the letterhead images.
    const masterId = exporterMasterByName.get(text(exporterRow.company_name)) ?? null

    insertExporterSnapshot.run({
      id: text(exporterRow.id),
      companyName: text(exporterRow.company_name),
      companyAddress: text(exporterRow.company_address),
      contactNumber: text(exporterRow.contact_number),
      email: text(exporterRow.email),
      taxId: text(exporterRow.tax_id),
      ieCode: text(exporterRow.ie_code),
      panNumber: text(exporterRow.pan_number),
      gstinNumber: text(exporterRow.gstin_number),
      stateCode: text(exporterRow.state_code),
      authorizedName: text(exporterRow.authorized_name),
      authorizedDesignation: text(exporterRow.authorized_designation),
      masterId
    })

    insertBuyerSnapshot.run(
      text(buyerRow.id),
      text(buyerRow.order_number),
      text(buyerRow.order_date),
      text(buyerRow.po_number),
      text(buyerRow.consignee),
      text(buyerRow.notify_party)
    )

    insertShippingSnapshot.run({
      id: text(shippingRow.id),
      preCarriage: text(shippingRow.pre_carriage),
      placeOfReceipt: text(shippingRow.place_of_receipt),
      shippingNumber: text(shippingRow.shipping_number),
      portOfLoading: text(shippingRow.port_of_loading),
      portOfDischarge: text(shippingRow.port_of_discharge),
      finalDestination: text(shippingRow.final_destination),
      countryOfOrigin: text(shippingRow.country_of_origin),
      originDetails: text(shippingRow.origin_details),
      countryOfFinalDestination: text(shippingRow.country_of_final_destination),
      termsOfDelivery: text(shippingRow.terms_of_delivery),
      payment: text(shippingRow.payment),
      vesselFlightNo: text(shippingRow.vessel_flight_no),
      shippingMethod: text(shippingRow.shipping_method)
    })

    insertPackageSnapshot.run({
      id: text(packageRow.id),
      numberOfPackage: text(packageRow.number_of_package),
      totalGrossWeight: text(packageRow.total_gross_weight),
      totalNetWeight: text(packageRow.total_net_weight),
      gstCircular: text(packageRow.gst_circular),
      appRefNumber: text(packageRow.app_ref_number),
      lutDate: text(packageRow.lut_date),
      totalAmount: text(packageRow.total_amount),
      totalSqm: text(packageRow.total_sqm),
      taxableValue: text(packageRow.taxable_value),
      gstAmount: text(packageRow.gst_amount),
      amountInWords: text(packageRow.amount_in_words)
    })

    insertAnnexure.run({
      id: text(annexureRow.id),
      invoiceDate: text(annexureRow.invoice_date),
      invoiceNumber: text(annexureRow.invoice_number),
      commissionerate: text(annexureRow.commissionerate),
      division: text(annexureRow.division),
      range: text(annexureRow.range),
      containerized: text(annexureRow.containerized),
      nonContainerized: text(annexureRow.non_containerized),
      examDate: text(annexureRow.exam_date),
      grossWeight: text(annexureRow.gross_weight),
      netWeight: text(annexureRow.net_weight),
      binNo: text(annexureRow.bin_no),
      branchNo: text(annexureRow.branch_no),
      lutDate: text(annexureRow.lut_date),
      officerDesignation1: text(annexureRow.officer_designation1),
      officerDesignation2: text(annexureRow.officer_designation2),
      question9a: text(annexureRow.question9a),
      question9b: text(annexureRow.question9b),
      question9c: text(annexureRow.question9c),
      totalPackages: text(annexureRow.total_packages),
      locationCode: text(annexureRow.location_code),
      manufacturerName: text(annexureRow.manufacturer_name),
      manufacturerAddress: text(annexureRow.manufacturer_address),
      manufacturerGstinNo: text(annexureRow.manufacturer_gstin_no),
      manufacturerPermission: text(annexureRow.manufacturer_permission)
    })

    insertVgm.run({
      id: text(vgmRow.id),
      invoiceNumber: text(vgmRow.invoice_number),
      shipperName: text(vgmRow.shipper_name),
      ieCode: text(vgmRow.ie_code),
      authorizedName: text(vgmRow.authorized_name),
      authorizedContact: text(vgmRow.authorized_contact),
      containerNumber: text(vgmRow.container_number),
      containerSize: text(vgmRow.container_size),
      permissibleWeight: text(vgmRow.permissible_weight),
      weighbridgeRegistration: text(vgmRow.weighbridge_registration),
      verifiedGrossMass: text(vgmRow.verified_gross_mass),
      unitOfMeasurement: text(vgmRow.unit_of_measurement),
      dtWeighing: text(vgmRow.dt_weighing),
      weighingSlipNo: text(vgmRow.weighing_slip_no),
      type: text(vgmRow.type),
      imdgClass: text(vgmRow.IMDG_class),
      forwarderEmail: text(vgmRow.forwarder_email)
    })

    // vgm.containers_id -> vgm_container rows (was a double-encoded JSON array)
    parseIdList(vgmRow.containers_id).forEach((containerId, position) => {
      const container = vgmContainers.get(containerId)
      if (!container) {
        report.brokenReferences.push({
          table: 'vgm',
          rowId: text(vgmRow.id),
          column: 'containers_id',
          missingId: containerId
        })
        return
      }
      insertVgmContainer.run(
        containerId,
        text(vgmRow.id),
        position,
        text(container.booking_no),
        text(container.container_no),
        text(container.tare_weight),
        text(container.gross_weight),
        text(container.total_vgm)
      )
      vgmContainersWritten++
    })

    insertInvoice.run({
      id: invoiceId,
      invoiceNumber,
      invoiceDate: text(row.invoice_date),
      integratedTax: text(row.integrated_tax),
      paymentTerm: text(row.payment_term),
      productType: text(row.product_type),
      // The typo'd source columns die here.
      currencyType: text(row.currancy_type),
      currencyRate: text(row.currancy_rate),
      marks: text(detailRow.marks),
      nos: text(detailRow.nos),
      freight: text(detailRow.freight),
      insurance: text(detailRow.insurance),
      totalPrice: text(detailRow.total_price),
      totalPalletCount: text(detailRow.total_pallet_count),
      exporterId: text(exporterRow.id),
      buyerId: text(buyerRow.id),
      shippingId: text(shippingRow.id),
      packageId: text(packageRow.id),
      annexureId: text(annexureRow.id),
      vgmId: text(vgmRow.id),
      createdAt: text(row.created_at) || new Date().toISOString(),
      updatedAt: text(row.updated_at) || new Date().toISOString()
    })
    invoicesWritten++

    // product_details.product_ids -> invoice_product
    parseIdList(detailRow.product_ids).forEach((productId, position) => {
      const product = productLists.get(productId)
      if (!product) {
        report.brokenReferences.push({
          table: 'product_details',
          rowId: text(detailRow.id),
          column: 'product_ids',
          missingId: productId
        })
        return
      }
      insertProductLine.run({
        id: productId,
        categoryId: text(product.category_id) || null,
        productName: text(product.product_name),
        size: text(product.size),
        unit: text(product.unit),
        quantity: text(product.quantity),
        sqm: text(product.sqm),
        totalSqm: text(product.total_sqm),
        price: text(product.price),
        totalPrice: text(product.total_price),
        netWeight: text(product.net_weight),
        grossWeight: text(product.gross_weight)
      })
      linkProduct.run(invoiceId, productId, position)
      productsWritten++
    })

    // product_details.container_ids -> invoice_container
    parseIdList(detailRow.container_ids).forEach((containerId, position) => {
      const container = containerInformation.get(containerId)
      if (!container) {
        report.brokenReferences.push({
          table: 'product_details',
          rowId: text(detailRow.id),
          column: 'container_ids',
          missingId: containerId
        })
        return
      }
      insertContainerLine.run(
        containerId,
        text(container.container_number),
        text(container.line_seal_number),
        text(container.rfid_number),
        text(container.design_no),
        text(container.quantity_box),
        text(container.net_weight),
        text(container.gross_weight)
      )
      linkContainer.run(invoiceId, containerId, position)
      containersWritten++
    })

    // invoice.supplier_ids -> invoice_supplier (single-encoded, unlike the rest)
    parseIdList(row.supplier_ids).forEach((supplierId, position) => {
      const supplier = supplierDetails.get(supplierId)
      if (!supplier) {
        report.brokenReferences.push({
          table: 'invoice',
          rowId: invoiceId,
          column: 'supplier_ids',
          missingId: supplierId
        })
        return
      }
      insertSupplierSnapshot.run(
        supplierId,
        text(supplier.supplier_name),
        text(supplier.supplier_address),
        text(supplier.gstin_number),
        text(supplier.tax_invoice_no),
        text(supplier.date),
        supplierMasterByName.get(text(supplier.supplier_name)) ?? null
      )
      linkSupplier.run(invoiceId, supplierId, position)
      suppliersWritten++
    })
  }

  count('invoice', invoicesWritten)
  count('exporter_snapshot', invoicesWritten)
  count('buyer_snapshot', invoicesWritten)
  count('shipping_snapshot', invoicesWritten)
  count('package_snapshot', invoicesWritten)
  count('annexure', invoicesWritten)
  count('vgm', invoicesWritten)
  count('vgm_container', vgmContainersWritten)
  count('invoice_product', productsWritten)
  count('invoice_container', containersWritten)
  count('invoice_supplier', suppliersWritten)
}

/* ------------------------------------------------------------------ *
 * Drafts
 * ------------------------------------------------------------------ */

const importDrafts = (target: Database.Database, all: AllFn, count: CountFn): void => {
  const drafts = all('form_drafts')
  const insert = target.prepare(
    `INSERT INTO draft (id, invoice_number, data, last_page, is_submitted, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const now = new Date().toISOString()

  for (const row of drafts) {
    // The web app JSON.stringify'd an already-stringified payload before
    // sending it, so stored drafts are double-encoded. Normalise to one level
    // now rather than making every reader guess.
    let data = text(row.data)
    try {
      const decoded: unknown = JSON.parse(data)
      if (typeof decoded === 'string') data = decoded
    } catch {
      // Leave malformed drafts exactly as they are; the wizard will fail to
      // hydrate one draft rather than the import failing entirely.
    }

    insert.run(
      text(row.id),
      text(row.invoice_number),
      data,
      text(row.last_page),
      bool(row.is_submitted, false) ? 1 : 0,
      text(row.created_at) || now,
      text(row.updated_at) || now
    )
  }
  count('draft', drafts.length)
}

/* ------------------------------------------------------------------ *
 * Invoice numbering
 * ------------------------------------------------------------------ */

/**
 * Seeds invoice_sequence from whichever is higher: the exporter's recorded
 * last_invoice_number, or the largest sequence actually present in an invoice
 * number. The web app tracked only the former, and it had already drifted out
 * of step with reality.
 */
const seedSequences = (
  target: Database.Database,
  all: AllFn,
  report: ImportReport,
  count: CountFn
): void => {
  const exporters = all('exporters_dropdown')
  const invoices = target.prepare('SELECT invoice_number FROM invoice').all() as {
    invoice_number: string
  }[]

  const insert = target.prepare(
    `INSERT INTO invoice_sequence (exporter_id, fiscal_year, last) VALUES (?, ?, ?)
     ON CONFLICT(exporter_id, fiscal_year) DO UPDATE SET last = MAX(last, excluded.last)`
  )

  let written = 0
  for (const exporter of exporters) {
    const exporterId = text(exporter.id)
    const declaredYear = text(exporter.invoice_year) || String(new Date().getFullYear())
    const prefix = text(exporter.company_prefix)

    const byYear = new Map<string, number>()
    byYear.set(declaredYear, int(exporter.last_invoice_number))

    for (const { invoice_number: number } of invoices) {
      if (prefix && !number.startsWith(`${prefix}/`)) continue
      const year = fiscalYearOf(number, declaredYear)
      byYear.set(year, Math.max(byYear.get(year) ?? 0, sequenceOf(number)))
    }

    for (const [fiscalYear, last] of byYear) {
      insert.run(exporterId, fiscalYear, last)
      report.sequences.push({ exporterId, fiscalYear, last })
      written++
    }
  }
  count('invoice_sequence', written)
}

/* ------------------------------------------------------------------ *
 * Files
 * ------------------------------------------------------------------ */

const copyAssets = (options: ImportOptions, report: ImportReport): void => {
  const source = options.legacyUploadsDir
    ? join(options.legacyUploadsDir, 'exporters')
    : undefined
  if (!source || !existsSync(source)) return

  const knownExporters = new Set<string>()
  const db = new Database(options.targetDbFile, { readonly: true })
  try {
    for (const row of db.prepare('SELECT id FROM exporter_master').all() as { id: string }[]) {
      knownExporters.add(row.id)
    }
  } finally {
    db.close()
  }

  const target = join(options.targetAssetsDir, 'exporters')
  mkdirSync(target, { recursive: true })

  for (const entry of readdirSync(source)) {
    const from = join(source, entry)
    if (!statSync(from).isDirectory()) continue

    if (!knownExporters.has(entry)) {
      // Letterheads belonging to exporters that were deleted from the dropdown.
      report.orphanAssets.push(entry)
      continue
    }

    cpSync(from, join(target, entry), { recursive: true })
    report.assetsCopied += readdirSync(from).length
  }
}

const copyDocuments = (options: ImportOptions, report: ImportReport): void => {
  const source = options.legacyDataDir
  if (!source || !existsSync(source)) return

  mkdirSync(options.targetDocumentsDir, { recursive: true })
  cpSync(source, options.targetDocumentsDir, { recursive: true })

  const countFiles = (dir: string): number =>
    readdirSync(dir, { withFileTypes: true }).reduce(
      (total, entry) =>
        total + (entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1),
      0
    )
  report.documentsCopied = countFiles(source)
}

/** Exposed for the first-run wizard, which needs an id before the DB exists. */
export const newId = (): string => randomUUID()
