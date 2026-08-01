import { randomUUID } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { AppError } from '@shared/result'
import {
  WizardData,
  type CreateInvoiceInput,
  type InvoiceSummary
} from '@shared/contracts'
import { getConnection, getDb } from '../db/client'
import {
  annexure,
  buyerSnapshot,
  containerLine,
  exporterSnapshot,
  invoice,
  invoiceContainer,
  invoiceProduct,
  invoiceSupplier,
  packageSnapshot,
  productLine,
  shippingSnapshot,
  supplierSnapshot,
  vgm,
  vgmContainer
} from '../db/schema'
import { markSubmitted } from './draft.service'
import { ensureSequenceAtLeast, sequenceOf } from './numbering.service'
import { log } from '../log'

/**
 * Writes a completed wizard form as an invoice.
 *
 * Replaces InvoiceController::createInvoice, ~250 lines of sequential inserts
 * with the ids of freshly created rows pushed into JSON arrays. Two differences
 * matter:
 *
 * 1. It is one transaction. The PHP version wrapped some of its inserts and not
 *    others, so a failure part way through left an invoice referencing rows
 *    that existed alongside rows that did not.
 * 2. Related rows are linked by foreign key, not by a JSON array in a BLOB
 *    column, so deleting an invoice is a single DELETE and the ~300 lines of
 *    hand-rolled cascade in deleteInvoice are gone.
 */

