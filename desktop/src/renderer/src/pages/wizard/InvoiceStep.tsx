import { useEffect, useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { format } from 'date-fns'
import { AlertTriangle, Building2, Plus, RefreshCw, Trash } from 'lucide-react'

import type { ExporterRecord, SupplierRecord } from '@shared/contracts'
import { Step1Schema, type WizardData } from '@shared/contracts'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ExporterDialog } from '@/components/master/ExporterDialog'
import { FieldsDialog } from '@/components/master/FieldsDialog'
import { SupplierDialog } from '@/components/master/SupplierDialog'
import { WizardShell } from '@/components/wizard/WizardShell'
import { FieldGrid, SectionCard } from '@/components/wizard/SectionCard'
import {
  ChoiceField,
  DateField,
  DerivedField,
  ListField,
  NumberField,
  RecordField,
  TextField,
  TextareaField
} from '@/components/wizard/fields'
import { ProductTable } from './ProductTable'
import { useMasterList, useMasterMutations } from '@/hooks/useMaster'
import { ipc } from '@/lib/ipc'
import { applyIpcError, toastSuccess } from '@/lib/form'

const PAYMENT_TERMS = ['FOB', 'CIF', 'CNF', 'CIF -> FOB'] as const
const TAX_OPTIONS = [
  { value: 'WITH', label: 'With tax' },
  { value: 'WITHOUT', label: 'Without tax' }
] as const
const PRODUCT_TYPES = ['Tiles', 'Sanitary', 'Mix'] as const
const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'INR'] as const
const SHIPPING_METHODS = [
  { value: 'SHIPPING - THROUGH SEA', label: 'By sea' },
  { value: 'SHIPPING - THROUGH AIR', label: 'By air' }
] as const

export const InvoiceStep = (): JSX.Element => (
  <WizardShell
    title="New invoice"
    description="Step 1 of 4 — who is selling, who is buying, and what is being shipped."
    schema={Step1Schema}
  >
    <div className="space-y-6">
      <ExporterCard />
      <InvoiceMetaCard />
      <BuyerCard />
      <ShippingCard />
      <ProductsCard />
      <MarksCard />
      <TotalsCard />
      <SuppliersCard />
    </div>
  </WizardShell>
)

/* ------------------------------------------------------------------ */

