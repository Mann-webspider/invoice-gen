import { useEffect } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Plus, Trash } from 'lucide-react'

import type { WizardData } from '@shared/contracts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useMasterList } from '@/hooks/useMaster'
import { multiply, sum, toDecimalString } from '@/lib/money'

const BASE = 'invoice.products.product_list' as const

/**
 * The invoice product table.
 *
 * Derived cells (total SQM, line total, invoice total) are computed with
 * decimal.js rather than JavaScript floats. The old code did
 * `quantity * sqm` and `price * total_sqm` directly, which is how a line worth
 * 3036.665 was written to an INT column as 3036.67 in one document and 3036.66
 * in another.
 */
export const ProductTable = (): JSX.Element => {
  const { control, setValue } = useFormContext<WizardData>()
  const { fields, append, remove } = useFieldArray({ control, name: BASE })

  const { data: categories = [] } = useMasterList('productCategory')
  const { data: sizes = [] } = useMasterList('productSize')
  const { data: units = [] } = useMasterList('dropdownOption', 'unit_type')

  /**
   * useWatch, not watch(): inputs inside a useFieldArray are registered
   * imperatively, and only useWatch re-renders this component when one of them
   * changes. With watch() the derived cells kept the value they were first
   * computed with — editing a quantity left the line total stale.
   */
  const products = useWatch({ control, name: BASE })
  const freight = useWatch({ control, name: 'invoice.products.freight' })
  const insurance = useWatch({ control, name: 'invoice.products.insurance' })

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

    const goodsTotal = sum(products.map((product) => product.total_price))
    const grandTotal = sum([goodsTotal, freight, insurance])
    setValue('invoice.products.total_price', grandTotal, { shouldDirty: false })
    setValue('invoice.package.total_fob', grandTotal, { shouldDirty: false })

    const totalSqmAll = sum(products.map((product) => product.total_sqm))
    setValue('invoice.package.total_sqm', totalSqmAll, { shouldDirty: false })
    setValue('invoice.package.no_of_sqm', totalSqmAll, { shouldDirty: false })
  }, [products, freight, insurance, setValue])

  const addRow = (): void =>
    append({
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

  const applyCategory = (index: number, categoryId: string): void => {
    const category = categories.find((entry) => entry.id === categoryId)
    setValue(`${BASE}.${index}.category_id`, categoryId, { shouldDirty: true })
    setValue(`${BASE}.${index}.category_name`, category?.description ?? '', { shouldDirty: true })
    setValue(`${BASE}.${index}.hsn_code`, category?.hsnCode ?? '', { shouldDirty: true })
  }

  /** Choosing a known size fills its square-metre value. */
  const applySize = (index: number, size: string): void => {
    const match = sizes.find((entry) => entry.size === size)
    setValue(`${BASE}.${index}.size`, size, { shouldDirty: true })
    if (match) setValue(`${BASE}.${index}.sqm`, match.sqm, { shouldDirty: true })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Products</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-44">Category / HSN</TableHead>
              <TableHead className="min-w-48">Description</TableHead>
              <TableHead className="min-w-32">Size</TableHead>
              <TableHead className="w-24">Quantity</TableHead>
              <TableHead className="w-24">Unit</TableHead>
              <TableHead className="w-24">SQM</TableHead>
              <TableHead className="w-28">Total SQM</TableHead>
              <TableHead className="w-24">Price</TableHead>
              <TableHead className="w-28">Amount</TableHead>
              <TableHead className="w-28">Net wt.</TableHead>
              <TableHead className="w-28">Gross wt.</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-sm text-gray-500 py-6">
                  No products yet. Add one to continue.
                </TableCell>
              </TableRow>
            )}

            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>
                  <Select
                    value={products[index]?.category_id ?? ''}
                    onValueChange={(value) => applyCategory(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.description} ({category.hsnCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  <Cell name={`${BASE}.${index}.product_name`} placeholder="Description" />
                </TableCell>

                <TableCell>
                  <Select
                    value={products[index]?.size ?? ''}
                    onValueChange={(value) => applySize(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map((size) => (
                        <SelectItem key={size.id} value={size.size}>
                          {size.size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  <Cell name={`${BASE}.${index}.quantity`} />
                </TableCell>

                <TableCell>
                  <Select
                    value={products[index]?.unit ?? ''}
                    onValueChange={(value) =>
                      setValue(`${BASE}.${index}.unit`, value, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.value}>
                          {unit.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  <Cell name={`${BASE}.${index}.sqm`} />
                </TableCell>
                <TableCell>
                  <ReadOnlyCell value={products[index]?.total_sqm} />
                </TableCell>
                <TableCell>
                  <Cell name={`${BASE}.${index}.price`} />
                </TableCell>
                <TableCell>
                  <ReadOnlyCell value={products[index]?.total_price} />
                </TableCell>
                <TableCell>
                  <Cell name={`${BASE}.${index}.net_weight`} />
                </TableCell>
                <TableCell>
                  <Cell name={`${BASE}.${index}.gross_weight`} />
                </TableCell>

                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    aria-label={`Remove product ${index + 1}`}
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

      <div className="flex justify-end gap-6 text-sm">
        <span className="text-gray-500">
          Goods total:{' '}
          <span className="font-medium text-gray-900">
            {toDecimalString(sum(products.map((product) => product.total_price)))}
          </span>
        </span>
        <span className="text-gray-500">
          Invoice total:{' '}
          <span className="font-medium text-gray-900">
            {toDecimalString(sum([sum(products.map((p) => p.total_price)), freight, insurance]))}
          </span>
        </span>
      </div>
    </div>
  )
}

/** A plain text cell bound to the form. */
const Cell = ({ name, placeholder }: { name: string; placeholder?: string }): JSX.Element => {
  const { register } = useFormContext<WizardData>()
  return (
    <Input
      className="h-9"
      placeholder={placeholder}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...register(name as any)}
    />
  )
}

const ReadOnlyCell = ({ value }: { value?: string }): JSX.Element => (
  <Input className="h-9 bg-gray-50" value={value ?? ''} readOnly tabIndex={-1} />
)
