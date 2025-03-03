"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ClipboardList,
  Factory,
  BarChart2,
  Settings,
  LogOut,
  Users,
  Package,
  ChevronLeft,
  ChevronRight,
  Hammer,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/lib/context/SidebarContext";
import { useEffect, useState } from "react";
import Image from "next/image";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Visión general de la plataforma" },
  { name: "Órdenes de Producción", href: "/production-orders", icon: ClipboardList, description: "Gestionar órdenes de producción" },
  { name: "Líneas de Producción", href: "/production-lines", icon: Factory, description: "Monitorear líneas de producción" },
  { name: "Productos", href: "/productos", icon: Package, description: "Gestionar productos" },
  { name: "Analítica", href: "/analytics", icon: BarChart2, description: "Ver analítica y reportes" },
  { name: "Portal Jefe de Producción", href: "/production-chief", icon: Hammer, description: "Portal para gestionar la producción y registrar paros", roles: ["PRODUCTION_CHIEF"] },
];

const secondaryNavigation = [
  { name: "Configuración", href: "/configuration", icon: Settings, description: "Configurar preferencias del sistema" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarOpen, closeSidebar, toggleSidebar } = useSidebar();
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key to close sidebar on mobile
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen && window.innerWidth < 768) {
        closeSidebar();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [sidebarOpen, closeSidebar]);

  if (!mounted) {
    return null;
  }

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    // If user is PRODUCTION_CHIEF, only show the Portal Jefe de Producción
    if (session?.user?.role === "PRODUCTION_CHIEF") {
      return item.roles?.includes("PRODUCTION_CHIEF");
    }
    
    // For other roles, if no roles specified, show to everyone
    if (!item.roles) return true;
    
    // If roles specified, check if user has one of those roles
    return item.roles.includes(session?.user?.role as string);
  });

  return (
    <>
      {/* Backdrop for mobile - shows when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-all duration-300 ease-in-out" 
          onClick={closeSidebar}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}
      
      {/* Sidebar */}
      <div 
        data-sidebar
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 shadow-md transition-all duration-300 ease-in-out",
          sidebarOpen 
            ? "translate-x-0 w-64" 
            : "-translate-x-full md:translate-x-0 md:w-20"
        )}
      >
        {/* Toggle button positioned on the right edge of the sidebar */}
        <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white border border-gray-200 shadow-md hover:bg-gray-100 focus:ring-2 focus:ring-primary transition-transform duration-200 hover:scale-110"
                  onClick={toggleSidebar}
                  aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                  {sidebarOpen ? (
                    <ChevronLeft className="h-4 w-4 text-black transition-transform duration-300" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-black transition-transform duration-300" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-white text-black border border-gray-200">
                <p>{sidebarOpen ? "Contraer menú" : "Expandir menú"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex h-16 shrink-0 items-center px-4 sm:px-6">
          <div className={`flex items-center ${!sidebarOpen ? "justify-center w-full" : ""}`}>
            <div className={`${!sidebarOpen ? "flex justify-center items-center w-full pl-0.5" : "pl-1.5"}`}>
              <Image 
                src="/dimond.svg" 
                alt="Tehuacán Brillante Logo" 
                width={sidebarOpen ? 22 : 24} 
                height={sidebarOpen ? 19 : 20} 
                className="flex-shrink-0 transition-all duration-300 hover:opacity-80"
              />
            </div>
            {sidebarOpen && (
              <>
                <span className="font-semibold text-base text-primary truncate ml-3">Tehuacán Brillante</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <div className="flex-1 space-y-1 px-4">
            {filteredNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <TooltipProvider key={item.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary border-l-4 border-primary"
                            : "text-black hover:bg-gray-100 hover:text-primary border-l-4 border-transparent",
                          !sidebarOpen && "justify-center px-2"
                        )}
                        onClick={() => {
                          // Close sidebar on mobile when a link is clicked
                          if (window.innerWidth < 768) {
                            closeSidebar();
                          }
                        }}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-black", sidebarOpen && "mr-3")} />
                        {sidebarOpen && <span>{item.name}</span>}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-white text-black border border-gray-200">
                      <p>{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}

            {(session?.user?.role === "MASTER_ADMIN" || session?.user?.role === "MANAGER") && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/users"
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === "/users"
                          ? "bg-primary/10 text-primary border-l-4 border-primary"
                          : "text-black hover:bg-gray-100 hover:text-primary border-l-4 border-transparent",
                        !sidebarOpen && "justify-center px-2"
                      )}
                      onClick={() => {
                        // Close sidebar on mobile when a link is clicked
                        if (window.innerWidth < 768) {
                          closeSidebar();
                        }
                      }}
                      aria-current={pathname === "/users" ? "page" : undefined}
                    >
                      <Users className={cn("h-5 w-5", pathname === "/users" ? "text-primary" : "text-black", sidebarOpen && "mr-3")} />
                      {sidebarOpen && <span>Usuarios</span>}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-white text-black border border-gray-200">
                    <p>Administrar usuarios del sistema</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="mt-5 px-4 space-y-1">
            {session?.user?.role !== "PRODUCTION_CHIEF" && (
              <div className="pt-4 border-t border-gray-200">
                {secondaryNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <TooltipProvider key={item.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary border-l-4 border-primary"
                                : "text-black hover:bg-gray-100 hover:text-primary border-l-4 border-transparent",
                              !sidebarOpen && "justify-center px-2"
                            )}
                            onClick={() => {
                              // Close sidebar on mobile when a link is clicked
                              if (window.innerWidth < 768) {
                                closeSidebar();
                              }
                            }}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-black", sidebarOpen && "mr-3")} />
                            {sidebarOpen && <span>{item.name}</span>}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-white text-black border border-gray-200">
                          <p>{item.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 p-4">
          {sidebarOpen ? (
            <>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                    {session?.user?.name?.[0] || "U"}
                  </div>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">{session?.user?.name || "Usuario"}</div>
                  <div className="truncate text-xs text-gray-500">{session?.user?.email || ""}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                className="mt-3 w-full justify-start text-sm text-gray-600 hover:text-gray-900"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full h-10 flex justify-center"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-5 w-5 text-gray-600 hover:text-gray-900" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-white text-black border border-gray-200">
                  <p>Cerrar sesión</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </>
  );
} 