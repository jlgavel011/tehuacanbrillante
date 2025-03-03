"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowLeft, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

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
  paros?: {
    id: string;
    tipoParoId: string;
    tipoParo: {
      id: string;
      nombre: string;
    };
    tiempoMinutos: number;
    descripcion?: string;
    fechaRegistro: string;
  }[];
};

export default function ProductionSummaryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/production-orders/${params.id}?includeStops=true`);
        
        if (!response.ok) {
          throw new Error("Error al obtener la información de la orden");
        }
        
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err instanceof Error ? err.message : "Error al obtener la información de la orden");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [params.id]);

  const handleBack = () => {
    router.push("/production-chief?tab=search");
  };

  const calculateEfficiency = () => {
    if (!order || !order.producto.velocidadProduccion) return 0;
    
    // Calculate total production time in hours (excluding stops)
    const totalStopMinutes = order.paros?.reduce((total, paro) => total + paro.tiempoMinutos, 0) || 0;
    const totalProductionHours = 8 - (totalStopMinutes / 60); // Assuming 8-hour shift
    
    // Calculate theoretical production
    const theoreticalProduction = order.producto.velocidadProduccion * totalProductionHours;
    
    // Calculate efficiency
    return Math.round((order.cajasProducidas / theoreticalProduction) * 100);
  };

  const calculateTotalStopTime = () => {
    if (!order || !order.paros) return 0;
    return order.paros.reduce((total, paro) => total + paro.tiempoMinutos, 0);
  };

  const getStopsByType = () => {
    if (!order || !order.paros) return {};
    
    const stopsByType: Record<string, number> = {};
    
    order.paros.forEach(paro => {
      const tipoNombre = paro.tipoParo.nombre;
      if (!stopsByType[tipoNombre]) {
        stopsByType[tipoNombre] = 0;
      }
      stopsByType[tipoNombre] += paro.tiempoMinutos;
    });
    
    return stopsByType;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando información de la orden...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!order) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No se encontró la orden</AlertTitle>
        <AlertDescription>
          No se ha encontrado la orden de producción solicitada.
        </AlertDescription>
      </Alert>
    );
  }

  const stopsByType = getStopsByType();
  const totalStopMinutes = calculateTotalStopTime();
  const efficiency = calculateEfficiency();
  const progressPercentage = Math.min(Math.round((order.cajasProducidas / order.cajasPlanificadas) * 100), 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        
        <Badge variant="secondary">
          Orden #{order.numeroOrden}
        </Badge>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Producción</CardTitle>
          <CardDescription>
            Línea: {order.lineaProduccion.nombre} | Producto: {order.producto.nombre} | Turno: {order.turno}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Producción</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <span className="text-sm text-muted-foreground">Cajas Planificadas</span>
                <p className="text-2xl font-bold">{order.cajasPlanificadas}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <span className="text-sm text-muted-foreground">Cajas Producidas</span>
                <p className="text-2xl font-bold">{order.cajasProducidas}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Cumplimiento</span>
                <span className="text-sm">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-2">Eficiencia</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <span className="text-sm text-muted-foreground">Eficiencia</span>
                <p className="text-2xl font-bold">{efficiency}%</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <span className="text-sm text-muted-foreground">Tiempo Total de Paros</span>
                <p className="text-2xl font-bold">{formatTime(totalStopMinutes)}</p>
              </div>
            </div>
          </div>
          
          {Object.keys(stopsByType).length > 0 && (
            <>
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Paros por Tipo</h3>
                <div className="space-y-3">
                  {Object.entries(stopsByType).map(([tipo, minutos]) => (
                    <div key={tipo} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>{tipo}</span>
                      </div>
                      <Badge variant="outline">{formatTime(minutos)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {progressPercentage < 90 && (
            <>
              <Separator />
              
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Producción por debajo de lo planificado</AlertTitle>
                <AlertDescription>
                  La producción alcanzó solo el {progressPercentage}% de lo planificado.
                  {totalStopMinutes > 0 && ` Se registraron ${formatTime(totalStopMinutes)} de paros.`}
                </AlertDescription>
              </Alert>
            </>
          )}
          
          {progressPercentage >= 90 && (
            <>
              <Separator />
              
              <Alert variant="success" className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-700">Buen desempeño</AlertTitle>
                <AlertDescription className="text-green-600">
                  La producción alcanzó el {progressPercentage}% de lo planificado.
                  {efficiency >= 90 && ` Con una eficiencia del ${efficiency}%.`}
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => router.push(`/production-chief/stops/${order.id}`)} 
            variant="outline" 
            className="w-full"
          >
            Ver Detalle de Paros
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 