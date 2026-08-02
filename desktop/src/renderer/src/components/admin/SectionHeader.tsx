import type { ReactNode } from 'react'

/**
 * The heading each settings section opens with. The description is the point:
 * it says what the list is used for and what changing it affects, which is the
 * question someone hesitates over before touching anything here.
 */
export const SectionHeader = ({
  title,
  description,
  action
}: {
  title: string
  description: string
  action?: ReactNode
}): JSX.Element => (
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
)
