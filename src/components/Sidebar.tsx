import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Settings, Database, FileText, Users, Box, Zap, Edit } from "lucide-react";

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { name: "Inventory", path: "/inventory", icon: <Box size={20} /> },
    { name: "Clients", path: "/clients", icon: <Users size={20} /> },
    { name: "Invoices", path: "/invoices", icon: <FileText size={20} /> },
    { name: "Distribution Automatique", path: "/distribution-automatic", icon: <Zap size={20} /> },
    { name: "Distribution Manuelle", path: "/distribution-manual", icon: <Edit size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 h-full",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center justify-center w-full">
              <img 
                src="/lovable-uploads/a9383b11-0230-4bb3-9035-a4b8b46e50bb.png" 
                alt="ZAGAZ Logo" 
                className="h-12 w-auto" 
              />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100",
                    location.pathname === item.path && "bg-brand-lightGray text-brand-teal font-medium",
                    collapsed ? "justify-center" : ""
                  )}
                >
                  <span className="text-gray-500">{item.icon}</span>
                  {!collapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            className={cn(
              "w-full text-gray-700 hover:text-red-600",
              collapsed ? "px-2" : ""
            )}
            onClick={logout}
          >
            {collapsed ? "Out" : "Logout"}
          </Button>
        </div>
      </div>
    </div>
  );
}
