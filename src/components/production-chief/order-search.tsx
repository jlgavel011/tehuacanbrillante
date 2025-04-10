"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Search, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

const orderSearchSchema = z.object({
  orderNumber: z.string().min(1, {
    message: "El número de orden es requerido",
  }).refine((val) => !isNaN(Number(val)), {
    message: "El número de orden debe ser un número válido",
  }),
});

type OrderSearchFormValues = z.infer<typeof orderSearchSchema>;

type ProductionOrder = {
  id: string;
  numeroOrden: number;
  cajasPlanificadas: number;
  cajasProducidas: number;
  fechaProduccion: string;
  turno: number;
  lineaProduccion: {
    id: string;
    nombre: string;
  };
  producto: {
    id: string;
    nombre: string;
    velocidadProduccion?: number;
  };
  estado?: "pendiente" | "en_progreso" | "completada";
};

export function OrderSearch() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<ProductionOrder | null>(null);

  const form = useForm<OrderSearchFormValues>({
    resolver: zodResolver(orderSearchSchema),
    defaultValues: {
      orderNumber: "",
    },
  });

  async function onSubmit(data: OrderSearchFormValues) {
    setIsLoading(true);
    setError(null);
    setOrder(null);
    
    try {
      // Convert to number for the API call
      const orderNumber = parseInt(data.orderNumber);
      
      console.log("Searching for order number:", orderNumber);
      
      // Fetch the production order
      const response = await fetch(`/api/production-orders/by-number/${orderNumber}`);
      
      if (!response.ok) {
        console.error("Error response:", response.status, response.statusText);
        if (response.status === 404) {
          throw new Error("Orden de producción no encontrada");
        }
        throw new Error("Error al buscar la orden de producción");
      }
      
      const orderData = await response.json();
      console.log("Order found:", orderData);
      
      // Set the order data to display it
      setOrder(orderData);
    } catch (err) {
      console.error("Error searching for order:", err);
      setError(err instanceof Error ? err.message : "Error al buscar la orden de producción");
    } finally {
      setIsLoading(false);
    }
  }

  function handleManageProduction() {
    if (order) {
      // Usar window.location para forzar recarga completa de la página
      window.location.href = `/production-chief?orderId=${order.id}&t=${Date.now()}`;
      
      // Mantener router.push como fallback
      // router.push(`/production-chief?orderId=${order.id}`);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <FormField
              control={form.control}
              name="orderNumber"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Número de Orden</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. 2212" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="mt-8" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
      
      {!order && !isLoading && !error && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Instrucciones:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Ingrese el número de orden de producción</li>
                <li>Haga clic en "Buscar" para ver los detalles</li>
                <li>Una vez encontrada, podrá gestionar la producción</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
      
      {order && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Orden #{order.numeroOrden}</CardTitle>
                <CardDescription>
                  Línea: {order.lineaProduccion.nombre}
                </CardDescription>
              </div>
              <Badge variant={
                order.estado === "completada" ? "secondary" :
                order.estado === "en_progreso" ? "default" : "outline"
              }>
                {order.estado === "completada" ? "Completada" :
                 order.estado === "en_progreso" ? "En Progreso" : "Pendiente"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Producto</Label>
                <p className="text-sm font-medium">{order.producto.nombre}</p>
              </div>
              <div>
                <Label>Turno</Label>
                <p className="text-sm font-medium">{order.turno}</p>
              </div>
              <div>
                <Label>Fecha</Label>
                <p className="text-sm font-medium">
                  {new Date(order.fechaProduccion).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label>Velocidad</Label>
                <p className="text-sm font-medium">
                  {order.producto.velocidadProduccion 
                    ? `${order.producto.velocidadProduccion} cajas/hora` 
                    : "No definida"}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Label>Cajas</Label>
              <div className="flex justify-between mt-1">
                <p className="text-sm">
                  <span className="font-medium">{order.cajasProducidas}</span> producidas
                </p>
                <p className="text-sm">
                  <span className="font-medium">{order.cajasPlanificadas}</span> planificadas
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleManageProduction} 
              className="w-full"
            >
              Gestionar Producción
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 