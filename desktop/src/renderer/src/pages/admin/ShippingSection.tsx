import { Card, CardContent } from '@/components/ui/card'
import { DropdownListCard } from '@/components/admin/DropdownListCard'
import { PairListCard } from '@/components/admin/PairListCard'
import { SectionHeader } from '@/components/admin/SectionHeader'
import { useMasterList, useMasterMutations } from '@/hooks/useMaster'

/**
 * Places offered in the shipment section of an invoice. Category names match the
 * values already present in the imported dropdown_options table, so existing
 * entries appear immediately.
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
      <SectionHeader
        title="Ports and destinations"
        description="Everything offered in the shipment part of the invoice form. Removing an entry only takes it off the list — invoices already created keep the value they were saved with."
      />

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Where the goods are discharged
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Ports are stored together with the country they serve, so choosing a port on an invoice
            fills in the final destination.
          </p>
          <PairListCard
            title="Port and destination"
            addLabel="Add a destination"
            fields={[
              {
                key: 'portOfDischarge',
                label: 'Port of discharge',
                placeholder: 'e.g. NEW YORK'
              },
              {
                key: 'finalDestination',
                label: 'Final destination',
                placeholder: 'e.g. USA'
              }
            ]}
            rows={destinations}
            isPending={isPending}
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <DropdownListCard
            category="place_of_receipt"
            title="Place of receipt"
            description="Where the shipping line takes charge of the goods."
            placeholder="e.g. MORBI"
          />
          <DropdownListCard
            category="port_of_loading"
            title="Port of loading"
            description="Where the container is put on the vessel."
            placeholder="e.g. MUNDRA"
          />
          <DropdownListCard
            category="country_of_origin"
            title="Country of origin"
            description="Where the goods were made."
            placeholder="e.g. INDIA"
          />
          <DropdownListCard
            category="country_of_final_destination"
            title="Country of final destination"
            description="Where the goods end up."
            placeholder="e.g. OMAN"
          />
        </CardContent>
      </Card>
    </div>
  )
}
