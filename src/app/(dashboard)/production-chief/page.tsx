"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderSearch } from "@/components/production-chief/order-search";
import { ProductionStatus } from "@/components/production-chief/production-status";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { StopwatchBubble } from "@/components/production-chief/stopwatch-bubble";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProductionChiefPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams ? searchParams.get("orderId") : null;
  const isReopened = searchParams ? searchParams.get("reopened") === "true" : false;
  const [isProductionActive, setIsProductionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [hasCheckedActiveOrder, setHasCheckedActiveOrder] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);

  // Verificar si el usuario tiene una orden activa
  useEffect(() => {
    const checkActiveOrder = async () => {
      try {
        // Si ya hay un orderId en la URL, no es necesario verificar
        if (orderId) {
          setHasCheckedActiveOrder(true);
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/user/active-order');
        
        if (!response.ok) {
          setHasCheckedActiveOrder(true);
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        
        if (data.hasActiveOrder && data.activeOrder) {
          setActiveOrder(data.activeOrder);
          // Redirigir automáticamente después de un breve retraso
          setTimeout(() => {
            router.push(`/production-chief?orderId=${data.activeOrder.id}&t=${Date.now()}`);
          }, 1500);
        }
        
        setHasCheckedActiveOrder(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking active order:", error);
        setHasCheckedActiveOrder(true);
        setIsLoading(false);
      }
    };

    checkActiveOrder();
  }, [orderId, router]);

  // Verificar el estado de la orden para decidir si mostrar el botón de regresar
  useEffect(() => {
    if (!orderId) return;

    const checkOrderStatus = async () => {
      try {
        const response = await fetch(`/api/production-orders/${orderId}`);
        
        if (!response.ok) {
          // Si hay error, mostramos el botón por defecto
          setShowBackButton(true);
          return;
        }
        
        const orderData = await response.json();
        
        // Solo mostrar el botón de regresar si la orden NO está en progreso
        setShowBackButton(orderData.estado !== "en_progreso");
      } catch (error) {
        console.error("Error checking order status:", error);
        // En caso de error, mostramos el botón por defecto
        setShowBackButton(true);
      }
    };

    checkOrderStatus();
  }, [orderId]);

  // Handle production state changes
  const handleProductionStateChange = (isActive: boolean) => {
    setIsProductionActive(isActive);
  };

  // Función para volver a la búsqueda
  const handleBackClick = () => {
    window.location.href = "/production-chief";
  };

  // Simular tiempo de carga al iniciar la página
  useEffect(() => {
    // Solo mostrar pantalla de carga si no estamos esperando por la verificación de orden activa
    if (hasCheckedActiveOrder) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000); // Mostrar la pantalla de carga por 1 segundo
      
      return () => clearTimeout(timer);
    }
  }, [hasCheckedActiveOrder]);

  if (isLoading) {
    return <LoadingScreen message="Accediendo al portal del Jefe de Producción" />;
  }

  // Si hay una orden activa pero no estamos en ella, mostrar mensaje
  if (activeOrder && !orderId) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Orden activa detectada</AlertTitle>
          <AlertDescription>
            Tienes la orden #{activeOrder.numeroOrden} activa.
            Serás redirigido automáticamente...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Jefe de Producción</h1>
          {orderId && showBackButton && (
            <Button
              variant="outline"
              size="sm"
              className="ml-2 flex items-center gap-1"
              onClick={handleBackClick}
            >
              <ArrowLeft className="h-4 w-4" />
              Regresar a búsqueda
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <ProductionStatus
          onProductionStateChange={handleProductionStateChange}
        />
      </div>
      
      {/* Cronómetro flotante para el jefe de producción - solo visible cuando hay una orden seleccionada */}
      {orderId && <StopwatchBubble />}
    </div>
  );
} 