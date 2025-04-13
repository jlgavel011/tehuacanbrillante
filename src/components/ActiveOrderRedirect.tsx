"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ActiveOrderRedirect() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // No verificar en estas rutas
    const excludedPaths = [
      '/auth',
      '/login',
      '/production-chief',
      '/production-chief/stops',
      '/production-chief/summary'
    ];
    
    // Comprobar si estamos en una ruta excluida
    const isExcludedPath = excludedPaths.some(path => pathname.includes(path));
    
    // No verificar en páginas de autenticación, en la pantalla principal de jefe de producción,
    // o si ya estamos en una página de gestión de orden con un orderId
    if (isExcludedPath || (pathname.includes('/production-chief') && window.location.search.includes('orderId='))) {
      setIsChecking(false);
      return;
    }

    const checkActiveOrder = async () => {
      try {
        const response = await fetch('/api/user/active-order');
        
        if (!response.ok) {
          console.error("Error checking active order, status:", response.status);
          setIsChecking(false);
          return;
        }
        
        const data = await response.json();
        
        if (data.hasActiveOrder && data.activeOrder) {
          // Si el usuario tiene una orden activa, mostrar mensaje y redirigir
          toast.info(`Tienes una orden de producción activa (#${data.activeOrder.numeroOrden}). Serás redirigido.`);
          
          // Usar window.location para asegurar una recarga completa
          setTimeout(() => {
            window.location.href = `/production-chief?orderId=${data.activeOrder.id}&t=${Date.now()}`;
          }, 1500);
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Error checking active order:", error);
        setIsChecking(false);
      }
    };

    // Pequeño retraso para evitar múltiples comprobaciones en navegación rápida
    const timer = setTimeout(() => {
      checkActiveOrder();
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, router]);

  // No mostrar nada mientras se está verificando en rutas excluidas
  if (!isChecking || pathname.includes('/auth') || pathname.includes('/login')) {
    return null;
  }

  // Mostrar un indicador de carga mientras se verifica
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verificando órdenes activas...</p>
      </div>
    </div>
  );
} 