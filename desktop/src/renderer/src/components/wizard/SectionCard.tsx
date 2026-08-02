import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * One block of the form, with a sentence saying what it is for.
 *
 * The old steps were a stack of unlabelled cards headed "Package & totals" and
 * "Marks & numbers", which name the box on the printed document rather than
 * telling anyone what to put in it.
 */
export const SectionCard = ({
  title,
  description,
  action,
  className,
  children
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}): JSX.Element => (
  <Card className={cn('overflow-hidden', className)}>
    <div className="flex items-start justify-between gap-4 border-b bg-gray-50/80 px-6 py-4">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    <CardContent className="p-6">{children}</CardContent>
  </Card>
)

/** The standard two- and three-column grids the sections lay out on. */
export const FieldGrid = ({
  columns = 3,
  className,
  children
}: {
  columns?: 1 | 2 | 3 | 4
  className?: string
  children: ReactNode
}): JSX.Element => (
  <div
    className={cn(
      'grid grid-cols-1 gap-x-4 gap-y-5',
      columns === 2 && 'md:grid-cols-2',
      columns === 3 && 'md:grid-cols-2 lg:grid-cols-3',
      columns === 4 && 'md:grid-cols-2 lg:grid-cols-4',
      className
    )}
  >
    {children}
  </div>
)
