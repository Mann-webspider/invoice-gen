import { useState } from 'react'
import { useFormContext } from 'react-hook-form'

import type { SupplierRecord } from '@shared/contracts'
import { Step3Schema, type WizardData } from '@shared/contracts'
import { SupplierDialog } from '@/components/master/SupplierDialog'
import { WizardShell } from '@/components/wizard/WizardShell'
import { FieldGrid, SectionCard } from '@/components/wizard/SectionCard'
import {
  ChoiceField,
  DateField,
  DerivedField,
  NumberField,
  RecordField,
  TextField,
  TextareaField
} from '@/components/wizard/fields'
import { useMasterList } from '@/hooks/useMaster'

const YES_NO = ['YES', 'NO', 'N/A'] as const
const SEALING = [
  { value: 'SELF SEALING', label: 'Self sealing' },
  { value: 'CENTRAL EXCISE SEAL', label: 'Central excise seal' }
] as const

/** Step 3 — the customs annexure. */
export const AnnexureStep = (): JSX.Element => (
  <WizardShell
    title="Annexure"
    description="Step 3 of 4 — the customs declaration that travels with the shipment."
    schema={Step3Schema}
  >
    <div className="space-y-6">
      <JurisdictionCard />
      <ManufacturerCard />
      <DeclarationCard />
    </div>
  </WizardShell>
)

const JurisdictionCard = (): JSX.Element => (
  <SectionCard
    title="Customs office"
    description="Which office covers the factory. These rarely change between shipments."
  >
    <FieldGrid>
      <TextField name="annexure.commissionerate" label="Commissionerate" placeholder="e.g. RAJKOT" />
      <TextField name="annexure.division" label="Division" placeholder="e.g. MORBI II" />
      <TextField name="annexure.range" label="Range" placeholder="e.g. MORBI" />
      <TextField name="annexure.location_code" label="Location code" />
      <TextField name="annexure.bin_number" label="BIN number" />
      <TextField name="annexure.branch_code" label="Branch code" />
      <DateField name="annexure.exam_date" label="Examination date" />
      <DateField name="annexure.lut_date" label="LUT date" />
      <DateField name="annexure.invoice_date" label="Invoice date" />
    </FieldGrid>
  </SectionCard>
)

/**
 * The manufacturer is copied from a saved supplier, including its self-sealing
 * permission text, which is printed verbatim on the annexure.
 */
const ManufacturerCard = (): JSX.Element => {
  const { setValue, watch } = useFormContext<WizardData>()
  const { data: suppliers = [] } = useMasterList('supplier')
  const [adding, setAdding] = useState(false)
  const selected = watch('annexure.selected_manufacturer')

  /**
   * Takes the record rather than an id, because a supplier added from the dialog
   * is not in `suppliers` yet — the query invalidation has not refetched by the
   * time the dialog closes.
   */
  const apply = (supplier: SupplierRecord): void => {
    setValue(
      'annexure.selected_manufacturer',
      {
        name: supplier.name,
        address: supplier.address,
        gstin_number: supplier.gstinNumber,
        permission: supplier.permission
      },
      { shouldDirty: true }
    )
  }

  const choose = (id: string): void => {
    const supplier = suppliers.find((entry) => entry.id === id)
    if (supplier) apply(supplier)
  }

  return (
    <SectionCard
      title="Manufacturer"
      description="The factory that made these goods, as it should appear on the annexure."
    >
      <div className="space-y-5">
        <RecordField
          name="annexure.selected_manufacturer.name"
          label="Choose a supplier"
          options={suppliers.map((supplier) => ({
            value: supplier.id,
            label: supplier.name,
            hint: supplier.gstinNumber
          }))}
          // The form holds a copied record, not a reference, so the id the
          // picker needs has to be looked back up from the stored name.
          value={suppliers.find((supplier) => supplier.name === selected?.name)?.id ?? ''}
          placeholder="Choose a supplier"
          help="Picking one fills in the address and the self-sealing permission below."
          addNewLabel="Add a supplier that is not on the list"
          onAddNew={() => setAdding(true)}
          onChange={choose}
        />

        <FieldGrid columns={2}>
          <TextField name="annexure.selected_manufacturer.name" label="Name" />
          <TextField name="annexure.selected_manufacturer.gstin_number" label="GSTIN" />
          <TextareaField
            name="annexure.selected_manufacturer.address"
            label="Address"
            className="md:col-span-2"
          />
          <TextareaField
            name="annexure.selected_manufacturer.permission"
            label="Self-sealing permission"
            rows={4}
            className="md:col-span-2"
            help="Printed word for word. Leave empty if this shipment is not self sealed."
          />
        </FieldGrid>
      </div>

      <SupplierDialog open={adding} onOpenChange={setAdding} onSaved={apply} />
    </SectionCard>
  )
}

const DeclarationCard = (): JSX.Element => {
  const { watch } = useFormContext<WizardData>()
  const grossWeight = watch('annexure.gross_weight')
  const netWeight = watch('annexure.net_weight')

  return (
    <SectionCard
      title="Declaration"
      description="How the containers were sealed, and the answers printed against each numbered question."
    >
      <FieldGrid>
        <ChoiceField
          name="annexure.containerized"
          label="Containerised cargo sealed by"
          options={SEALING}
        />
        <ChoiceField
          name="annexure.non_containerized"
          label="Non-containerised cargo sealed by"
          options={SEALING}
        />
        <NumberField name="annexure.total_packages" label="Total packages" />

        <DerivedField
          label="Gross weight (kg)"
          value={grossWeight ?? ''}
          help="Added up from the packing list."
        />
        <DerivedField
          label="Net weight (kg)"
          value={netWeight ?? ''}
          help="Added up from the packing list."
        />
        <div className="hidden lg:block" />

        {/*
          Kept as the numbers printed on the form. Spelling out what each one
          asks would mean guessing at the wording of a government document, and a
          confident wrong label is worse than the number the client can match
          against the paper in front of them.
        */}
        <ChoiceField
          name="annexure.question9a"
          label="Question 9(a)"
          options={YES_NO}
          help="Answer as it should print on the annexure."
        />
        <ChoiceField name="annexure.question9b" label="Question 9(b)" options={YES_NO} />
        <ChoiceField name="annexure.question9c" label="Question 9(c)" options={YES_NO} />

        <TextField
          name="annexure.officer_designation1"
          label="Signing officer 1"
          help="Job title printed under the first signature."
        />
        <TextField name="annexure.officer_designation2" label="Signing officer 2" />
      </FieldGrid>
    </SectionCard>
  )
}
