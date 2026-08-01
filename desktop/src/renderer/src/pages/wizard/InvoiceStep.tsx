import { useEffect } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, RefreshCw, Trash } from 'lucide-react'

import { Step1Schema, type WizardData } from '@shared/contracts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { WizardShell } from '@/components/wizard/WizardShell'
import { ChoiceField, DropdownField, TextField, TextareaField } from '@/components/wizard/fields'
import { ProductTable } from './ProductTable'
import { useMasterList } from '@/hooks/useMaster'
import { ipc } from '@/lib/ipc'
import { applyIpcError, toastSuccess } from '@/lib/form'

const PAYMENT_TERMS = ['FOB', 'CIF', 'CNF', 'CIF -> FOB'] as const
const TAX_OPTIONS = ['WITH', 'WITHOUT'] as const
const PRODUCT_TYPES = ['Tiles', 'Sanitary', 'Mix'] as const
const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'INR'] as const
const SHIPPING_METHODS = ['SHIPPING - THROUGH SEA', 'SHIPPING - THROUGH AIR'] as const

export const InvoiceStep = (): JSX.Element => (
  <WizardShell
    title="Invoice Generator"
    description="Step 1 of 4 — exporter, buyer, shipping and products"
    schema={Step1Schema}
  >
    <div className="space-y-6">
      <ExporterCard />
      <InvoiceMetaCard />
      <BuyerCard />
      <ShippingCard />
      <MarksCard />
      <Card>
        <CardContent className="p-6">
          <ProductTable />
        </CardContent>
      </Card>
      <PackageCard />
      <SuppliersCard />
    </div>
  </WizardShell>
)

/* ------------------------------------------------------------------ */

