import { DropdownListCard } from '@/components/admin/DropdownListCard'
import { PairListCard } from '@/components/admin/PairListCard'
import { useMasterList, useMasterMutations } from '@/hooks/useMaster'

/**
 * Product reference data used by the invoice product table: categories with
 * their HSN codes, sizes with their square-metre value, and unit types.
 */
export const TableInfoSection = (): JSX.Element => {
  const { data: categories = [], isPending: categoriesPending } =
    useMasterList('productCategory')
  const categoryMutations = useMasterMutations('productCategory', {
    created: 'Category added',
    updated: 'Category updated',
    removed: 'Category removed'
  })

  const { data: sizes = [], isPending: sizesPending } = useMasterList('productSize')
  const sizeMutations = useMasterMutations('productSize', {
    created: 'Size added',
    updated: 'Size updated',
    removed: 'Size removed'
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Table Information</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <PairListCard
          title="Description & HSN Code"
          fields={[
            {
              key: 'description',
              label: 'Description',
              placeholder: 'e.g. Glazed porcelain Floor Tiles'
            },
            { key: 'hsnCode', label: 'HSN Code', placeholder: 'e.g. 69072100' }
          ]}
          rows={categories}
          isPending={categoriesPending}
          isMutating={categoryMutations.isPending}
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
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <PairListCard
          title="Size & SQM"
          fields={[
            { key: 'size', label: 'Size', placeholder: 'e.g. 600 X 1200' },
            {
              key: 'sqm',
              label: 'SQM',
              // Free text, not a number: the live data uses '-' for products
              // that are not sold by area.
              placeholder: 'e.g. 1.44, or - if not applicable'
            }
          ]}
          rows={sizes}
          isPending={sizesPending}
          isMutating={sizeMutations.isPending}
          onCreate={(values) => sizeMutations.create({ size: values.size, sqm: values.sqm })}
          onUpdate={(id, values) =>
            sizeMutations.update(id, { size: values.size, sqm: values.sqm })
          }
          onDelete={sizeMutations.remove}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <DropdownListCard category="unit_type" title="Unit Type" placeholder="e.g. BOX" />
        <DropdownListCard
          category="marks_nos"
          title="Marks & Nos"
          description="Container descriptors offered on the invoice form."
          placeholder="e.g. FCL"
        />
      </div>
    </div>
  )
}
