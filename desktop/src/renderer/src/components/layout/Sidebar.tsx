import { NavLink, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  DatabaseBackup,
  FilePlus2,
  Home,
  LogOut,
  Settings,
  type LucideIcon
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import { applyIpcError } from '@/lib/form'

interface NavItem {
  name: string
  icon: LucideIcon
  path: string
  adminOnly?: boolean
}

/**
 * The web sidebar had every entry except Dashboard commented out, so /backup
 * was reachable only by typing the URL. A desktop window has no address bar,
 * which would leave backup and restore unreachable — the entries are restored
 * here. Styling is unchanged.
 */
const navItems: NavItem[] = [
  { name: 'Dashboard', icon: Home, path: '/' },
  { name: 'New Invoice', icon: FilePlus2, path: '/invoice' },
  { name: 'Backup', icon: DatabaseBackup, path: '/backup' },
  { name: 'Admin Panel', icon: Settings, path: '/admin', adminOnly: true }
]

export const Sidebar = (): JSX.Element => {
  const { collapsed, toggleSidebar } = useSidebar()
  const { isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

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
        'bg-white border-r border-gray-200 flex flex-col relative h-screen transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-primary">Invoice Gen</h1>
            <p className="text-xs text-gray-500">System Dashboard</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn('rounded-full', collapsed ? 'mx-auto' : '')}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto pt-5 pb-4">
        <ul className="space-y-1 px-2">
          {visibleItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center text-sm gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors',
                    isActive ? 'bg-primary text-white hover:bg-primary/90' : 'text-gray-700',
                    collapsed ? 'justify-center' : ''
                  )
                }
                title={collapsed ? item.name : ''}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-4">
        {!collapsed && user && (
          <div className="mb-2 text-xs text-gray-500 truncate" title={user.email}>
            Signed in as <span className="font-medium text-gray-700">{user.name}</span>
          </div>
        )}

        <Button
          variant="ghost"
          className={cn(
            'flex items-center gap-2 w-full text-red-500 hover:text-red-700 hover:bg-red-50',
            collapsed ? 'justify-center' : ''
          )}
          onClick={() => void handleLogout()}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </Button>

        {!collapsed && (
          <div className="text-xs text-gray-500 mt-4 text-center">
            &copy; {new Date().getFullYear()} Invoice Generator
          </div>
        )}
      </div>
    </div>
  )
}
