import { forwardRef, useEffect, type ComponentPropsWithoutRef } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Copy, Plus, Trash } from 'lucide-react'

import { Step2Schema, type WizardData } from '@shared/contracts'
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
import { DerivedField, NumberField } from '@/components/wizard/fields'
import { sum, toDecimalString } from '@/lib/money'

const BASE = 'invoice.products.containers' as const

/**
 * Step 2 — the physical containers.
 *
 * These rows live at exactly one path. In the web app the same containers were
 * stored twice: this page wrote `containerRows` at the top level of the draft
 * while step 1 wrote `invoice.products.containers`, and each used different
 * field names for the same columns, so the client's saved drafts contain rows
 * where netWeight is '125' and net_weight is '33'.
 */
export const PackagingStep = (): JSX.Element => (
  <WizardShell
    title="Packing list"
    description="Step 2 of 4 — one row per container, with what it holds and what it weighs."
    schema={Step2Schema}
  >
    <ContainerTable />
  </WizardShell>
)

const ContainerTable = (): JSX.Element => {
  const { control, setValue, register } = useFormContext<WizardData>()
  const { fields, append, remove } = useFieldArray({ control, name: BASE })
  // useWatch: see the note in ProductTable — watch() does not re-render for
  // fields registered inside a useFieldArray.
  const containers = useWatch({ control, name: BASE })

  const totalNet = sum(containers.map((container) => container.net_weight))
  const totalGross = sum(containers.map((container) => container.gross_weight))
  const totalQuantity = sum(containers.map((container) => container.quantity))

  // The packing list and the annexure both print these totals; derive them once.
  useEffect(() => {
    setValue('invoice.package.total_net_weight', totalNet, { shouldDirty: false })
    setValue('invoice.package.total_gross_weight', totalGross, { shouldDirty: false })
    setValue('annexure.net_weight', totalNet, { shouldDirty: false })
    setValue('annexure.gross_weight', totalGross, { shouldDirty: false })
  }, [totalNet, totalGross, setValue])

  const blankRow = (): WizardData['invoice']['products']['containers'][number] => ({
    id: crypto.randomUUID(),
    container_no: '',
    line_seal_no: '',
    rfid_seal: '',
    design_no: '',
    quantity: '',
    net_weight: '',
    gross_weight: ''
  })

  /** Containers on one shipment usually differ only in their numbers. */
  const duplicate = (index: number): void => {
    const source = containers[index]
    if (!source) return
    append({ ...source, id: crypto.randomUUID(), container_no: '' })
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Containers"
        description="Add one row for each container in this shipment. Weights are added up for you."
        action={
          fields.length > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={() => append(blankRow())}>
              <Plus />
              Add container
            </Button>
          ) : undefined
        }
      >
        <div className="overflow-x-auto rounded-lg border" data-field={BASE}>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="w-10 text-center text-gray-500">#</TableHead>
                <TableHead className="min-w-44">Container number</TableHead>
                <TableHead className="min-w-40">Line seal number</TableHead>
                <TableHead className="min-w-40">RFID seal</TableHead>
                <TableHead className="min-w-36">Design number</TableHead>
                <TableHead className="w-28 text-right">Boxes</TableHead>
                <TableHead className="w-32 text-right">Net kg</TableHead>
                <TableHead className="w-32 text-right">Gross kg</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center">
                    <p className="text-sm text-gray-500">No containers added yet.</p>
                    <Button type="button" className="mt-3" onClick={() => append(blankRow())}>
                      <Plus />
                      Add the first container
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {fields.map((field, index) => (
                <TableRow key={field.id} data-field={`${BASE}.${index}`}>
                  <TableCell className="text-center text-xs text-gray-400">{index + 1}</TableCell>
                  <TableCell data-field={`${BASE}.${index}.container_no`}>
                    <Input
                      className="h-10 font-mono uppercase"
                      placeholder="ABCD1234567"
                      {...register(`${BASE}.${index}.container_no`)}
                    />
                  </TableCell>
                  <TableCell data-field={`${BASE}.${index}.line_seal_no`}>
                    <Input className="h-10" {...register(`${BASE}.${index}.line_seal_no`)} />
                  </TableCell>
                  <TableCell data-field={`${BASE}.${index}.rfid_seal`}>
                    <Input className="h-10" {...register(`${BASE}.${index}.rfid_seal`)} />
                  </TableCell>
                  <TableCell data-field={`${BASE}.${index}.design_no`}>
                    <Input className="h-10" {...register(`${BASE}.${index}.design_no`)} />
                  </TableCell>
                  <TableCell data-field={`${BASE}.${index}.quantity`}>
                    <NumericCell {...register(`${BASE}.${index}.quantity`)} />
                  </TableCell>
                  <TableCell data-field={`${BASE}.${index}.net_weight`}>
                    <NumericCell {...register(`${BASE}.${index}.net_weight`)} />
                  </TableCell>
                  <TableCell data-field={`${BASE}.${index}.gross_weight`}>
                    <NumericCell {...register(`${BASE}.${index}.gross_weight`)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        aria-label={`Copy container ${index + 1}`}
                        title="Copy this row without its number"
                        onClick={() => duplicate(index)}
                      >
                        <Copy />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-700"
                        aria-label={`Remove container ${index + 1}`}
                        title="Remove this row"
                        onClick={() => remove(index)}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard title="Totals" description="Worked out from the rows above and printed on the packing list.">
        <FieldGrid columns={4}>
          <NumberField
            name="invoice.products.total_pallet_count"
            label="Total pallets"
            help="Leave empty if the goods are not palletised."
          />
          <DerivedField label="Total boxes" value={toDecimalString(totalQuantity)} />
          <DerivedField label="Total net weight (kg)" value={toDecimalString(totalNet)} />
          <DerivedField label="Total gross weight (kg)" value={toDecimalString(totalGross)} />
        </FieldGrid>
      </SectionCard>
    </div>
  )
}

/** See the note in ProductTable: dropping register()'s ref unregisters the input. */
const NumericCell = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<typeof Input>>(
  (props, ref) => (
    <Input ref={ref} className="h-10 text-right tabular-nums" inputMode="decimal" {...props} />
  )
)
NumericCell.displayName = 'NumericCell'
