import { useEffect } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash } from 'lucide-react'

import { Step4Schema, type WizardData } from '@shared/contracts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ChoiceField, TextField } from '@/components/wizard/fields'
import { useWizard } from '@/context/WizardContext'
import { ipc } from '@/lib/ipc'
import { toastSuccess } from '@/lib/form'
import { sum } from '@/lib/money'

const BASE = 'vgm.containers' as const
const METHODS = ['method-1', 'method-2'] as const
const UNITS = ['KG', 'MT'] as const
const TYPES = ['NORMAL', 'REEFER', 'HAZARDOUS'] as const

/** Step 4 — verified gross mass, then the invoice is written. */
export const VgmStep = (): JSX.Element => {
  const navigate = useNavigate()
  const { form, draftId, saveNow } = useWizard()

  const finish = async (): Promise<void> => {
    await saveNow()
    const summary = await ipc.invoice.create({
      data: form.getValues(),
      draftId: draftId ?? undefined
    })
    toastSuccess(`Invoice ${summary.invoiceNumber} created`)
    navigate('/', { replace: true })
  }

  return (
    <WizardShell
      title="VGM Form"
      description="Step 4 of 4 — verified gross mass, then create the invoice"
      schema={Step4Schema}
      onFinish={finish}
      finishLabel="Create invoice"
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
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Shipper</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TextField name="vgm.shipper_name" label="Shipper name" />
      <TextField name="vgm.ie_code" label="IE code" />
      <TextField name="vgm.forwarder_email" label="Forwarder email" />
      <TextField name="vgm.authorized_name" label="Authorised name" />
      <TextField name="vgm.authorized_contact" label="Authorised contact" />
    </CardContent>
  </Card>
)

const WeighingCard = (): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Weighing</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TextField name="vgm.container_number" label="Container number" />
      <TextField name="vgm.container_size" label="Container size" />
      <TextField name="vgm.permissible_weight" label="Permissible weight" />
      <TextField name="vgm.weighbridge_registration" label="Weighbridge registration" />
      <ChoiceField name="vgm.verified_gross_mass" label="Determination method" options={METHODS} />
      <ChoiceField name="vgm.unit_of_measurement" label="Unit" options={UNITS} />
      <TextField name="vgm.dt_weighing" label="Date of weighing" placeholder="DD.MM.YYYY" />
      <TextField name="vgm.weighing_slip_no" label="Weighing slip no." />
      <ChoiceField name="vgm.type" label="Type" options={TYPES} />
      <TextField name="vgm.imdg_class" label="IMDG class" />
    </CardContent>
  </Card>
)

const VgmContainerTable = (): JSX.Element => {
  const { control, setValue, register } = useFormContext<WizardData>()
  const { fields, append, remove } = useFieldArray({ control, name: BASE })
  // useWatch: see the note in ProductTable — watch() does not re-render for
  // fields registered inside a useFieldArray.
  const containers = useWatch({ control, name: BASE })
  const packingContainers = useWatch({ control, name: 'invoice.products.containers' })

  // Total VGM is tare plus gross, computed rather than typed.
  useEffect(() => {
    containers.forEach((container, index) => {
      const total = sum([container.tare_weight, container.gross_weight])
      if (container.total_vgm !== total) {
        setValue(`${BASE}.${index}.total_vgm`, total, { shouldDirty: false })
      }
    })
  }, [containers, setValue])

  /** Saves retyping the container numbers already entered on step 2. */
  const copyFromPackingList = (): void => {
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
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">VGM containers</CardTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={packingContainers.length === 0}
            onClick={copyFromPackingList}
          >
            Copy from packaging list
          </Button>
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
            <Plus className="h-4 w-4" />
            Add container
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-36">Booking no.</TableHead>
                <TableHead className="min-w-40">Container no.</TableHead>
                <TableHead className="w-32">Tare weight</TableHead>
                <TableHead className="w-32">Cargo weight</TableHead>
                <TableHead className="w-32">Total VGM</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-6">
                    No containers yet.
                  </TableCell>
                </TableRow>
              )}

              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Input className="h-9" {...register(`${BASE}.${index}.booking_no`)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-9" {...register(`${BASE}.${index}.container_no`)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-9" {...register(`${BASE}.${index}.tare_weight`)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-9" {...register(`${BASE}.${index}.gross_weight`)} />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-9 bg-gray-50"
                      value={containers[index]?.total_vgm ?? ''}
                      readOnly
                      tabIndex={-1}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      aria-label={`Remove VGM container ${index + 1}`}
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
      </CardContent>
    </Card>
  )
}
