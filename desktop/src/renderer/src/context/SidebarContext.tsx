import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface SidebarContextValue {
  collapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

export const SidebarProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [collapsed, setCollapsed] = useState(false)

  const toggleSidebar = useCallback(() => setCollapsed((value) => !value), [])
  const value = useMemo(() => ({ collapsed, toggleSidebar }), [collapsed, toggleSidebar])

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export const useSidebar = (): SidebarContextValue => {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider')
  return context
}
