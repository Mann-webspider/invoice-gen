import { asc } from 'drizzle-orm'
import type { WizardData } from '@shared/contracts'
import { getDb } from '../db/client'
import { productCategory } from '../db/schema'
import type { LegacyInvoiceData } from './excel/types'

/**
 * WizardData -> the shape the ExcelJS generator reads.
 *
 * This is the single seam between the new schema and 8,000 lines of untouched
 * cell arithmetic. Everything the generator expects — including the
 * `currancy_type` / `currancy_rate` misspellings and the `product_section`
 * grouping that `getInvoiceById` built in PHP — is reproduced here, so the
 * database can use correct names without any sheet code changing.
 */

interface CategoryInfo {
  description: string
  hsnCode: string
}

const categoryLookup = (): Map<string, CategoryInfo> =>
  new Map(
    getDb()
      .select()
      .from(productCategory)
      .orderBy(asc(productCategory.description))
      .all()
      .map((row) => [row.id, { description: row.description, hsnCode: row.hsnCode }])
  )

export const toLegacyInvoiceData = (data: WizardData): LegacyInvoiceData => {
  const { invoice } = data
  const categories = categoryLookup()

  const products = invoice.products.product_list.map((product) => {
    // A product saved before its category was chosen still has to print its
    // HSN code, so fall back to the master when the row is blank.
    const category = product.category_id ? categories.get(product.category_id) : undefined
    return {
      id: product.id,
      category_id: product.category_id,
      category_name: product.category_name || category?.description || '',
      hsn_code: product.hsn_code || category?.hsnCode || '',
      product_name: product.product_name,
      size: product.size,
      quantity: product.quantity,
      unit: product.unit,
      sqm: product.sqm,
      total_sqm: product.total_sqm,
      price: product.price,
      total_price: product.total_price,
      net_weight: product.net_weight,
      gross_weight: product.gross_weight
    }
  })

  // The generator reads products grouped by category, in first-appearance
  // order. PHP produced this with a groupBy on the collection.
  const sections = new Map<string, Record<string, unknown>>()
  for (const product of products) {
    const key = product.category_id || product.category_name || 'uncategorised'
    if (!sections.has(key)) {
      sections.set(key, {
        id: key,
        category_id: product.category_id,
        category_name: product.category_name,
        hsn_code: product.hsn_code,
        products: []
      })
    }
    const section = sections.get(key)
    if (section) (section.products as unknown[]).push(product)
  }

  const containers = invoice.products.containers.map((container) => ({
    id: container.id,
    container_number: container.container_no,
    line_seal_number: container.line_seal_no,
    rfid_number: container.rfid_seal,
    design_no: container.design_no,
    quantity_box: container.quantity,
    net_weight: container.net_weight,
    gross_weight: container.gross_weight
  }))

  return {
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    integrated_tax: invoice.integrated_tax,
    payment_term: invoice.payment_term,
    product_type: invoice.product_type,
    // Misspelled on purpose: the generator reads these names.
    currancy_type: invoice.currency_type,
    currancy_rate: invoice.currency_rate,

    exporter: {
      ...invoice.exporter,
      // The generator asks loadImageBuffer for these keys; document.service
      // registers the files on disk under the same keys.
      header: invoice.exporter.id ? `image:header:${invoice.exporter.id}` : null,
      footer: invoice.exporter.id ? `image:footer:${invoice.exporter.id}` : null,
      signature: invoice.exporter.id ? `image:signature:${invoice.exporter.id}` : null
    },

    buyer: {
      order_number: invoice.buyer.buyer_order_no,
      order_date: invoice.buyer.buyer_order_date,
      po_number: invoice.buyer.po_no,
      consignee: invoice.buyer.consignee,
      notify_party: invoice.buyer.notify_party
    },

    shipping: {
      pre_carriage: invoice.shipping.pre_carriage_by,
      place_of_receipt: invoice.shipping.place_of_receipt,
      vessel_flight_no: invoice.shipping.vessel_flight_no,
      port_of_loading: invoice.shipping.port_of_loading,
      port_of_discharge: invoice.shipping.port_of_discharge,
      final_destination: invoice.shipping.final_destination,
      country_of_origin: invoice.shipping.country_of_origin,
      country_of_final_destination: invoice.shipping.country_of_final_destination,
      origin_details: invoice.shipping.origin_details,
      terms_of_delivery: invoice.shipping.terms_of_delivery,
      payment: invoice.shipping.payment,
      shipping_method: invoice.shipping.shipping_method
    },

    package: {
      number_of_package: invoice.package.no_of_packages,
      total_gross_weight: invoice.package.total_gross_weight,
      total_net_weight: invoice.package.total_net_weight,
      gst_circular: invoice.package.gst_circular,
      app_ref_number: invoice.package.arn_no,
      lut_date: invoice.package.lut_date,
      total_amount: invoice.package.total_fob,
      total_sqm: invoice.package.total_sqm,
      taxable_value: invoice.package.taxable_value,
      gst_amount: invoice.package.gst_amount,
      amount_in_words: invoice.package.amount_in_words
    },

    product_details: {
      marks: invoice.products.marks,
      nos: invoice.products.nos,
      freight: invoice.products.freight,
      insurance: invoice.products.insurance,
      total_price: invoice.products.total_price,
      total_pallet_count: invoice.products.total_pallet_count,
      products,
      containers,
      product_section: [...sections.values()]
    },

    suppliers: invoice.suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      address: supplier.address,
      gstin_number: supplier.gstin_number,
      tax_invoice_number: supplier.tax_invoice_number,
      date: supplier.date
    })),

    annexure: {
      invoice_date: data.annexure.invoice_date || invoice.invoice_date,
      invoice_number: invoice.invoice_number,
      commissionerate: data.annexure.commissionerate,
      division: data.annexure.division,
      range: data.annexure.range,
      containerized: data.annexure.containerized,
      non_containerized: data.annexure.non_containerized,
      exam_date: data.annexure.exam_date,
      gross_weight: data.annexure.gross_weight,
      net_weight: data.annexure.net_weight,
      bin_no: data.annexure.bin_number,
      branch_no: data.annexure.branch_code,
      lut_date: data.annexure.lut_date,
      officer_designation1: data.annexure.officer_designation1,
      officer_designation2: data.annexure.officer_designation2,
      question9a: data.annexure.question9a,
      question9b: data.annexure.question9b,
      question9c: data.annexure.question9c,
      total_packages: data.annexure.total_packages,
      location_code: data.annexure.location_code,
      manufacturer_name: data.annexure.selected_manufacturer.name,
      manufacturer_address: data.annexure.selected_manufacturer.address,
      manufacturer_gstin_no: data.annexure.selected_manufacturer.gstin_number,
      manufacturer_permission: data.annexure.selected_manufacturer.permission
    },

    vgm: {
      invoice_number: invoice.invoice_number,
      shipper_name: data.vgm.shipper_name,
      ie_code: data.vgm.ie_code,
      authorized_name: data.vgm.authorized_name,
      authorized_contact: data.vgm.authorized_contact,
      container_number: data.vgm.container_number,
      container_size: data.vgm.container_size,
      permissible_weight: data.vgm.permissible_weight,
      weighbridge_registration: data.vgm.weighbridge_registration,
      verified_gross_mass: data.vgm.verified_gross_mass,
      unit_of_measurement: data.vgm.unit_of_measurement,
      dt_weighing: data.vgm.dt_weighing,
      weighing_slip_no: data.vgm.weighing_slip_no,
      type: data.vgm.type,
      // The generator reads the original column name.
      IMDG_class: data.vgm.imdg_class,
      forwarder_email: data.vgm.forwarder_email,
      containers: data.vgm.containers.map((container) => ({
        id: container.id,
        booking_no: container.booking_no,
        container_no: container.container_no,
        tare_weight: container.tare_weight,
        gross_weight: container.gross_weight,
        total_vgm: container.total_vgm
      }))
    }
  }
}
