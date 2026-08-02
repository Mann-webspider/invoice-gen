import { forwardRef, useEffect, type ComponentPropsWithoutRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash } from 'lucide-react'

import { Step4Schema, type WizardData } from '@shared/contracts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { WizardShell } from '@/components/wizard/WizardShell'
import { FieldGrid, SectionCard } from '@/components/wizard/SectionCard'
import { ChoiceField, DateField, NumberField, TextField } from '@/components/wizard/fields'
import { useWizard } from '@/context/WizardContext'
import { ipc } from '@/lib/ipc'
import { toastSuccess } from '@/lib/form'
import { sum } from '@/lib/money'

const BASE = 'vgm.containers' as const

/**
 * The two ways SOLAS allows a verified gross mass to be established. Spelled
 * out rather than left as "method-1" and "method-2", which is what the form
 * stores and what nobody can choose between without looking it up.
 */
const METHODS = [
  { value: 'method-1', label: 'Method 1 — weigh the packed container' },
  { value: 'method-2', label: 'Method 2 — add up the cargo and the tare weight' }
] as const
const UNITS = [
  { value: 'KG', label: 'Kilograms' },
  { value: 'MT', label: 'Tonnes' }
] as const
const TYPES = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'REEFER', label: 'Refrigerated' },
  { value: 'HAZARDOUS', label: 'Hazardous' }
] as const

/** Step 4 — verified gross mass, then the invoice is written. */
export const VgmStep = (): JSX.Element => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { form, draftId, saveNow } = useWizard()

  const finish = async (): Promise<void> => {
    await saveNow()
    const summary = await ipc.invoice.create({
      data: form.getValues(),
      draftId: draftId ?? undefined
    })
    // Both lists are cached for thirty seconds, so without this the client is
    // sent to a dashboard that says they have no invoices and still lists the
    // draft that has just become one.
    await queryClient.invalidateQueries({ queryKey: ['invoices'] })
    await queryClient.invalidateQueries({ queryKey: ['drafts'] })
    toastSuccess(`Invoice ${summary.invoiceNumber} created`)
    navigate('/', { replace: true })
  }

  return (
    <WizardShell
      title="Container weights"
      description="Step 4 of 4 — the verified gross mass the shipping line requires. Creating the invoice is the last thing this page does."
      schema={Step4Schema}
      onFinish={finish}
      finishLabel="Create the invoice"
    >
      <div className="space-y-6">
        <ShipperCard />
        <WeighingCard />
        <VgmContainerTable />
      </div>
    </WizardShell>
  )
}

const ShipperCard = (): JSX.Element => (
  <SectionCard
    title="Who is declaring the weight"
    description="Filled in from the company you chose on step 1. Change it only if someone else signs."
  >
    <FieldGrid>
      <TextField name="vgm.shipper_name" label="Shipper name" />
      <TextField name="vgm.ie_code" label="IE code" />
      <TextField name="vgm.forwarder_email" label="Forwarder's email" type="email" />
      <TextField name="vgm.authorized_name" label="Authorised person" />
      <TextField name="vgm.authorized_contact" label="Their phone number" />
    </FieldGrid>
  </SectionCard>
)

const WeighingCard = (): JSX.Element => (
  <SectionCard
    title="How the weight was taken"
    description="What the weighbridge recorded, as it prints on the VGM declaration."
  >
    <FieldGrid>
      <TextField name="vgm.container_number" label="Container number" />
      <TextField name="vgm.container_size" label="Container size" placeholder="e.g. 20'" />
      <NumberField
        name="vgm.permissible_weight"
        label="Maximum permitted weight"
        help="The limit printed on the container itself."
      />
      <TextField name="vgm.weighbridge_registration" label="Weighbridge registration" />
      <ChoiceField
        name="vgm.verified_gross_mass"
        label="How the weight was worked out"
        options={METHODS}
      />
      <ChoiceField name="vgm.unit_of_measurement" label="Weights are in" options={UNITS} />
      <DateField name="vgm.dt_weighing" label="Date weighed" pattern="dd.MM.yyyy" />
      <TextField name="vgm.weighing_slip_no" label="Weighing slip number" />
      <ChoiceField name="vgm.type" label="Cargo type" options={TYPES} />
      <TextField
        name="vgm.imdg_class"
        label="IMDG class"
        help="Only for hazardous cargo. Leave empty otherwise."
      />
    </FieldGrid>
  </SectionCard>
)