const ExporterCard = (): JSX.Element => {
  const { watch, setValue } = useFormContext<WizardData>()
  const { data: exporters = [] } = useMasterList('exporter')
  const selectedId = watch('invoice.exporter.id')
  const selected = exporters.find((exporter) => exporter.id === selectedId)

  /** Copies the master record into the form, which is what gets snapshotted. */
  const choose = (id: string): void => {
    const exporter = exporters.find((entry) => entry.id === id)
    if (!exporter) return
    setValue('invoice.exporter', {
      id: exporter.id,
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
      company_prefix: exporter.companyPrefix,
      invoice_year: exporter.invoiceYear
    })
    // The VGM sheet repeats the exporter's identity; prefill rather than making
    // the client retype it on step 4.
    setValue('vgm.shipper_name', exporter.companyName)
    setValue('vgm.ie_code', exporter.ieCode)
    setValue('vgm.authorized_name', exporter.authorizedName)
    setValue('vgm.authorized_contact', exporter.contactNumber)
  }

  const allocate = async (): Promise<void> => {
    if (!selected) return
    try {
      const result = await ipc.invoice.allocateNumber({
        exporterId: selected.id,
        fiscalYear: selected.invoiceYear
      })
      setValue('invoice.invoice_number', result.invoiceNumber, { shouldDirty: true })
      toastSuccess(`Reserved ${result.invoiceNumber}`)
    } catch (error) {
      applyIpcError(error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exporter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select exporter</Label>
          <Select value={selectedId} onValueChange={choose}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an exporter" />
            </SelectTrigger>
            <SelectContent>
              {exporters.map((exporter) => (
                <SelectItem key={exporter.id} value={exporter.id}>
                  {exporter.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected && (
          <div className="rounded-md bg-gray-50 p-4 text-sm space-y-1">
            <p className="font-medium">{selected.companyName}</p>
            <p className="text-gray-600 whitespace-pre-line">{selected.companyAddress}</p>
            <p className="text-gray-600">
              IE {selected.ieCode} · GSTIN {selected.gstinNumber} · PAN {selected.panNumber}
            </p>
          </div>
        )}

        <div className="flex items-end gap-3">
          <TextField
            name="invoice.invoice_number"
            label="Invoice number"
            placeholder="Reserve a number"
            className="flex-1"
          />
          <Button type="button" variant="outline" disabled={!selected} onClick={() => void allocate()}>
            <RefreshCw className="h-4 w-4" />
            Reserve next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const InvoiceMetaCard = (): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Invoice details</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TextField name="invoice.invoice_date" label="Invoice date" placeholder="DD/MM/YYYY" />
      <ChoiceField name="invoice.payment_term" label="Payment term" options={PAYMENT_TERMS} />
      <ChoiceField name="invoice.integrated_tax" label="Integrated tax" options={TAX_OPTIONS} />
      <ChoiceField name="invoice.product_type" label="Product type" options={PRODUCT_TYPES} />
      <ChoiceField name="invoice.currency_type" label="Currency" options={CURRENCIES} />
      <TextField name="invoice.currency_rate" label="Currency rate" placeholder="e.g. 84.60" />
    </CardContent>
  </Card>
)

const BuyerCard = (): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Buyer</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextField name="invoice.buyer.buyer_order_no" label="Buyer order number" />
      <TextField name="invoice.buyer.buyer_order_date" label="Order date" placeholder="DD/MM/YYYY" />
      <TextField name="invoice.buyer.po_no" label="PO number" />
      <div />
      <TextareaField name="invoice.buyer.consignee" label="Consignee" />
      <TextareaField name="invoice.buyer.notify_party" label="Notify party" />
    </CardContent>
  </Card>
)

const ShippingCard = (): JSX.Element => {
  const { watch, setValue } = useFormContext<WizardData>()
  const { data: destinations = [] } = useMasterList('countryOption')
  const port = watch('invoice.shipping.port_of_discharge')

  // Port of discharge and final destination are managed as pairs in the Admin
  // Panel, so choosing one fills the other.
  useEffect(() => {
    const match = destinations.find((entry) => entry.portOfDischarge === port)
    if (match) {
      setValue('invoice.shipping.final_destination', match.finalDestination, {
        shouldDirty: false
      })
    }
  }, [port, destinations, setValue])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Shipping</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextField name="invoice.shipping.pre_carriage_by" label="Pre-carriage by" />
        <DropdownField
          name="invoice.shipping.place_of_receipt"
          label="Place of receipt"
          category="place_of_receipt"
        />
        <TextField name="invoice.shipping.vessel_flight_no" label="Vessel / flight no." />
        <DropdownField
          name="invoice.shipping.port_of_loading"
          label="Port of loading"
          category="port_of_loading"
        />

        <div className="space-y-2">
          <Label>Port of discharge</Label>
          <Select
            value={port}
            onValueChange={(value) =>
              setValue('invoice.shipping.port_of_discharge', value, { shouldDirty: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {destinations.map((entry) => (
                <SelectItem key={entry.id} value={entry.portOfDischarge}>
                  {entry.portOfDischarge} → {entry.finalDestination}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TextField name="invoice.shipping.final_destination" label="Final destination" />
        <DropdownField
          name="invoice.shipping.country_of_origin"
          label="Country of origin"
          category="country_of_origin"
        />
        <DropdownField
          name="invoice.shipping.country_of_final_destination"
          label="Country of final destination"
          category="country_of_final_destination"
        />
        <TextField name="invoice.shipping.origin_details" label="Origin details" />
        <TextField name="invoice.shipping.terms_of_delivery" label="Terms of delivery" />
        <TextField name="invoice.shipping.payment" label="Payment" />
        <ChoiceField
          name="invoice.shipping.shipping_method"
          label="Shipping method"
          options={SHIPPING_METHODS}
        />
      </CardContent>
    </Card>
  )
}

/** Marks is stored derived, so the two halves cannot drift apart. */
const MarksCard = (): JSX.Element => {
  const { watch, setValue } = useFormContext<WizardData>()
  const left = watch('invoice.products.leftValue')
  const right = watch('invoice.products.rightValue')

  useEffect(() => {
    const marks = left && right ? `${left} X ${right}` : ''
    if (watch('invoice.products.marks') !== marks) {
      setValue('invoice.products.marks', marks, { shouldDirty: false })
    }
  }, [left, right, setValue, watch])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Marks &amp; numbers</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TextField name="invoice.products.leftValue" label="Containers" placeholder="e.g. 10" />
        <TextField name="invoice.products.rightValue" label="Size" placeholder="e.g. 20'" />
        <div className="space-y-2">
          <Label>Marks</Label>
          <Input value={watch('invoice.products.marks') ?? ''} readOnly className="bg-gray-50" />
        </div>
        <DropdownField name="invoice.products.nos" label="Nos" category="marks_nos" />
        <TextField name="invoice.products.goods" label="Goods" className="md:col-span-2" />
        <TextField name="invoice.products.freight" label="Freight" />
        <TextField name="invoice.products.insurance" label="Insurance" />
      </CardContent>
    </Card>
  )
}

const PackageCard = (): JSX.Element => {
  const { data: arns = [] } = useMasterList('arn')
  const { setValue, watch } = useFormContext<WizardData>()
  const arn = arns[0]

  // The ARN and GST circular are a single admin-managed record; fill them once
  // rather than asking the client to retype boilerplate on every invoice.
  useEffect(() => {
    if (!arn) return
    if (!watch('invoice.package.arn_no')) {
      setValue('invoice.package.arn_no', arn.arn, { shouldDirty: false })
    }
    if (!watch('invoice.package.gst_circular')) {
      setValue('invoice.package.gst_circular', arn.gstCircular, { shouldDirty: false })
    }
  }, [arn, setValue, watch])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Package &amp; totals</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextField name="invoice.package.no_of_packages" label="Number of packages" />
        <TextField name="invoice.package.total_sqm" label="Total SQM" />
        <TextField name="invoice.package.total_fob" label="Total FOB" />
        <TextField name="invoice.package.taxable_value" label="Taxable value" />
        <TextField name="invoice.package.gst_amount" label="GST amount" />
        <TextField name="invoice.package.lut_date" label="LUT date" placeholder="DD/MM/YYYY" />
        <TextField name="invoice.package.arn_no" label="ARN" />
        <TextField
          name="invoice.package.amount_in_words"
          label="Amount in words"
          className="md:col-span-2"
        />
        <TextareaField
          name="invoice.package.gst_circular"
          label="GST circular"
          className="md:col-span-3"
        />
      </CardContent>
    </Card>
  )
}

const SuppliersCard = (): JSX.Element => {
  const { control, setValue } = useFormContext<WizardData>()
  const { fields, append, remove } = useFieldArray({ control, name: 'invoice.suppliers' })
  const { data: suppliers = [] } = useMasterList('supplier')

  const choose = (index: number, id: string): void => {
    const supplier = suppliers.find((entry) => entry.id === id)
    if (!supplier) return
    setValue(`invoice.suppliers.${index}.id`, supplier.id, { shouldDirty: true })
    setValue(`invoice.suppliers.${index}.name`, supplier.name, { shouldDirty: true })
    setValue(`invoice.suppliers.${index}.address`, supplier.address, { shouldDirty: true })
    setValue(`invoice.suppliers.${index}.gstin_number`, supplier.gstinNumber, {
      shouldDirty: true
    })
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Suppliers</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              id: '',
              name: '',
              address: '',
              gstin_number: '',
              tax_invoice_number: '',
              date: ''
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add supplier
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-gray-500">No suppliers added.</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="rounded-md border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Supplier {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700"
                aria-label={`Remove supplier ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Choose from saved suppliers</Label>
              <Select onValueChange={(value) => choose(index, value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField name={`invoice.suppliers.${index}.name`} label="Name" />
              <TextField name={`invoice.suppliers.${index}.gstin_number`} label="GSTIN" />
              <TextField
                name={`invoice.suppliers.${index}.tax_invoice_number`}
                label="Tax invoice number"
              />
              <TextField
                name={`invoice.suppliers.${index}.date`}
                label="Date"
                placeholder="DD/MM/YYYY"
              />
              <TextareaField
                name={`invoice.suppliers.${index}.address`}
                label="Address"
                className="md:col-span-2"
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
