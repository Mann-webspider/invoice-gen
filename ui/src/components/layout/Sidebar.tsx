import React from "react";
import { NavLink } from "react-router-dom";
import { 
  Building, 
  Users, 
  Package, 
  Ship, 
  Home,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/context/SidebarContext";
import api from "@/lib/axios";


export const Sidebar = () => {
  const { collapsed, toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    // Silent error handling for logout functionality
    try {
      // Clear any stored session/user data
      let res = await api.post("/logout",{})
      localStorage.removeItem('authToken');
      // You can add redirect to login page or other logout logic here
      window.location.href = '/login';
    } catch (error) {
      // Silent error handling
    }
  };
  
  const navItems = [
    { name: "Dashboard", icon: Home, path: "/" },
    // { name: "Company Profile", icon: Building, path: "/company" },
    { name: "Products", icon: Package, path: "/products" },
    // { name: "Shipping Terms", icon: Ship, path: "/shipping" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <div 
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col relative h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-primary">Invoice Gen</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className={cn("rounded-full", collapsed ? "mx-auto" : "")}>
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
      
      <nav className="flex-1 overflow-y-auto pt-5 pb-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center text-sm gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors",
                    isActive
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "text-gray-700",
                    collapsed ? "justify-center" : ""
                  )
                }
                title={collapsed ? item.name : ""}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="border-t border-gray-200 p-4">
        <Button 
          variant="ghost" 
          className={cn(
            "flex items-center gap-2 w-full text-red-500 hover:text-red-700 hover:bg-red-50",
            collapsed ? "justify-center" : ""
          )}
          onClick={handleLogout}
          title={collapsed ? "Logout" : ""}
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
  );
};
