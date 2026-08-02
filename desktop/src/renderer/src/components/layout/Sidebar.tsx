import { NavLink, useNavigate } from 'react-router-dom'
import {
  DatabaseBackup,
  FilePlus2,
  LayoutList,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  type LucideIcon
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import { applyIpcError } from '@/lib/form'

interface NavItem {
  name: string
  hint: string
  icon: LucideIcon
  path: string
  adminOnly?: boolean
}

/**
 * The web sidebar had every entry except Dashboard commented out, so /backup
 * was reachable only by typing the URL. A desktop window has no address bar,
 * which would leave backup and restore unreachable — the entries are restored
 * here, each with a line saying what it does.
 */
const NAV_ITEMS: NavItem[] = [
  { name: 'Invoices', hint: 'Everything created so far', icon: LayoutList, path: '/' },
  { name: 'New invoice', hint: 'Start one, in four steps', icon: FilePlus2, path: '/invoice' },
  { name: 'Backup', hint: 'Save or restore your data', icon: DatabaseBackup, path: '/backup' },
  {
    name: 'Settings',
    hint: 'Companies, ports, products',
    icon: Settings,
    path: '/admin',
    adminOnly: true
  }
]

export const Sidebar = (): JSX.Element => {
  const { collapsed, toggleSidebar } = useSidebar()
  const { isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  const handleLogout = async (): Promise<void> => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      applyIpcError(error)
    }
  }

  return (
    <div
      className={cn(
        'relative flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-primary">Invoice Generator</h1>
            <p className="truncate text-xs text-gray-500">Export documents</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Show the menu labels' : 'Hide the menu labels'}
          className={cn('shrink-0 rounded-full', collapsed && 'mx-auto')}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const link = (
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100',
                    collapsed && 'justify-center'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && (
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.name}</span>
                        <span
                          className={cn(
                            'block truncate text-xs',
                            isActive ? 'text-primary-foreground/70' : 'text-gray-500'
                          )}
                        >
                          {item.hint}
                        </span>
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )

            return (
              <li key={item.name}>
                {/* A tooltip is the only label left once the sidebar is narrow. */}
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">
                      {item.name} — {item.hint}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-3">
        {!collapsed && user && (
          <div className="mb-2 px-1">
            <p className="truncate text-sm font-medium text-gray-900" title={user.email}>
              {user.name}
            </p>
            <p className="text-xs text-gray-500">{isAdmin ? 'Administrator' : 'Standard user'}</p>
          </div>
        )}

        <Button
          variant="ghost"
          className={cn(
            'w-full gap-2 text-red-500 hover:bg-red-50 hover:text-red-700',
            collapsed ? 'justify-center' : 'justify-start'
          )}
          onClick={() => void handleLogout()}
          aria-label="Sign out"
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </div>
    </div>
  )
}