const ExporterCard = (): JSX.Element => {
  const { watch, setValue } = useFormContext<WizardData>()
  const { data: exporters = [] } = useMasterList('exporter')
  const [adding, setAdding] = useState(false)
  const [allocating, setAllocating] = useState(false)
  /**
   * The company just created in the dialog. Adding invalidates the query, but
   * the refetch has not landed by the time the dialog closes, so looking the new
   * record up in `exporters` finds nothing — which is how a company added from
   * inside the wizard used to save correctly and then appear unselected, with no
   * invoice number reserved.
   */
  const [justAdded, setJustAdded] = useState<ExporterRecord | null>(null)

  const selectedId = watch('invoice.exporter.id')
  const selected =
    exporters.find((exporter) => exporter.id === selectedId) ??
    (justAdded?.id === selectedId ? justAdded : undefined)
  const invoiceNumber = watch('invoice.invoice_number')

  /** Copies the master record into the form, which is what gets snapshotted. */
  const apply = (exporter: ExporterRecord): void => {
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

  const choose = (id: string): void => {
    const exporter = exporters.find((entry) => entry.id === id)
    if (exporter) apply(exporter)
  }

  const allocate = async (): Promise<void> => {
    const exporter = selected
    if (!exporter) return
    setAllocating(true)
    try {
      const result = await ipc.invoice.allocateNumber({
        exporterId: exporter.id,
        fiscalYear: exporter.invoiceYear
      })
      setValue('invoice.invoice_number', result.invoiceNumber, { shouldDirty: true })
      toastSuccess(`Invoice number ${result.invoiceNumber} reserved`)
    } catch (error) {
      applyIpcError(error)
    } finally {
      setAllocating(false)
    }
  }

  /**
   * Reserves the number as soon as a company is chosen, but only when the field
   * is empty. Allocating consumes a number permanently, so it must never happen
   * behind the client's back on a form that already has one — hence the mismatch
   * notice below rather than a silent second allocation.
   */
  useEffect(() => {
    if (selected && !invoiceNumber && !allocating) void allocate()
    // Runs on the transition into "chosen with no number"; `allocate` is
    // recreated every render and would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, invoiceNumber])

  const mismatch =
    selected &&
    invoiceNumber &&
    !(
      invoiceNumber.startsWith(`${selected.companyPrefix}/`) &&
      invoiceNumber.endsWith(`/${selected.invoiceYear}`)
    )

  return (
    <SectionCard
      title="Your company"
      description="The exporter these documents are issued by."
    >
      <div className="space-y-5">
        <RecordField
          name="invoice.exporter.id"
          label="Company"
          options={exporters.map((exporter) => ({
            value: exporter.id,
            label: exporter.companyName,
            hint: `IE ${exporter.ieCode}`
          }))}
          placeholder="Choose your company"
          addNewLabel="Add a company that is not on the list"
          onAddNew={() => setAdding(true)}
          onChange={choose}
        />

        {selected && (
          <div className="rounded-lg border bg-gray-50 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-gray-900">
              <Building2 className="h-4 w-4 text-gray-400" />
              {selected.companyName}
            </p>
            <p className="mt-1 whitespace-pre-line text-gray-600">{selected.companyAddress}</p>
            <p className="mt-2 text-xs text-gray-500">
              IE {selected.ieCode} · GSTIN {selected.gstinNumber} · PAN {selected.panNumber}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <TextField
            name="invoice.invoice_number"
            label="Invoice number"
            help="Reserved automatically when you choose a company. Change it only if you have to."
            className="min-w-64 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled={!selected || allocating}
            onClick={() => void allocate()}
          >
            <RefreshCw className={allocating ? 'animate-spin' : undefined} />
            Get the next number
          </Button>
        </div>

        {mismatch && (
          <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This invoice number was reserved for a different company or year. Press{' '}
              <strong>Get the next number</strong> to reserve one for {selected?.companyName}.
            </span>
          </p>
        )}
      </div>

      <ExporterDialog
        open={adding}
        onOpenChange={setAdding}
        onSaved={(record) => {
          setJustAdded(record)
          apply(record)
        }}
      />
    </SectionCard>
  )
}

const InvoiceMetaCard = (): JSX.Element => {
  const { watch, setValue } = useFormContext<WizardData>()
  const invoiceDate = watch('invoice.invoice_date')

  // Almost every invoice is raised on the day it is typed; offering today saves
  // the most common entry and still allows any other date.
  useEffect(() => {
    if (!invoiceDate) {
      setValue('invoice.invoice_date', format(new Date(), 'dd/MM/yyyy'), { shouldDirty: false })
    }
  }, [invoiceDate, setValue])

  return (
    <SectionCard title="Invoice details" description="Terms this shipment is sold on.">
      <FieldGrid>
        <DateField name="invoice.invoice_date" label="Invoice date" />
        <ChoiceField
          name="invoice.payment_term"
          label="Payment term"
          options={PAYMENT_TERMS}
          help="How the price is quoted."
        />
        <ChoiceField
          name="invoice.integrated_tax"
          label="Integrated tax (IGST)"
          options={TAX_OPTIONS}
          help="Whether this export is made with payment of tax."
        />
        <ChoiceField name="invoice.product_type" label="What is being shipped" options={PRODUCT_TYPES} />
        <ChoiceField
          name="invoice.currency_type"
          label="Currency"
          options={CURRENCIES}
          help="The currency the buyer pays in."
        />
        <NumberField
          name="invoice.currency_rate"
          label="Exchange rate"
          placeholder="84.60"
          help="Rupees to one unit of the currency above."
        />
      </FieldGrid>
    </SectionCard>
  )
}

const BuyerCard = (): JSX.Element => (
  <SectionCard title="Buyer" description="Who the goods are being sold and shipped to.">
    <FieldGrid columns={2}>
      <TextField name="invoice.buyer.buyer_order_no" label="Buyer's order number" />
      <DateField name="invoice.buyer.buyer_order_date" label="Order date" />
      <TextField
        name="invoice.buyer.po_no"
        label="Purchase order number"
        help="Leave empty if the buyer did not give one."
      />
      <div className="hidden md:block" />
      <TextareaField
        name="invoice.buyer.consignee"
        label="Consignee"
        rows={4}
        help="Name and full address of the buyer, exactly as it should print."
      />
      <TextareaField
        name="invoice.buyer.notify_party"
        label="Notify party"
        rows={4}
        help="Who the shipping line contacts on arrival. Often the same as the consignee."
      />
    </FieldGrid>
  </SectionCard>
)

const ShippingCard = (): JSX.Element => {
  const { watch, setValue } = useFormContext<WizardData>()
  const { data: destinations = [] } = useMasterList('countryOption')
  const destinationMutations = useMasterMutations('countryOption', {
    created: 'Destination added',
    updated: 'Destination updated',
    removed: 'Destination removed'
  })
  const [addingDestination, setAddingDestination] = useState(false)

  const port = watch('invoice.shipping.port_of_discharge')

  // Port of discharge and final destination are kept as pairs, so choosing one
  // fills the other.
  useEffect(() => {
    const match = destinations.find((entry) => entry.portOfDischarge === port)
    if (match) {
      setValue('invoice.shipping.final_destination', match.finalDestination, {
        shouldDirty: false
      })
    }
  }, [port, destinations, setValue])

  return (
    <SectionCard title="Shipment" description="How and where the goods travel.">
      <FieldGrid>
        <TextField
          name="invoice.shipping.pre_carriage_by"
          label="Pre-carriage by"
          help="How the goods reach the port. Usually ROAD."
        />
        <ListField
          name="invoice.shipping.place_of_receipt"
          label="Place of receipt"
          category="place_of_receipt"
          help="Where the shipping line takes charge of the goods."
        />
        <TextField name="invoice.shipping.vessel_flight_no" label="Vessel or flight number" />
        <ListField
          name="invoice.shipping.port_of_loading"
          label="Port of loading"
          category="port_of_loading"
        />

        <RecordField
          name="invoice.shipping.port_of_discharge"
          label="Port of discharge"
          options={destinations.map((entry) => ({
            value: entry.portOfDischarge,
            label: entry.portOfDischarge,
            hint: entry.finalDestination
          }))}
          placeholder="Choose a port"
          help="Choosing a port fills in the destination country."
          addNewLabel="Add a port that is not on the list"
          onAddNew={() => setAddingDestination(true)}
          onChange={(value) =>
            setValue('invoice.shipping.port_of_discharge', value, { shouldDirty: true })
          }
        />

        <TextField name="invoice.shipping.final_destination" label="Final destination" />
        <ListField
          name="invoice.shipping.country_of_origin"
          label="Country of origin"
          category="country_of_origin"
        />
        <ListField
          name="invoice.shipping.country_of_final_destination"
          label="Country of final destination"
          category="country_of_final_destination"
        />
        <TextField name="invoice.shipping.origin_details" label="Origin details" />
        <TextField
          name="invoice.shipping.terms_of_delivery"
          label="Terms of delivery"
          help="Printed on the invoice as written."
        />
        <TextField name="invoice.shipping.payment" label="Payment terms" />
        <ChoiceField
          name="invoice.shipping.shipping_method"
          label="Shipping by"
          options={SHIPPING_METHODS}
        />
      </FieldGrid>

      <FieldsDialog
        open={addingDestination}
        onOpenChange={setAddingDestination}
        title="Add a destination"
        description="Ports are stored with the country they serve, so choosing one fills in the other."
        fields={[
          { key: 'portOfDischarge', label: 'Port of discharge', placeholder: 'e.g. NEW YORK' },
          { key: 'finalDestination', label: 'Final destination', placeholder: 'e.g. USA' }
        ]}
        submitLabel="Add destination"
        onSave={async (values) => {
          await destinationMutations.create({
            portOfDischarge: values.portOfDischarge,
            finalDestination: values.finalDestination,
            isActive: true
          })
          setValue('invoice.shipping.port_of_discharge', values.portOfDischarge, {
            shouldDirty: true
          })
        }}
      />
    </SectionCard>
  )
}

const ProductsCard = (): JSX.Element => (
  <SectionCard
    title="Goods"
    description="Every line printed on the invoice. Totals are worked out for you."
  >
    <ProductTable />
  </SectionCard>
)

/** Marks is stored derived, so the two halves cannot drift apart. */
const MarksCard = (): JSX.Element => {
  const { watch, setValue } = useFormContext<WizardData>()
  const left = watch('invoice.products.leftValue')
  const right = watch('invoice.products.rightValue')
  const marks = watch('invoice.products.marks')

  useEffect(() => {
    const combined = left && right ? `${left} X ${right}` : ''
    if (marks !== combined) {
      setValue('invoice.products.marks', combined, { shouldDirty: false })
    }
  }, [left, right, marks, setValue])

  return (
    <SectionCard
      title="Marks and numbers"
      description="How the shipment is described on the packing documents."
    >
      <FieldGrid columns={4}>
        <NumberField
          name="invoice.products.leftValue"
          label="How many containers"
          placeholder="10"
        />
        <TextField name="invoice.products.rightValue" label="Container size" placeholder="20'" />
        <DerivedField
          label="Marks"
          value={marks ?? ''}
          help="Built from the two boxes on the left."
        />
        <ListField
          name="invoice.products.nos"
          label="Load type"
          category="marks_nos"
          help="Full or part container load, e.g. FCL."
        />
        <TextField
          name="invoice.products.goods"
          label="Description of goods"
          className="md:col-span-2"
        />
        <NumberField name="invoice.products.freight" label="Freight" help="Added to the total." />
        <NumberField
          name="invoice.products.insurance"
          label="Insurance"
          help="Added to the total."
        />
      </FieldGrid>
    </SectionCard>
  )
}

const TotalsCard = (): JSX.Element => {
  const { data: arns = [] } = useMasterList('arn')
  const { setValue, watch } = useFormContext<WizardData>()
  const arn = arns[0]

  const totalSqm = watch('invoice.package.total_sqm')
  const totalFob = watch('invoice.package.total_fob')
  const arnNo = watch('invoice.package.arn_no')
  const gstCircular = watch('invoice.package.gst_circular')

  // The ARN and GST circular are a single admin-managed record; fill them once
  // rather than asking the client to retype boilerplate on every invoice.
  useEffect(() => {
    if (!arn) return
    if (!arnNo) setValue('invoice.package.arn_no', arn.arn, { shouldDirty: false })
    if (!gstCircular) {
      setValue('invoice.package.gst_circular', arn.gstCircular, { shouldDirty: false })
    }
  }, [arn, arnNo, gstCircular, setValue])

  return (
    <SectionCard
      title="Amounts and declarations"
      description="Two of these are added up from the goods above; the rest print on the invoice as written."
    >
      <FieldGrid>
        <NumberField name="invoice.package.no_of_packages" label="Number of packages" />
        <DerivedField label="Total SQM" value={totalSqm ?? ''} help="From the goods above." />
        <DerivedField label="Total FOB" value={totalFob ?? ''} help="Goods plus freight and insurance." />
        <NumberField name="invoice.package.taxable_value" label="Taxable value" />
        <NumberField name="invoice.package.gst_amount" label="GST amount" />
        <DateField name="invoice.package.lut_date" label="LUT date" />
        <TextField
          name="invoice.package.arn_no"
          label="ARN"
          help="Filled in from the Tax declaration settings."
        />
        <TextField
          name="invoice.package.amount_in_words"
          label="Amount in words"
          className="md:col-span-1 lg:col-span-2"
          help="How the total should be spelled out on the invoice."
        />
        <TextareaField
          name="invoice.package.gst_circular"
          label="GST circular"
          className="md:col-span-2 lg:col-span-3"
        />
      </FieldGrid>
    </SectionCard>
  )
}

const SuppliersCard = (): JSX.Element => {
  const { control, setValue } = useFormContext<WizardData>()
  const { fields, append, remove } = useFieldArray({ control, name: 'invoice.suppliers' })
  const { data: suppliers = [] } = useMasterList('supplier')
  const [addingFor, setAddingFor] = useState<number | null>(null)

  /** Takes the record, not an id: see the note in ExporterCard about refetches. */
  const apply = (index: number, supplier: SupplierRecord): void => {
    setValue(`invoice.suppliers.${index}.id`, supplier.id, { shouldDirty: true })
    setValue(`invoice.suppliers.${index}.name`, supplier.name, { shouldDirty: true })
    setValue(`invoice.suppliers.${index}.address`, supplier.address, { shouldDirty: true })
    setValue(`invoice.suppliers.${index}.gstin_number`, supplier.gstinNumber, {
      shouldDirty: true
    })
  }

  const choose = (index: number, id: string): void => {
    const supplier = suppliers.find((entry) => entry.id === id)
    if (supplier) apply(index, supplier)
  }

  const addRow = (): void =>
    append({
      id: '',
      name: '',
      address: '',
      gstin_number: '',
      tax_invoice_number: '',
      date: ''
    })

  return (
    <SectionCard
      title="Suppliers"
      description="The factories these goods came from. Optional, but printed on the invoice when present."
      action={
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus />
          Add supplier
        </Button>
      }
    >
      <div className="space-y-4">
        {fields.length === 0 && (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
            No suppliers on this invoice yet.
          </p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Supplier {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-red-50 hover:text-red-700"
                aria-label={`Remove supplier ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash />
                Remove
              </Button>
            </div>

            <RecordField
              name={`invoice.suppliers.${index}.id`}
              label="Choose a supplier"
              options={suppliers.map((supplier) => ({
                value: supplier.id,
                label: supplier.name,
                hint: supplier.gstinNumber
              }))}
              placeholder="Choose a supplier"
              addNewLabel="Add a supplier that is not on the list"
              onAddNew={() => setAddingFor(index)}
              onChange={(value) => choose(index, value)}
            />

            <FieldGrid columns={2}>
              <TextField name={`invoice.suppliers.${index}.name`} label="Name" />
              <TextField name={`invoice.suppliers.${index}.gstin_number`} label="GSTIN" />
              <TextField
                name={`invoice.suppliers.${index}.tax_invoice_number`}
                label="Their invoice number"
                help="The number on the bill this supplier gave you."
              />
              <DateField name={`invoice.suppliers.${index}.date`} label="Their invoice date" />
              <TextareaField
                name={`invoice.suppliers.${index}.address`}
                label="Address"
                className="md:col-span-2"
              />
            </FieldGrid>
          </div>
        ))}
      </div>

      <SupplierDialog
        open={addingFor !== null}
        onOpenChange={(open) => !open && setAddingFor(null)}
        onSaved={(record) => {
          if (addingFor !== null) apply(addingFor, record)
          setAddingFor(null)
        }}
      />
    </SectionCard>
  )
}
