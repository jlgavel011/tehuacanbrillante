"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  Menu, 
  X, 
  User,
  Settings,
  LogOut,
  PanelLeft
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/lib/context/SidebarContext";

export function Header() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { sidebarOpen, toggleSidebar } = useSidebar();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Get the first letter of the user's name for the avatar fallback
  const getInitials = () => {
    if (!session?.user?.name) return "TB";
    return session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2 text-black hover:bg-gray-100 focus:ring-2 focus:ring-primary"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-black" />
              ) : (
                <Menu className="h-6 w-6 text-black" />
              )}
            </Button>

            {/* Sidebar toggle button - visible on all screens */}
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 text-black hover:bg-gray-100 focus:ring-2 focus:ring-primary"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Cerrar barra lateral" : "Abrir barra lateral"}
            >
              <PanelLeft className={`h-6 w-6 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            <div className="md:hidden flex items-center ml-2">
              <span className="w-2 h-8 bg-primary rounded-l-md mr-2"></span>
              <span className="font-semibold text-lg text-black">Tehuacán Brillante</span>
            </div>
          </div>

          <div className={`flex-1 flex items-center justify-end ${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300`}>
            <div className="mr-4 hidden md:block">
              <div className="bg-primary/10 px-4 py-1.5 rounded-full text-black text-sm font-medium">
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline"
                      size="icon" 
                      className="relative bg-primary/10 border-primary/20 hover:bg-primary/20 text-black focus:ring-2 focus:ring-primary"
                      aria-label="Notificaciones"
                    >
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">3</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white text-black border border-gray-200">
                    <p>Notificaciones</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="relative h-10 px-2 border-gray-300 hover:bg-gray-100 focus:ring-2 focus:ring-primary"
                          aria-label="Menú de usuario"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border-2 border-primary">
                              <AvatarImage
                                src={session?.user?.image || ""}
                                alt={session?.user?.name || "Usuario"}
                              />
                              <AvatarFallback className="bg-primary text-white text-xs">{getInitials()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-black text-sm hidden sm:inline-block">{session?.user?.name}</span>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white text-black border border-gray-200">
                      <p>Perfil de usuario</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end" className="w-56 border-gray-300">
                  <DropdownMenuLabel className="flex flex-col gap-1 bg-white text-black rounded-t-md border-b border-gray-200">
                    <span className="font-medium">{session?.user?.name || "Usuario"}</span>
                    <span className="text-xs text-gray-600">{session?.user?.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 text-black hover:text-primary">
                    <User className="h-4 w-4" />
                    <span>Mi perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 text-black hover:text-primary">
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-black hover:bg-primary/10 hover:text-primary"
                    onClick={() =>
                      signOut({
                        callbackUrl: "/login",
                      })
                    }
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white text-black animate-in slide-in-from-top border-t-4 border-t-primary shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium bg-primary/20 text-black border-l-4 border-primary hover:bg-primary/30 transition-colors"
              aria-label="Ir al Dashboard"
            >
              Dashboard
            </a>
            <a
              href="/production-orders"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary/20 transition-colors border-l-4 border-transparent hover:border-primary/50 text-black"
              aria-label="Ir a Órdenes de Producción"
            >
              Órdenes de Producción
            </a>
            <a
              href="/production-lines"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary/20 transition-colors border-l-4 border-transparent hover:border-primary/50 text-black"
              aria-label="Ir a Líneas de Producción"
            >
              Líneas de Producción
            </a>
            <a
              href="/analytics"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary/20 transition-colors border-l-4 border-transparent hover:border-primary/50 text-black"
              aria-label="Ir a Analítica"
            >
              Analítica
            </a>
            {(session?.user?.role === "MASTER_ADMIN" ||
              session?.user?.role === "MANAGER") && (
              <a
                href="/users"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary/20 transition-colors border-l-4 border-transparent hover:border-primary/50 text-black"
                aria-label="Ir a Usuarios"
              >
                Usuarios
              </a>
            )}
            <a
              href="/settings"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary/20 transition-colors border-l-4 border-transparent hover:border-primary/50 text-black"
              aria-label="Ir a Configuración"
            >
              Configuración
            </a>
          </div>
        </div>
      )}
    </header>
  );
} 