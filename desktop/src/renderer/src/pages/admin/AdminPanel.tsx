import { useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArnSection } from './ArnSection'
import { ExporterSection } from './ExporterSection'
import { ShippingSection } from './ShippingSection'
import { SupplierSection } from './SupplierSection'
import { TableInfoSection } from './TableInfoSection'

const sections = [
  { id: 'exporter', label: 'Exporter Section', Component: ExporterSection },
  { id: 'shipping', label: 'Shipping Details', Component: ShippingSection },
  { id: 'table', label: 'Table Information', Component: TableInfoSection },
  { id: 'supplier', label: 'Supplier Details', Component: SupplierSection },
  { id: 'arn', label: 'ARN & Declaration', Component: ArnSection }
] as const

export const AdminPanel = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<string>(sections[0].id)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Admin Panel"
        description="Manage your invoice system settings and configurations"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map(({ id, Component }) => (
          <TabsContent key={id} value={id} className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <Component />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
