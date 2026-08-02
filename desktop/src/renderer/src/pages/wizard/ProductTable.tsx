import { forwardRef, useEffect, useState, type ComponentPropsWithoutRef } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Copy, Plus, Trash } from 'lucide-react'

import type { ProductCategoryRecord, WizardData } from '@shared/contracts'
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
import { Picker } from '@/components/fields/Picker'
import { FieldsDialog } from '@/components/master/FieldsDialog'
import { useMasterList, useMasterMutations } from '@/hooks/useMaster'
import { multiply, sum, toDecimalString } from '@/lib/money'

const BASE = 'invoice.products.product_list' as const

/**
 * The invoice product table.
 *
 * Derived cells (total SQM, line total, invoice total) are computed with
 * decimal.js rather than JavaScript floats. The old code did `quantity * sqm`
 * and `price * total_sqm` directly, which is how a line worth 3036.665 was
 * written to an INT column as 3036.67 in one document and 3036.66 in another.
 *
 * The three lists a row reads from — category, size and unit — can all be added
 * to from inside the row. A tile size nobody has entered yet used to mean
 * leaving the invoice, finding an administrator and starting the form again.
 */
export const ProductTable = (): JSX.Element => {
  const { control, setValue, register } = useFormContext<WizardData>()
  const { fields, append, remove } = useFieldArray({ control, name: BASE })

  const { data: categories = [] } = useMasterList('productCategory')
  const { data: sizes = [] } = useMasterList('productSize')
  const { data: units = [] } = useMasterList('dropdownOption', 'unit_type')

  const categoryMutations = useMasterMutations('productCategory', {
    created: 'Product type added',
    updated: 'Product type updated',
    removed: 'Product type removed'
  })
  const sizeMutations = useMasterMutations('productSize', {
    created: 'Size added',
    updated: 'Size updated',
    removed: 'Size removed'
  })
  const unitMutations = useMasterMutations('dropdownOption', {
    created: 'Unit added',
    updated: 'Unit updated',
    removed: 'Unit removed'
  })

  /** Which row opened the Add dialog, so the new record lands back in it. */
  const [addingCategoryFor, setAddingCategoryFor] = useState<number | null>(null)
  const [addingSizeFor, setAddingSizeFor] = useState<number | null>(null)

  /**
   * useWatch, not watch(): inputs inside a useFieldArray are registered
   * imperatively, and only useWatch re-renders this component when one of them
   * changes. With watch() the derived cells kept the value they were first
   * computed with — editing a quantity left the line total stale.
   */
  const products = useWatch({ control, name: BASE })
  const freight = useWatch({ control, name: 'invoice.products.freight' })
  const insurance = useWatch({ control, name: 'invoice.products.insurance' })

  const goodsTotal = sum(products.map((product) => product.total_price))
  const grandTotal = sum([goodsTotal, freight, insurance])
  const totalSqmAll = sum(products.map((product) => product.total_sqm))

  // Recompute derived values whenever an input cell changes.
  useEffect(() => {
    products.forEach((product, index) => {
      const totalSqm = multiply(product.quantity, product.sqm)
      // Products not sold by area have no SQM; those price by quantity.
      const lineTotal = multiply(product.price, totalSqm || product.quantity)

      if (product.total_sqm !== totalSqm) {
        setValue(`${BASE}.${index}.total_sqm`, totalSqm, { shouldDirty: false })
      }
      if (product.total_price !== lineTotal) {
        setValue(`${BASE}.${index}.total_price`, lineTotal, { shouldDirty: false })
      }
    })

    setValue('invoice.products.total_price', grandTotal, { shouldDirty: false })
    setValue('invoice.package.total_fob', grandTotal, { shouldDirty: false })
    setValue('invoice.package.total_sqm', totalSqmAll, { shouldDirty: false })
    setValue('invoice.package.no_of_sqm', totalSqmAll, { shouldDirty: false })
  }, [products, grandTotal, totalSqmAll, setValue])

  const blankRow = (): WizardData['invoice']['products']['product_list'][number] => ({
    id: crypto.randomUUID(),
    category_id: '',
    category_name: '',
    hsn_code: '',
    product_name: '',
    size: '',
    quantity: '',
    unit: units[0]?.value ?? '',
    sqm: '',
    total_sqm: '',
    price: '',
    total_price: '',
    net_weight: '',
    gross_weight: ''
  })

  /** Most invoices are the same product in several sizes; copying beats retyping. */
  const duplicate = (index: number): void => {
    const source = products[index]
    if (!source) return
    append({ ...source, id: crypto.randomUUID() })
  }

  /**
   * Takes the record rather than an id. A category added from the dialog is not
   * in `categories` yet — invalidating the query does not refetch it before the
   * dialog closes — and looking it up there wrote the id with an empty
   * description and HSN code, which is exactly what prints on the invoice.
   */
  const applyCategory = (index: number, category: ProductCategoryRecord): void => {
    setValue(`${BASE}.${index}.category_id`, category.id, { shouldDirty: true })
    setValue(`${BASE}.${index}.category_name`, category.description, { shouldDirty: true })
    setValue(`${BASE}.${index}.hsn_code`, category.hsnCode, { shouldDirty: true })
  }

  const chooseCategory = (index: number, categoryId: string): void => {
    const category = categories.find((entry) => entry.id === categoryId)
    if (category) applyCategory(index, category)
  }

  /** Choosing a known size fills its square-metre value. */
  const applySize = (index: number, size: string): void => {
    const match = sizes.find((entry) => entry.size === size)
    setValue(`${BASE}.${index}.size`, size, { shouldDirty: true })
    if (match) setValue(`${BASE}.${index}.sqm`, match.sqm, { shouldDirty: true })
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border" data-field={BASE}>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="w-10 text-center text-gray-500">#</TableHead>
              <TableHead className="min-w-52">Product type</TableHead>
              <TableHead className="min-w-52">Description</TableHead>
              <TableHead className="min-w-40">Size</TableHead>
              <TableHead className="w-24 text-right">Quantity</TableHead>
              <TableHead className="w-32">Unit</TableHead>
              <TableHead className="w-24 text-right">SQM each</TableHead>
              <TableHead className="w-28 text-right">Total SQM</TableHead>
              <TableHead className="w-24 text-right">Rate</TableHead>
              <TableHead className="w-32 text-right">Amount</TableHead>
              <TableHead className="w-28 text-right">Net kg</TableHead>
              <TableHead className="w-28 text-right">Gross kg</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="py-10 text-center">
                  <p className="text-sm text-gray-500">Nothing on this invoice yet.</p>
                  <Button type="button" className="mt-3" onClick={() => append(blankRow())}>
                    <Plus />
                    Add the first product
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {fields.map((field, index) => (
              <TableRow key={field.id} data-field={`${BASE}.${index}`} className="align-top">
                <TableCell className="pt-5 text-center text-xs text-gray-400">
                  {index + 1}
                </TableCell>

                <TableCell data-field={`${BASE}.${index}.category_id`}>
                  <Picker
                    value={products[index]?.category_id ?? ''}
                    onChange={(value) => chooseCategory(index, value)}
                    options={categories.map((category) => ({
                      value: category.id,
                      label: category.description,
                      hint: `HSN ${category.hsnCode}`
                    }))}
                    placeholder="Choose"
                    addNewLabel="Add a product type"
                    onAddNew={() => setAddingCategoryFor(index)}
                  />
                </TableCell>

                <TableCell data-field={`${BASE}.${index}.product_name`}>
                  <Input
                    className="h-10"
                    placeholder="How it prints on the invoice"
                    {...register(`${BASE}.${index}.product_name`)}
                  />
                </TableCell>

                <TableCell data-field={`${BASE}.${index}.size`}>
                  <Picker
                    value={products[index]?.size ?? ''}
                    onChange={(value) => applySize(index, value)}
                    options={sizes.map((size) => ({
                      value: size.size,
                      label: size.size,
                      hint: size.sqm === '-' ? 'not sold by area' : `${size.sqm} sqm`
                    }))}
                    placeholder="Choose"
                    addNewLabel="Add a size"
                    onAddNew={() => setAddingSizeFor(index)}
                  />
                </TableCell>

                <TableCell data-field={`${BASE}.${index}.quantity`}>
                  <NumericCell {...register(`${BASE}.${index}.quantity`)} />
                </TableCell>

                <TableCell data-field={`${BASE}.${index}.unit`}>
                  <Picker
                    value={products[index]?.unit ?? ''}
                    onChange={(value) =>
                      setValue(`${BASE}.${index}.unit`, value, { shouldDirty: true })
                    }
                    options={units
                      .filter((unit) => unit.isActive)
                      .map((unit) => ({ value: unit.value, label: unit.value }))}
                    placeholder="Unit"
                    searchPlaceholder="Search, or type a new unit…"
                    onAddTyped={async (text) => {
                      await unitMutations.create({
                        category: 'unit_type',
                        value: text,
                        isActive: true
                      })
                      return text
                    }}
                  />
                </TableCell>

                <TableCell data-field={`${BASE}.${index}.sqm`}>
                  <NumericCell {...register(`${BASE}.${index}.sqm`)} />
                </TableCell>

                <TableCell>
                  <DerivedCell value={products[index]?.total_sqm} />
                </TableCell>

                <TableCell data-field={`${BASE}.${index}.price`}>
                  <NumericCell {...register(`${BASE}.${index}.price`)} />
                </TableCell>

                <TableCell>
                  <DerivedCell value={products[index]?.total_price} />
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
                      aria-label={`Copy product ${index + 1}`}
                      title="Copy this line"
                      onClick={() => duplicate(index)}
                    >
                      <Copy />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-700"
                      aria-label={`Remove product ${index + 1}`}
                      title="Remove this line"
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

      {fields.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button type="button" variant="outline" onClick={() => append(blankRow())}>
            <Plus />
            Add another product
          </Button>

          <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <Total label="Total SQM" value={toDecimalString(totalSqmAll)} />
            <Total label="Goods" value={toDecimalString(goodsTotal)} />
            <Total label="Invoice total" value={toDecimalString(grandTotal)} strong />
          </dl>
        </div>
      )}

      <FieldsDialog
        open={addingCategoryFor !== null}
        onOpenChange={(open) => !open && setAddingCategoryFor(null)}
        title="Add a product type"
        description="The description and HSN code printed on the invoice for this kind of goods."
        fields={[
          {
            key: 'description',
            label: 'Description',
            placeholder: 'e.g. Glazed porcelain floor tiles'
          },
          {
            key: 'hsnCode',
            label: 'HSN code',
            placeholder: 'e.g. 69072100',
            help: 'The customs code for this kind of goods.'
          }
        ]}
        submitLabel="Add product type"
        onSave={async (values) => {
          const record = await categoryMutations.create({
            description: values.description,
            hsnCode: values.hsnCode
          })
          if (addingCategoryFor !== null) applyCategory(addingCategoryFor, record)
        }}
      />

      <FieldsDialog
        open={addingSizeFor !== null}
        onOpenChange={(open) => !open && setAddingSizeFor(null)}
        title="Add a size"
        description="Sizes carry their square-metre value, which is used to work out line totals."
        fields={[
          { key: 'size', label: 'Size', placeholder: 'e.g. 600 X 1200' },
          {
            key: 'sqm',
            label: 'Square metres per unit',
            placeholder: 'e.g. 1.44',
            help: 'Type a dash if this product is not sold by area.'
          }
        ]}
        submitLabel="Add size"
        onSave={async (values) => {
          await sizeMutations.create({ size: values.size, sqm: values.sqm })
          if (addingSizeFor !== null) {
            setValue(`${BASE}.${addingSizeFor}.size`, values.size, { shouldDirty: true })
            setValue(`${BASE}.${addingSizeFor}.sqm`, values.sqm, { shouldDirty: true })
          }
        }}
      />
    </div>
  )
}

/**
 * Numbers line up on the right, so a mistyped column is visible at a glance.
 *
 * forwardRef, not a plain function: `register()` hands back a ref, and a
 * component that drops it never gets registered at all.
 */
const NumericCell = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<typeof Input>>(
  (props, ref) => (
    <Input ref={ref} className="h-10 text-right tabular-nums" inputMode="decimal" {...props} />
  )
)
NumericCell.displayName = 'NumericCell'

/**
 * A computed cell. Dashed and unfocusable rather than a greyed-out box: the old
 * table rendered these as `<Input readOnly>`, which invites people to click into
 * them and wonder why nothing types.
 */
const DerivedCell = ({ value }: { value?: string }): JSX.Element => (
  <div className="flex h-10 items-center justify-end rounded-md border border-dashed bg-gray-50 px-3 text-sm tabular-nums text-gray-700">
    {value || '—'}
  </div>
)

const Total = ({
  label,
  value,
  strong
}: {
  label: string
  value: string
  strong?: boolean
}): JSX.Element => (
  <div className="flex items-baseline gap-2">
    <dt className="text-gray-500">{label}</dt>
    <dd
      className={
        strong ? 'text-base font-semibold tabular-nums' : 'font-medium tabular-nums text-gray-900'
      }
    >
      {value}
    </dd>
  </div>
)
