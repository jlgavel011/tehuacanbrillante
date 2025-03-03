"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowLeft, Printer, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Paro = {
  id: string;
  tiempoMinutos: number;
  tipoParo: {
    id: string;
    nombre: string;
  };
  subsistema?: {
    id: string;
    nombre: string;
  };
  subsubsistema?: {
    id: string;
    nombre: string;
  };
  sistema?: {
    id: string;
    nombre: string;
  };
  descripcion?: string;
  fechaInicio: string;
  fechaFin?: string;
};

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
  paros: Paro[];
  estado?: "pendiente" | "en_progreso" | "completada";
};

interface ProductionSummaryProps {
  orderId: string;
}

export function ProductionSummary({ orderId }: ProductionSummaryProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  
  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/production-orders/${orderId}?include=paros`);
        
        if (!response.ok) {
          throw new Error("Error al cargar la orden de producción");
        }
        
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar la orden de producción");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId]);
  
  // Calculate summary statistics
  const calculateSummary = () => {
    if (!order) return null;
    
    // Group paros by type
    const parosByType = order.paros.reduce((acc, paro) => {
      const tipoNombre = paro.tipoParo.nombre;
      if (!acc[tipoNombre]) {
        acc[tipoNombre] = {
          count: 0,
          totalTime: 0,
          paros: [],
        };
      }
      
      acc[tipoNombre].count += 1;
      acc[tipoNombre].totalTime += paro.tiempoMinutos;
      acc[tipoNombre].paros.push(paro);
      
      return acc;
    }, {} as Record<string, { count: number; totalTime: number; paros: Paro[] }>);
    
    // Calculate total stop time
    const totalStopTime = order.paros.reduce((total, paro) => total + paro.tiempoMinutos, 0);
    
    // Calculate efficiency
    let efficiency = 100;
    if (order.producto.velocidadProduccion) {
      const expectedProduction = order.producto.velocidadProduccion; // Boxes per hour
      const actualProduction = order.cajasProducidas;
      efficiency = Math.min(100, Math.round((actualProduction / expectedProduction) * 100));
    }
    
    return {
      parosByType,
      totalStopTime,
      efficiency,
    };
  };
  
  const summary = calculateSummary();
  
  // Calculate progress percentage
  const progressPercentage = order 
    ? Math.min(Math.round((order.cajasProducidas / order.cajasPlanificadas) * 100), 100)
    : 0;
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleExport = () => {
    if (!order) return;
    
    // Create CSV content
    const rows = [
      ['Número de Orden', 'Línea de Producción', 'Producto', 'Cajas Planificadas', 'Cajas Producidas', 'Eficiencia'],
      [
        order.numeroOrden.toString(),
        order.lineaProduccion.nombre,
        order.producto.nombre,
        order.cajasPlanificadas.toString(),
        order.cajasProducidas.toString(),
        `${summary?.efficiency || 0}%`
      ]
    ];
    
    // Add paros section
    rows.push([]);
    rows.push(['Tipo de Paro', 'Tiempo (minutos)', 'Sistema', 'Subsistema', 'Subsubsistema', 'Descripción']);
    
    order.paros.forEach(paro => {
      rows.push([
        paro.tipoParo.nombre,
        paro.tiempoMinutos.toString(),
        paro.sistema?.nombre || '',
        paro.subsistema?.nombre || '',
        paro.subsubsistema?.nombre || '',
        paro.descripcion || ''
      ]);
    });
    
    // Convert to CSV
    const csvContent = rows.map(row => row.join(',')).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orden_${order.numeroOrden}_resumen.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No se pudo cargar la información de la orden</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push("/production-chief")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>
      
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
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Producto</h3>
              <p className="text-lg font-medium">{order.producto.nombre}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Fecha de Producción</h3>
              <p className="text-lg font-medium">
                {new Date(order.fechaProduccion).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Turno</h3>
              <p className="text-lg font-medium">{order.turno}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Velocidad de Producción</h3>
              <p className="text-lg font-medium">
                {order.producto.velocidadProduccion 
                  ? `${order.producto.velocidadProduccion} cajas/hora` 
                  : "No definida"}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Progreso</h3>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between mt-2">
              <div>
                <span className="text-sm font-medium">{order.cajasProducidas}</span>
                <span className="text-sm text-muted-foreground"> de </span>
                <span className="text-sm font-medium">{order.cajasPlanificadas}</span>
                <span className="text-sm text-muted-foreground"> cajas</span>
              </div>
              <div>
                <span className="text-sm font-medium">{progressPercentage}%</span>
                <span className="text-sm text-muted-foreground"> completado</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Eficiencia</h3>
            <div className="flex items-center gap-2">
              <Progress value={summary?.efficiency || 0} className="h-2 flex-1" />
              <span className="text-lg font-bold">{summary?.efficiency || 0}%</span>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-4">Resumen de Paros</h3>
            
            {order.paros.length === 0 ? (
              <p className="text-muted-foreground">No se han registrado paros para esta orden.</p>
            ) : (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="summary">Resumen</TabsTrigger>
                  <TabsTrigger value="detail">Detalle</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(summary?.parosByType || {}).map(([tipoNombre, data]) => (
                        <Card key={tipoNombre}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{tipoNombre}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{data.totalTime} min</div>
                            <p className="text-sm text-muted-foreground">
                              {data.count} {data.count === 1 ? 'paro' : 'paros'} registrados
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Tiempo Total de Paros</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{summary?.totalStopTime || 0} minutos</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="detail" className="mt-4">
                  <div className="space-y-4">
                    {Object.entries(summary?.parosByType || {}).map(([tipoNombre, data]) => (
                      <div key={tipoNombre} className="space-y-2">
                        <h4 className="font-medium">{tipoNombre}</h4>
                        
                        {data.paros.map((paro) => (
                          <Card key={paro.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between">
                                <div className="font-medium">{paro.tiempoMinutos} minutos</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(paro.fechaInicio).toLocaleString()}
                                </div>
                              </div>
                              
                              {(paro.sistema || paro.subsistema || paro.subsubsistema) && (
                                <div className="mt-2 text-sm">
                                  {paro.sistema && <span>Sistema: {paro.sistema.nombre}</span>}
                                  {paro.subsistema && (
                                    <span className="ml-2">
                                      Subsistema: {paro.subsistema.nombre}
                                    </span>
                                  )}
                                  {paro.subsubsistema && (
                                    <span className="ml-2">
                                      Subsubsistema: {paro.subsubsistema.nombre}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {paro.descripcion && (
                                <div className="mt-2 text-sm">
                                  <span className="font-medium">Descripción: </span>
                                  {paro.descripcion}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 