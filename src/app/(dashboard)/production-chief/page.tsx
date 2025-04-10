"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderSearch } from "@/components/production-chief/order-search";
import { ProductionStatus } from "@/components/production-chief/production-status";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ArrowLeft } from "lucide-react";
import { StopwatchBubble } from "@/components/production-chief/stopwatch-bubble";

export default function ProductionChiefPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams ? searchParams.get("orderId") : null;
  const isReopened = searchParams ? searchParams.get("reopened") === "true" : false;
  const [isProductionActive, setIsProductionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle production state changes
  const handleProductionStateChange = (isActive: boolean) => {
    setIsProductionActive(isActive);
  };

  // Regresar a la pantalla de búsqueda de órdenes
  const handleBackClick = () => {
    router.push("/production-chief");
  };

  // Simular tiempo de carga al iniciar la página
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Mostrar la pantalla de carga por 2 segundos
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Accediendo al portal del Jefe de Producción" />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Jefe de Producción</h1>
          {orderId && !isReopened && (
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