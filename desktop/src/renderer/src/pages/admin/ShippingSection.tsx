import { DropdownListCard } from '@/components/admin/DropdownListCard'
import { PairListCard } from '@/components/admin/PairListCard'
import { useMasterList, useMasterMutations } from '@/hooks/useMaster'

/**
 * Shipping dropdowns. Category names match the values already present in the
 * imported dropdown_options table, so existing entries appear immediately.
 */
export const ShippingSection = (): JSX.Element => {
  const { data: destinations = [], isPending } = useMasterList('countryOption')
  const mutations = useMasterMutations('countryOption', {
    created: 'Destination added',
    updated: 'Destination updated',
    removed: 'Destination removed'
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Shipping Details Management</h2>
      </div>

      <div className="bg-[#edf6f9] rounded-lg shadow overflow-hidden p-4 border border-[#edf6f9]">
        <h3 className="font-bold text-lg mb-4 uppercase text-amber-900">Shipping Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DropdownListCard
            category="place_of_receipt"
            title="Place of Receipt"
            placeholder="e.g. MORBI"
          />
          <DropdownListCard
            category="port_of_loading"
            title="Port of Loading"
            placeholder="e.g. MUNDRA"
          />
          <DropdownListCard
            category="country_of_final_destination"
            title="Country of Final Destination"
            placeholder="e.g. OMAN"
          />
          <DropdownListCard
            category="country_of_origin"
            title="Country of Origin"
            placeholder="e.g. INDIA"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <PairListCard
          title="Port of Discharge & Final Destination"
          fields={[
            {
              key: 'portOfDischarge',
              label: 'Port of Discharge',
              placeholder: 'e.g. NEW YORK'
            },
            {
              key: 'finalDestination',
              label: 'Final Destination',
              placeholder: 'e.g. USA'
            }
          ]}
          rows={destinations}
          isPending={isPending}
          isMutating={mutations.isPending}
          onCreate={(values) =>
            mutations.create({
              portOfDischarge: values.portOfDischarge,
              finalDestination: values.finalDestination,
              isActive: true
            })
          }
          onUpdate={(id, values) =>
            mutations.update(id, {
              portOfDischarge: values.portOfDischarge,
              finalDestination: values.finalDestination,
              isActive: true
            })
          }
          onDelete={mutations.remove}
        />
      </div>
    </div>
  )
}
