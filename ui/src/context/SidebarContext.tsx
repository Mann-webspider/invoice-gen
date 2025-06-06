import React, { createContext, useContext, useState, useEffect } from 'react';

type SidebarContextType = {
  collapsed: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize from localStorage if available, otherwise default to false (expanded)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('sidebar_collapsed');
      return stored ? JSON.parse(stored) : false;
    } catch (error) {
      // Silent error handling
      return false;
    }
  });

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Save to localStorage whenever collapsed state changes
  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
    } catch (error) {
      // Silent error handling
    }
  }, [collapsed]);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