const VgmContainerTable = (): JSX.Element => {
  const { control, setValue, register } = useFormContext<WizardData>()
  const { fields, append, remove } = useFieldArray({ control, name: BASE })
  // useWatch: see the note in ProductTable — watch() does not re-render for
  // fields registered inside a useFieldArray.
  const containers = useWatch({ control, name: BASE })
  const packingContainers = useWatch({ control, name: 'invoice.products.containers' })

  // Total VGM is tare plus cargo, computed rather than typed.
  useEffect(() => {
    containers.forEach((container, index) => {
      const total = sum([container.tare_weight, container.gross_weight])
      if (container.total_vgm !== total) {
        setValue(`${BASE}.${index}.total_vgm`, total, { shouldDirty: false })
      }
    })
  }, [containers, setValue])

  /**
   * Brings the containers over from step 2 automatically the first time this
   * page is opened. It used to be a button labelled "Copy from packaging list"
   * that most people never pressed, and the alternative was retyping every
   * container number that had already been entered once. Only ever fills an
   * empty table, so nothing typed here is overwritten.
   */
  useEffect(() => {
    if (containers.length > 0 || packingContainers.length === 0) return
    setValue(
      BASE,
      packingContainers.map((container) => ({
        id: crypto.randomUUID(),
        booking_no: '',
        container_no: container.container_no,
        tare_weight: '',
        gross_weight: container.gross_weight,
        total_vgm: ''
      })),
      { shouldDirty: true }
    )
  }, [containers.length, packingContainers, setValue])

  return (
    <SectionCard
      title="Containers"
      description="Brought over from the packing list. Add the tare weight from the container door for each one."
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              id: crypto.randomUUID(),
              booking_no: '',
              container_no: '',
              tare_weight: '',
              gross_weight: '',
              total_vgm: ''
            })
          }
        >
          <Plus />
          Add container
        </Button>
      }
    >
      <div className="overflow-x-auto rounded-lg border" data-field={BASE}>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="w-10 text-center text-gray-500">#</TableHead>
              <TableHead className="min-w-40">Booking number</TableHead>
              <TableHead className="min-w-44">Container number</TableHead>
              <TableHead className="w-32 text-right">Tare weight</TableHead>
              <TableHead className="w-32 text-right">Cargo weight</TableHead>
              <TableHead className="w-32 text-right">Total VGM</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                  Add containers on the packing list and they appear here automatically.
                </TableCell>
              </TableRow>
            )}

            {fields.map((field, index) => (
              <TableRow key={field.id} data-field={`${BASE}.${index}`}>
                <TableCell className="text-center text-xs text-gray-400">{index + 1}</TableCell>
                <TableCell data-field={`${BASE}.${index}.booking_no`}>
                  <Input className="h-10" {...register(`${BASE}.${index}.booking_no`)} />
                </TableCell>
                <TableCell data-field={`${BASE}.${index}.container_no`}>
                  <Input
                    className="h-10 font-mono uppercase"
                    {...register(`${BASE}.${index}.container_no`)}
                  />
                </TableCell>
                <TableCell data-field={`${BASE}.${index}.tare_weight`}>
                  <NumericCell {...register(`${BASE}.${index}.tare_weight`)} />
                </TableCell>
                <TableCell data-field={`${BASE}.${index}.gross_weight`}>
                  <NumericCell {...register(`${BASE}.${index}.gross_weight`)} />
                </TableCell>
                <TableCell>
                  <div className="flex h-10 items-center justify-end rounded-md border border-dashed bg-gray-50 px-3 text-sm tabular-nums text-gray-700">
                    {containers[index]?.total_vgm || '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Remove container ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <Trash />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  )
}

/** See the note in ProductTable: dropping register()'s ref unregisters the input. */
const NumericCell = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<typeof Input>>(
  (props, ref) => (
    <Input ref={ref} className="h-10 text-right tabular-nums" inputMode="decimal" {...props} />
  )
)
NumericCell.displayName = 'NumericCell'
