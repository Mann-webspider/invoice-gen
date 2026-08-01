import { Card, CardContent } from '@/components/ui/card'
import { DropdownListCard } from '@/components/admin/DropdownListCard'
import { PairListCard } from '@/components/admin/PairListCard'
import { SectionHeader } from '@/components/admin/SectionHeader'
import { useMasterList, useMasterMutations } from '@/hooks/useMaster'

/**
 * Product reference data used by the invoice product table: categories with
 * their HSN codes, sizes with their square-metre value, and unit types.
 */
export const TableInfoSection = (): JSX.Element => {
  const { data: categories = [], isPending: categoriesPending } =
    useMasterList('productCategory')
  const categoryMutations = useMasterMutations('productCategory', {
    created: 'Product type added',
    updated: 'Product type updated',
    removed: 'Product type removed'
  })

  const { data: sizes = [], isPending: sizesPending } = useMasterList('productSize')
  const sizeMutations = useMasterMutations('productSize', {
    created: 'Size added',
    updated: 'Size updated',
    removed: 'Size removed'
  })

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Products and sizes"
        description="What the goods table on an invoice offers. Sizes carry their square-metre value, which is what line totals are worked out from."
      />

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Product types</h3>
          <p className="mb-4 text-sm text-gray-500">
            The description and customs HSN code printed for each kind of goods.
          </p>
          <PairListCard
            title="Product type"
            addLabel="Add a product type"
            fields={[
              {
                key: 'description',
                label: 'Description',
                placeholder: 'e.g. Glazed porcelain floor tiles'
              },
              { key: 'hsnCode', label: 'HSN code', placeholder: 'e.g. 69072100' }
            ]}
            rows={categories}
            isPending={categoriesPending}
            onCreate={(values) =>
              categoryMutations.create({
                description: values.description,
                hsnCode: values.hsnCode
              })
            }
            onUpdate={(id, values) =>
              categoryMutations.update(id, {
                description: values.description,
                hsnCode: values.hsnCode
              })
            }
            onDelete={categoryMutations.remove}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Sizes</h3>
          <p className="mb-4 text-sm text-gray-500">
            Each size holds how many square metres one unit covers. Type a dash for products that
            are not sold by area — those are priced on quantity instead.
          </p>
          <PairListCard
            title="Size"
            addLabel="Add a size"
            fields={[
              { key: 'size', label: 'Size', placeholder: 'e.g. 600 X 1200' },
              {
                key: 'sqm',
                label: 'Square metres per unit',
                // Free text, not a number: the live data uses '-' for products
                // that are not sold by area.
                placeholder: 'e.g. 1.44, or - if not applicable'
              }
            ]}
            rows={sizes}
            isPending={sizesPending}
            onCreate={(values) => sizeMutations.create({ size: values.size, sqm: values.sqm })}
            onUpdate={(id, values) =>
              sizeMutations.update(id, { size: values.size, sqm: values.sqm })
            }
            onDelete={sizeMutations.remove}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <DropdownListCard
            category="unit_type"
            title="Units"
            description="How quantities are counted, e.g. BOX."
            placeholder="e.g. BOX"
          />
          <DropdownListCard
            category="marks_nos"
            title="Load types"
            description="Full or part container load, offered under Marks and numbers."
            placeholder="e.g. FCL"
          />
        </CardContent>
      </Card>
    </div>
  )
}