export const createInvoice = (input: CreateInvoiceInput): InvoiceSummary => {
  const db = getDb()
  const data = WizardData.parse(input.data)
  const { invoice: form } = data

  if (!form.invoice_number.trim()) {
    throw new AppError('VALIDATION', 'The invoice has no number')
  }

  const existing = db
    .select({ id: invoice.id })
    .from(invoice)
    .where(eq(invoice.invoiceNumber, form.invoice_number))
    .get()
  if (existing) {
    throw AppError.conflict(`Invoice ${form.invoice_number} already exists`)
  }

  const invoiceId = randomUUID()
  const now = new Date().toISOString()

  const write = getConnection().transaction(() => {
    const exporterId = randomUUID()
    db.insert(exporterSnapshot)
      .values({
        id: exporterId,
        companyName: form.exporter.company_name,
        companyAddress: form.exporter.company_address,
        contactNumber: form.exporter.contact_number,
        email: form.exporter.email,
        taxId: form.exporter.tax_id,
        ieCode: form.exporter.ie_code,
        panNumber: form.exporter.pan_number,
        gstinNumber: form.exporter.gstin_number,
        stateCode: form.exporter.state_code,
        authorizedName: form.exporter.authorized_name,
        authorizedDesignation: form.exporter.authorized_designation,
        // Keeps the link to the letterhead images without letting a later edit
        // of the master change what this invoice prints.
        masterId: form.exporter.id || null
      })
      .run()

    const buyerId = randomUUID()
    db.insert(buyerSnapshot)
      .values({
        id: buyerId,
        orderNumber: form.buyer.buyer_order_no,
        orderDate: form.buyer.buyer_order_date,
        poNumber: form.buyer.po_no,
        consignee: form.buyer.consignee,
        notifyParty: form.buyer.notify_party
      })
      .run()

    const shippingId = randomUUID()
    db.insert(shippingSnapshot)
      .values({
        id: shippingId,
        preCarriage: form.shipping.pre_carriage_by,
        placeOfReceipt: form.shipping.place_of_receipt,
        shippingNumber: '',
        portOfLoading: form.shipping.port_of_loading,
        portOfDischarge: form.shipping.port_of_discharge,
        finalDestination: form.shipping.final_destination,
        countryOfOrigin: form.shipping.country_of_origin,
        originDetails: form.shipping.origin_details,
        countryOfFinalDestination: form.shipping.country_of_final_destination,
        termsOfDelivery: form.shipping.terms_of_delivery,
        payment: form.shipping.payment,
        vesselFlightNo: form.shipping.vessel_flight_no,
        shippingMethod: form.shipping.shipping_method
      })
      .run()

    const packageId = randomUUID()
    db.insert(packageSnapshot)
      .values({
        id: packageId,
        numberOfPackage: form.package.no_of_packages,
        totalGrossWeight: form.package.total_gross_weight,
        totalNetWeight: form.package.total_net_weight,
        gstCircular: form.package.gst_circular,
        appRefNumber: form.package.arn_no,
        lutDate: form.package.lut_date,
        totalAmount: form.package.total_fob,
        totalSqm: form.package.total_sqm,
        taxableValue: form.package.taxable_value,
        gstAmount: form.package.gst_amount,
        amountInWords: form.package.amount_in_words
      })
      .run()

    const annexureId = randomUUID()
    db.insert(annexure)
      .values({
        id: annexureId,
        invoiceDate: data.annexure.invoice_date || form.invoice_date,
        invoiceNumber: form.invoice_number,
        commissionerate: data.annexure.commissionerate,
        division: data.annexure.division,
        range: data.annexure.range,
        containerized: data.annexure.containerized,
        nonContainerized: data.annexure.non_containerized,
        examDate: data.annexure.exam_date,
        grossWeight: data.annexure.gross_weight,
        netWeight: data.annexure.net_weight,
        binNo: data.annexure.bin_number,
        branchNo: data.annexure.branch_code,
        lutDate: data.annexure.lut_date,
        officerDesignation1: data.annexure.officer_designation1,
        officerDesignation2: data.annexure.officer_designation2,
        question9a: data.annexure.question9a,
        question9b: data.annexure.question9b,
        question9c: data.annexure.question9c,
        totalPackages: data.annexure.total_packages,
        locationCode: data.annexure.location_code,
        manufacturerName: data.annexure.selected_manufacturer.name,
        manufacturerAddress: data.annexure.selected_manufacturer.address,
        manufacturerGstinNo: data.annexure.selected_manufacturer.gstin_number,
        manufacturerPermission: data.annexure.selected_manufacturer.permission
      })
      .run()

    const vgmId = randomUUID()
    db.insert(vgm)
      .values({
        id: vgmId,
        invoiceNumber: form.invoice_number,
        shipperName: data.vgm.shipper_name,
        ieCode: data.vgm.ie_code,
        authorizedName: data.vgm.authorized_name,
        authorizedContact: data.vgm.authorized_contact,
        containerNumber: data.vgm.container_number,
        containerSize: data.vgm.container_size,
        permissibleWeight: data.vgm.permissible_weight,
        weighbridgeRegistration: data.vgm.weighbridge_registration,
        verifiedGrossMass: data.vgm.verified_gross_mass,
        unitOfMeasurement: data.vgm.unit_of_measurement,
        dtWeighing: data.vgm.dt_weighing,
        weighingSlipNo: data.vgm.weighing_slip_no,
        type: data.vgm.type,
        imdgClass: data.vgm.imdg_class,
        forwarderEmail: data.vgm.forwarder_email
      })
      .run()

    data.vgm.containers.forEach((container, position) => {
      db.insert(vgmContainer)
        .values({
          id: randomUUID(),
          vgmId,
          position,
          bookingNo: container.booking_no,
          containerNo: container.container_no,
          tareWeight: container.tare_weight,
          grossWeight: container.gross_weight,
          totalVgm: container.total_vgm
        })
        .run()
    })

    db.insert(invoice)
      .values({
        id: invoiceId,
        invoiceNumber: form.invoice_number,
        invoiceDate: form.invoice_date,
        integratedTax: form.integrated_tax,
        paymentTerm: form.payment_term,
        productType: form.product_type,
        currencyType: form.currency_type,
        currencyRate: form.currency_rate,
        marks: form.products.marks,
        nos: form.products.nos,
        freight: form.products.freight,
        insurance: form.products.insurance,
        totalPrice: form.products.total_price,
        totalPalletCount: form.products.total_pallet_count,
        exporterId,
        buyerId,
        shippingId,
        packageId,
        annexureId,
        vgmId,
        createdAt: now,
        updatedAt: now
      })
      .run()

    form.products.product_list.forEach((product, position) => {
      const id = randomUUID()
      db.insert(productLine)
        .values({
          id,
          categoryId: product.category_id || null,
          productName: product.product_name,
          size: product.size,
          unit: product.unit,
          quantity: product.quantity,
          sqm: product.sqm,
          totalSqm: product.total_sqm,
          price: product.price,
          totalPrice: product.total_price,
          netWeight: product.net_weight,
          grossWeight: product.gross_weight
        })
        .run()
      db.insert(invoiceProduct).values({ invoiceId, productLineId: id, position }).run()
    })

    form.products.containers.forEach((container, position) => {
      const id = randomUUID()
      db.insert(containerLine)
        .values({
          id,
          containerNumber: container.container_no,
          lineSealNumber: container.line_seal_no,
          rfidNumber: container.rfid_seal,
          designNo: container.design_no,
          quantityBox: container.quantity,
          netWeight: container.net_weight,
          grossWeight: container.gross_weight
        })
        .run()
      db.insert(invoiceContainer).values({ invoiceId, containerLineId: id, position }).run()
    })

    form.suppliers.forEach((supplier, position) => {
      const id = randomUUID()
      db.insert(supplierSnapshot)
        .values({
          id,
          supplierName: supplier.name,
          supplierAddress: supplier.address,
          gstinNumber: supplier.gstin_number,
          taxInvoiceNo: supplier.tax_invoice_number,
          date: supplier.date,
          masterId: supplier.id || null
        })
        .run()
      db.insert(invoiceSupplier)
        .values({ invoiceId, supplierSnapshotId: id, position })
        .run()
    })

    if (form.exporter.id && form.exporter.invoice_year) {
      ensureSequenceAtLeast(
        form.exporter.id,
        form.exporter.invoice_year,
        sequenceOf(form.invoice_number)
      )
    }
  })

  write()
  if (input.draftId) markSubmitted(input.draftId)

  log.info(`Created invoice ${form.invoice_number}`)
  return {
    id: invoiceId,
    invoiceNumber: form.invoice_number,
    invoiceDate: form.invoice_date,
    exporterName: form.exporter.company_name,
    consignee: form.buyer.consignee,
    currencyType: form.currency_type,
    totalPrice: form.products.total_price,
    productCount: form.products.product_list.length,
    createdAt: now
  }
}

