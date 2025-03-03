"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderSearch } from "@/components/production-chief/order-search";
import { ProductionStatus } from "@/components/production-chief/production-status";

export default function ProductionChiefPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const tab = searchParams.get("tab") || "search";

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Portal del Jefe de Producción</h1>
        <p className="text-muted-foreground">
          Gestione órdenes de producción, registre cajas producidas y documente paros de producción.
        </p>
      </div>

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Buscar Orden</TabsTrigger>
          <TabsTrigger value="production">Gestión de Producción</TabsTrigger>
        </TabsList>
        <TabsContent value="search" className="mt-4">
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
        </TabsContent>
        <TabsContent value="production" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Producción</CardTitle>
              <CardDescription>
                Actualice el estado de la producción y registre paros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductionStatus />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 