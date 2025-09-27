
import React from "react";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useSidebar } from "@/context/SidebarContext";

interface AdminLayoutProps {
  children: any; // Using 'any' to avoid TypeScript errors
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { collapsed } = useSidebar();
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="fixed">
        <Sidebar />
      </div>
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
