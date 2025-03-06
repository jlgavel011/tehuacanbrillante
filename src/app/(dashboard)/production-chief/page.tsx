"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderSearch } from "@/components/production-chief/order-search";
import { ProductionStatus } from "@/components/production-chief/production-status";

export default function ProductionChiefPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [isProductionActive, setIsProductionActive] = useState(false);

  // Handle production state changes
  const handleProductionStateChange = (isActive: boolean) => {
    setIsProductionActive(isActive);
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Portal del Jefe de Producción</h1>
        <p className="text-muted-foreground">
          Gestione órdenes de producción, registre cajas producidas y documente paros de producción.
        </p>
      </div>

      {orderId ? (
        // Show production management when an order is selected
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Producción</CardTitle>
            <CardDescription>
              Actualice el estado de la producción y registre paros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductionStatus onProductionStateChange={handleProductionStateChange} />
          </CardContent>
        </Card>
      ) : (
        // Show order search when no order is selected
        <Card>
          <CardHeader>
            <CardTitle>Buscar Orden de Producción</CardTitle>
            <CardDescription>
              Ingrese el número de orden para ver los detalles de producción
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderSearch />
          </CardContent>
        </Card>
      )}
    </div>
  );
} 