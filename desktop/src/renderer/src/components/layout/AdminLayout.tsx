import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'

/**
 * Same two-pane shell as the web app, but the content pane owns the scroll
 * instead of the page body — a desktop window should never scroll as a whole.
 */
export const AdminLayout = ({ children }: { children: ReactNode }): JSX.Element => (
  <div className="h-screen bg-gray-50 flex overflow-hidden">
    <Sidebar />
    <div className={cn('flex-1 flex flex-col overflow-hidden')}>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  </div>
)