export const listInvoices = (): InvoiceSummary[] => {
  const db = getDb()
  return db
    .select({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      exporterName: exporterSnapshot.companyName,
      consignee: buyerSnapshot.consignee,
      currencyType: invoice.currencyType,
      totalPrice: invoice.totalPrice,
      createdAt: invoice.createdAt
    })
    .from(invoice)
    .innerJoin(exporterSnapshot, eq(exporterSnapshot.id, invoice.exporterId))
    .innerJoin(buyerSnapshot, eq(buyerSnapshot.id, invoice.buyerId))
    .orderBy(desc(invoice.createdAt))
    .all()
    .map((row) => ({
      ...row,
      productCount: db
        .select()
        .from(invoiceProduct)
        .where(eq(invoiceProduct.invoiceId, row.id))
        .all().length
    }))
}

/**
 * Rebuilds the wizard shape from the normalised tables, so a saved invoice can
 * be reopened and — in phase 4 — fed to the document generator.
 */
export const getInvoice = (id: string): WizardData & { id: string } => {
  const db = getDb()
  const row = db.select().from(invoice).where(eq(invoice.id, id)).get()
  if (!row) throw AppError.notFound('Invoice')

  const exporter = db
    .select()
    .from(exporterSnapshot)
    .where(eq(exporterSnapshot.id, row.exporterId))
    .get()!
  const buyer = db.select().from(buyerSnapshot).where(eq(buyerSnapshot.id, row.buyerId)).get()!
  const shipping = db
    .select()
    .from(shippingSnapshot)
    .where(eq(shippingSnapshot.id, row.shippingId))
    .get()!
  const pkg = db
    .select()
    .from(packageSnapshot)
    .where(eq(packageSnapshot.id, row.packageId))
    .get()!
  const ann = db.select().from(annexure).where(eq(annexure.id, row.annexureId)).get()!
  const vgmRow = db.select().from(vgm).where(eq(vgm.id, row.vgmId)).get()!

  const products = db
    .select({ line: productLine, position: invoiceProduct.position })
    .from(invoiceProduct)
    .innerJoin(productLine, eq(productLine.id, invoiceProduct.productLineId))
    .where(eq(invoiceProduct.invoiceId, id))
    .orderBy(invoiceProduct.position)
    .all()

  const containers = db
    .select({ line: containerLine, position: invoiceContainer.position })
    .from(invoiceContainer)
    .innerJoin(containerLine, eq(containerLine.id, invoiceContainer.containerLineId))
    .where(eq(invoiceContainer.invoiceId, id))
    .orderBy(invoiceContainer.position)
    .all()

  const suppliers = db
    .select({ snapshot: supplierSnapshot })
    .from(invoiceSupplier)
    .innerJoin(supplierSnapshot, eq(supplierSnapshot.id, invoiceSupplier.supplierSnapshotId))
    .where(eq(invoiceSupplier.invoiceId, id))
    .orderBy(invoiceSupplier.position)
    .all()

  const vgmContainers = db
    .select()
    .from(vgmContainer)
    .where(eq(vgmContainer.vgmId, row.vgmId))
    .orderBy(vgmContainer.position)
    .all()

  const [leftValue = '', rightValue = ''] = row.marks.split(' X ')

  return {
    id: row.id,
    invoice: {
      invoice_number: row.invoiceNumber,
      invoice_date: row.invoiceDate,
      integrated_tax: row.integratedTax,
      payment_term: row.paymentTerm,
      product_type: row.productType,
      currency_type: row.currencyType,
      currency_rate: row.currencyRate,
      exporter: {
        id: exporter.masterId ?? '',
        company_name: exporter.companyName,
        company_address: exporter.companyAddress,
        contact_number: exporter.contactNumber,
        email: exporter.email,
        tax_id: exporter.taxId,
        ie_code: exporter.ieCode,
        pan_number: exporter.panNumber,
        gstin_number: exporter.gstinNumber,
        state_code: exporter.stateCode,
        authorized_name: exporter.authorizedName,
        authorized_designation: exporter.authorizedDesignation,
        company_prefix: row.invoiceNumber.split('/')[0] ?? '',
        invoice_year: row.invoiceNumber.split('/')[2] ?? ''
      },
      buyer: {
        buyer_order_no: buyer.orderNumber,
        buyer_order_date: buyer.orderDate,
        po_no: buyer.poNumber,
        consignee: buyer.consignee,
        notify_party: buyer.notifyParty
      },
      shipping: {
        pre_carriage_by: shipping.preCarriage,
        place_of_receipt: shipping.placeOfReceipt,
        vessel_flight_no: shipping.vesselFlightNo,
        port_of_loading: shipping.portOfLoading,
        port_of_discharge: shipping.portOfDischarge,
        final_destination: shipping.finalDestination,
        country_of_origin: shipping.countryOfOrigin,
        country_of_final_destination: shipping.countryOfFinalDestination,
        origin_details: shipping.originDetails,
        terms_of_delivery: shipping.termsOfDelivery,
        payment: shipping.payment,
        shipping_method: shipping.shippingMethod
      },
      products: {
        leftValue,
        rightValue,
        marks: row.marks,
        nos: row.nos,
        goods: row.productType,
        freight: row.freight,
        insurance: row.insurance,
        total_price: row.totalPrice,
        total_pallet_count: row.totalPalletCount,
        product_list: products.map(({ line }) => ({
          id: line.id,
          category_id: line.categoryId ?? '',
          category_name: '',
          hsn_code: '',
          product_name: line.productName,
          size: line.size,
          quantity: line.quantity,
          unit: line.unit,
          sqm: line.sqm,
          total_sqm: line.totalSqm,
          price: line.price,
          total_price: line.totalPrice,
          net_weight: line.netWeight,
          gross_weight: line.grossWeight
        })),
        containers: containers.map(({ line }) => ({
          id: line.id,
          container_no: line.containerNumber,
          line_seal_no: line.lineSealNumber,
          rfid_seal: line.rfidNumber,
          design_no: line.designNo,
          quantity: line.quantityBox,
          net_weight: line.netWeight,
          gross_weight: line.grossWeight
        }))
      },
      package: {
        no_of_packages: pkg.numberOfPackage,
        no_of_sqm: pkg.totalSqm,
        total_sqm: pkg.totalSqm,
        total_fob: pkg.totalAmount,
        taxable_value: pkg.taxableValue,
        gst_amount: pkg.gstAmount,
        amount_in_words: pkg.amountInWords,
        gst_circular: pkg.gstCircular,
        arn_no: pkg.appRefNumber,
        lut_date: pkg.lutDate,
        total_gross_weight: pkg.totalGrossWeight,
        total_net_weight: pkg.totalNetWeight
      },
      suppliers: suppliers.map(({ snapshot }) => ({
        id: snapshot.masterId ?? '',
        name: snapshot.supplierName,
        address: snapshot.supplierAddress,
        gstin_number: snapshot.gstinNumber,
        tax_invoice_number: snapshot.taxInvoiceNo,
        date: snapshot.date
      }))
    },
    annexure: {
      invoice_date: ann.invoiceDate,
      commissionerate: ann.commissionerate,
      division: ann.division,
      range: ann.range,
      containerized: ann.containerized,
      non_containerized: ann.nonContainerized,
      exam_date: ann.examDate,
      gross_weight: ann.grossWeight,
      net_weight: ann.netWeight,
      total_packages: ann.totalPackages,
      bin_number: ann.binNo,
      branch_code: ann.branchNo,
      location_code: ann.locationCode,
      lut_date: ann.lutDate,
      officer_designation1: ann.officerDesignation1,
      officer_designation2: ann.officerDesignation2,
      question9a: ann.question9a,
      question9b: ann.question9b,
      question9c: ann.question9c,
      selected_manufacturer: {
        name: ann.manufacturerName,
        address: ann.manufacturerAddress,
        gstin_number: ann.manufacturerGstinNo,
        permission: ann.manufacturerPermission
      }
    },
    vgm: {
      shipper_name: vgmRow.shipperName,
      ie_code: vgmRow.ieCode,
      authorized_name: vgmRow.authorizedName,
      authorized_contact: vgmRow.authorizedContact,
      container_number: vgmRow.containerNumber,
      container_size: vgmRow.containerSize,
      permissible_weight: vgmRow.permissibleWeight,
      weighbridge_registration: vgmRow.weighbridgeRegistration,
      verified_gross_mass: vgmRow.verifiedGrossMass,
      unit_of_measurement: vgmRow.unitOfMeasurement,
      dt_weighing: vgmRow.dtWeighing,
      weighing_slip_no: vgmRow.weighingSlipNo,
      type: vgmRow.type,
      imdg_class: vgmRow.imdgClass,
      forwarder_email: vgmRow.forwarderEmail,
      containers: vgmContainers.map((container) => ({
        id: container.id,
        booking_no: container.bookingNo,
        container_no: container.containerNo,
        tare_weight: container.tareWeight,
        gross_weight: container.grossWeight,
        total_vgm: container.totalVgm
      }))
    }
  }
}

/**
 * One DELETE. The cascade is in the schema, so this replaces the ~300 lines of
 * manual child cleanup in deleteInvoice — which also shelled out to
 * `exec("php delete_invoice_files.php ...")` to remove the generated documents.
 */
export const removeInvoice = (id: string): null => {
  const result = getDb().delete(invoice).where(eq(invoice.id, id)).run()
  if (result.changes === 0) throw AppError.notFound('Invoice')
  log.info(`Deleted invoice ${id}`)
  return null
}
