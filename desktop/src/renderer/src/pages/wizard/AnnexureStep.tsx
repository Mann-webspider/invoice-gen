import { useFormContext } from 'react-hook-form'

import { Step3Schema, type WizardData } from '@shared/contracts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { WizardShell } from '@/components/wizard/WizardShell'
import { ChoiceField, TextField, TextareaField } from '@/components/wizard/fields'
import { useMasterList } from '@/hooks/useMaster'

const YES_NO = ['YES', 'NO', 'N/A'] as const
const SEALING = ['SELF SEALING', 'CENTRAL EXCISE SEAL'] as const

/** Step 3 — the customs annexure. */
export const AnnexureStep = (): JSX.Element => (
  <WizardShell
    title="Annexure"
    description="Step 3 of 4 — customs declaration"
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
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Jurisdiction</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TextField name="annexure.commissionerate" label="Commissionerate" placeholder="e.g. RAJKOT" />
      <TextField name="annexure.division" label="Division" placeholder="e.g. MORBI II" />
      <TextField name="annexure.range" label="Range" placeholder="e.g. MORBI" />
      <TextField name="annexure.location_code" label="Location code" />
      <TextField name="annexure.bin_number" label="BIN number" />
      <TextField name="annexure.branch_code" label="Branch code" />
      <TextField name="annexure.exam_date" label="Examination date" placeholder="DD/MM/YYYY" />
      <TextField name="annexure.lut_date" label="LUT date" placeholder="DD/MM/YYYY" />
      <TextField name="annexure.invoice_date" label="Invoice date" placeholder="DD/MM/YYYY" />
    </CardContent>
  </Card>
)

/**
 * The manufacturer is copied from a saved supplier, including its self-sealing
 * permission text, which is printed verbatim on the annexure.
 */
const ManufacturerCard = (): JSX.Element => {
  const { setValue, watch } = useFormContext<WizardData>()
  const { data: suppliers = [] } = useMasterList('supplier')
  const selected = watch('annexure.selected_manufacturer')

  const choose = (id: string): void => {
    const supplier = suppliers.find((entry) => entry.id === id)
    if (!supplier) return
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Manufacturer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Choose from saved suppliers</Label>
          <Select
            value={suppliers.find((entry) => entry.name === selected?.name)?.id ?? ''}
            onValueChange={choose}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a manufacturer" />
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
          />
        </div>
      </CardContent>
    </Card>
  )
}

const DeclarationCard = (): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Declaration</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ChoiceField name="annexure.containerized" label="Containerized" options={SEALING} />
      <ChoiceField name="annexure.non_containerized" label="Non-containerized" options={SEALING} />
      <TextField name="annexure.total_packages" label="Total packages" />
      <TextField
        name="annexure.gross_weight"
        label="Gross weight"
        description="Totalled from the packaging list."
      />
      <TextField
        name="annexure.net_weight"
        label="Net weight"
        description="Totalled from the packaging list."
      />
      <div />
      <ChoiceField name="annexure.question9a" label="Question 9(a)" options={YES_NO} />
      <ChoiceField name="annexure.question9b" label="Question 9(b)" options={YES_NO} />
      <ChoiceField name="annexure.question9c" label="Question 9(c)" options={YES_NO} />
      <TextField name="annexure.officer_designation1" label="Officer designation 1" />
      <TextField name="annexure.officer_designation2" label="Officer designation 2" />
    </CardContent>
  </Card>
)
