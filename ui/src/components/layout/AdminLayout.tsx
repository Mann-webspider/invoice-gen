
import React from "react";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen  bg-gray-50 flex">
      <div className="fixed">

      <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      
    </div>
  );
};
