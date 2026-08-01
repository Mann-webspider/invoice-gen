import { useEffect } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Plus, Trash } from 'lucide-react'

import { Step2Schema, type WizardData } from '@shared/contracts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { WizardShell } from '@/components/wizard/WizardShell'
import { TextField } from '@/components/wizard/fields'
import { sum } from '@/lib/money'

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
    title="Packaging List"
    description="Step 2 of 4 — containers, marks and pallets"
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

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Containers</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              id: crypto.randomUUID(),
              container_no: '',
              line_seal_no: '',
              rfid_seal: '',
              design_no: '',
              quantity: '',
              net_weight: '',
              gross_weight: ''
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add container
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-40">Container no.</TableHead>
                <TableHead className="min-w-36">Line seal no.</TableHead>
                <TableHead className="min-w-36">RFID seal</TableHead>
                <TableHead className="min-w-32">Design no.</TableHead>
                <TableHead className="w-28">Quantity</TableHead>
                <TableHead className="w-28">Net weight</TableHead>
                <TableHead className="w-28">Gross weight</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-6">
                    No containers yet. Add one to continue.
                  </TableCell>
                </TableRow>
              )}

              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Input className="h-9" {...register(`${BASE}.${index}.container_no`)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-9" {...register(`${BASE}.${index}.line_seal_no`)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-9" {...register(`${BASE}.${index}.rfid_seal`)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-9" {...register(`${BASE}.${index}.design_no`)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-9" {...register(`${BASE}.${index}.quantity`)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-9" {...register(`${BASE}.${index}.net_weight`)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-9" {...register(`${BASE}.${index}.gross_weight`)} />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      aria-label={`Remove container ${index + 1}`}
                      onClick={() => remove(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <TextField name="invoice.products.total_pallet_count" label="Total pallet count" />
          <ReadOnly label="Total quantity" value={totalQuantity} />
          <ReadOnly label="Total net weight" value={totalNet} />
          <ReadOnly label="Total gross weight" value={totalGross} />
        </div>
      </CardContent>
    </Card>
  )
}

const ReadOnly = ({ label, value }: { label: string; value: string }): JSX.Element => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input value={value} readOnly className="bg-gray-50" />
  </div>
)
