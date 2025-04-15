import React from "react";
import { NavLink } from "react-router-dom";
import { 
  Building, 
  Users, 
  Package, 
  Ship, 
  Home,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Sidebar: React.FC = () => {
  const navItems = [
    { name: "Dashboard", icon: Home, path: "/" },
    { name: "Company Profile", icon: Building, path: "/company" },
    { name: "Products", icon: Package, path: "/products" },
    { name: "Shipping Terms", icon: Ship, path: "/shipping" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col relative h-screen">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary">Invoice Generator</h1>
        <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
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
                      : "text-gray-700"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-5 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Invoice Generator Admin
        </div>
      </div>
    </div>
  );
};
