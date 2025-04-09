import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Home, FileText, Server, Package, BarChart4, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavigationItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const navigation: NavigationItem[] = [
  {
    icon: <Home className="h-5 w-5" />,
    label: "Introducción",
    value: "introduction"
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: "Dashboard",
    value: "dashboard"
  },
  {
    icon: <Server className="h-5 w-5" />,
    label: "Órdenes",
    value: "orders"
  },
  {
    icon: <Server className="h-5 w-5" />,
    label: "Líneas de Producción",
    value: "production-lines"
  },
  {
    icon: <Package className="h-5 w-5" />,
    label: "Productos",
    value: "products"
  },
  {
    icon: <BarChart4 className="h-5 w-5" />,
    label: "Analítica",
    value: "analytics"
  },
  {
    icon: <Settings className="h-5 w-5" />,
    label: "Configuración",
    value: "settings"
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: "Preguntas Frecuentes",
    value: "faq"
  }
];

interface HelpCenterLayoutProps {
  children?: React.ReactNode;
  searchResults?: { title: string; content: string; module: string }[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function HelpCenterLayout({
  children,
  searchResults = [],
  searchQuery,
  onSearchQueryChange,
  onSearch,
  activeSection,
  onSectionChange
}: HelpCenterLayoutProps) {
  return (
    <div className="flex bg-slate-50 min-h-[calc(100vh-135px)]">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200 h-full">
          <div className="mt-1 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => (
                <Button
                  key={item.value}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 py-2 font-normal",
                    activeSection === item.value ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => onSectionChange(item.value)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full sm:max-w-lg lg:max-w-xs">
                <label htmlFor="search" className="sr-only">Buscar ayuda</label>
                <div className="relative text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5" />
                  </div>
                  <Input
                    id="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Buscar en el centro de ayuda..."
                    type="search"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSearch();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
              {searchQuery && searchResults.length > 0 ? (
                <div className="mb-8">
                  <h2 className="text-lg font-medium mb-4">Resultados de búsqueda para "{searchQuery}"</h2>
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <div 
                        key={index} 
                        className="p-4 bg-white border rounded-md shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                        onClick={() => onSectionChange(result.module)}
                      >
                        <h3 className="font-medium text-blue-600">{result.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{result.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              
              {/* Page content */}
              <div className="bg-white rounded-lg shadow p-6">
                <ScrollArea className="h-full">
                  {children}
                </ScrollArea>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 