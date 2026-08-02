import { useState } from 'react'
import {
  Building2,
  FileCheck,
  Factory,
  Info,
  Package,
  Ship,
  type LucideIcon
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { ArnSection } from './ArnSection'
import { ExporterSection } from './ExporterSection'
import { ShippingSection } from './ShippingSection'
import { SupplierSection } from './SupplierSection'
import { TableInfoSection } from './TableInfoSection'

interface Section {
  id: string
  label: string
  summary: string
  icon: LucideIcon
  Component: () => JSX.Element
}

/**
 * Named for what they hold rather than for the box they fill on a document.
 * "Table Information" and "ARN & Declaration" told the client nothing about
 * which of the five to open.
 */
const SECTIONS: Section[] = [
  {
    id: 'exporter',
    label: 'Companies',
    summary: 'Who you invoice as, and the letterheads printed on the documents',
    icon: Building2,
    Component: ExporterSection
  },
  {
    id: 'shipping',
    label: 'Ports and destinations',
    summary: 'The places offered in the shipment section of an invoice',
    icon: Ship,
    Component: ShippingSection
  },
  {
    id: 'table',
    label: 'Products and sizes',
    summary: 'Product types with their HSN codes, sizes and units',
    icon: Package,
    Component: TableInfoSection
  },
  {
    id: 'supplier',
    label: 'Suppliers',
    summary: 'The factories the goods come from',
    icon: Factory,
    Component: SupplierSection
  },
  {
    id: 'arn',
    label: 'Tax declaration',
    summary: 'The ARN and GST wording repeated on every invoice',
    icon: FileCheck,
    Component: ArnSection
  }
]

/**
 * Settings, as a list down the side.
 *
 * Five tab strips across the top left no room for anything but the names, and
 * the names alone were not enough to tell them apart. Down the side each one
 * gets a line saying what it holds, which is what someone opening this screen
 * for the first time actually needs.
 */
export const AdminPanel = (): JSX.Element => {
  const [active, setActive] = useState(SECTIONS[0].id)
  const current = SECTIONS.find((section) => section.id === active) ?? SECTIONS[0]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          The lists the invoice form fills itself in from.
        </p>
      </header>

      <p className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          You do not have to come here first. Anything on these lists can also be added from the
          invoice form itself, using the <strong>Add</strong> line at the bottom of each dropdown.
          This screen is for tidying up afterwards — renaming, correcting and removing.
        </span>
      </p>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <nav aria-label="Settings sections">
          <ul className="space-y-1">
            {SECTIONS.map((section) => {
              const selected = section.id === active
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    aria-current={selected ? 'page' : undefined}
                    onClick={() => setActive(section.id)}
                    className={cn(
                      'flex w-full gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-transparent bg-white hover:border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <section.icon
                      className={cn(
                        'mt-0.5 h-5 w-5 shrink-0',
                        selected ? 'text-primary-foreground' : 'text-gray-400'
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{section.label}</span>
                      <span
                        className={cn(
                          'mt-0.5 block text-xs',
                          selected ? 'text-primary-foreground/70' : 'text-gray-500'
                        )}
                      >
                        {section.summary}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0">
          <current.Component />
        </div>
      </div>
    </div>
  )
}
