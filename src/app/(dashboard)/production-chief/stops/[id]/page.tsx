"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowLeft, Clock, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

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

type StopType = {
  id: string;
  nombre: string;
};

export default function ProductionStopsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stopTypes, setStopTypes] = useState<StopType[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Form state
  const [selectedStopType, setSelectedStopType] = useState<string>("");
  const [stopMinutes, setStopMinutes] = useState<number>(0);
  const [stopDescription, setStopDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch order data
        const orderResponse = await fetch(`/api/production-orders/${params.id}?includeStops=true`);
        
        if (!orderResponse.ok) {
          throw new Error("Error al obtener la información de la orden");
        }
        
        const orderData = await orderResponse.json();
        setOrder(orderData);
        
        // Fetch stop types
        const typesResponse = await fetch("/api/tipos-paro");
        
        if (!typesResponse.ok) {
          throw new Error("Error al obtener los tipos de paro");
        }
        
        const typesData = await typesResponse.json();
        setStopTypes(typesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Error al obtener la información");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.id]);

  const handleBack = () => {
    if (order?.estado === "completada") {
      router.push(`/production-chief/summary/${order.id}`);
    } else {
      router.push(`/production-chief?orderId=${order?.id}&tab=production`);
    }
  };

  const handleAddStop = async () => {
    if (!order) return;
    
    if (!selectedStopType) {
      toast.error("Debe seleccionar un tipo de paro");
      return;
    }
    
    if (stopMinutes <= 0) {
      toast.error("El tiempo de paro debe ser mayor a 0 minutos");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/production-orders/${order.id}/paros`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipoParoId: selectedStopType,
          tiempoMinutos: stopMinutes,
          descripcion: stopDescription,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Error al registrar el paro de producción");
      }
      
      // Refresh the order data
      const updatedOrderResponse = await fetch(`/api/production-orders/${params.id}?includeStops=true`);
      const updatedOrderData = await updatedOrderResponse.json();
      setOrder(updatedOrderData);
      
      // Reset form
      setSelectedStopType("");
      setStopMinutes(0);
      setStopDescription("");
      setShowAddDialog(false);
      
      toast.success("Paro registrado correctamente");
    } catch (err) {
      console.error("Error adding stop:", err);
      toast.error(err instanceof Error ? err.message : "Error al registrar el paro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStop = async (stopId: string) => {
    if (!order) return;
    
    try {
      const response = await fetch(`/api/production-orders/${order.id}/paros/${stopId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Error al eliminar el paro de producción");
      }
      
      // Refresh the order data
      const updatedOrderResponse = await fetch(`/api/production-orders/${params.id}?includeStops=true`);
      const updatedOrderData = await updatedOrderResponse.json();
      setOrder(updatedOrderData);
      
      toast.success("Paro eliminado correctamente");
    } catch (err) {
      console.error("Error deleting stop:", err);
      toast.error(err instanceof Error ? err.message : "Error al eliminar el paro");
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateTotalStopTime = () => {
    if (!order || !order.paros) return 0;
    return order.paros.reduce((total, paro) => total + paro.tiempoMinutos, 0);
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

  const totalStopMinutes = calculateTotalStopTime();

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
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Paros de Producción</CardTitle>
              <CardDescription>
                Línea: {order.lineaProduccion.nombre} | Producto: {order.producto.nombre}
              </CardDescription>
            </div>
            
            {order.estado === "en_progreso" && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Paro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Paro de Producción</DialogTitle>
                    <DialogDescription>
                      Complete la información del paro de producción.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="stopType">Tipo de Paro</Label>
                      <Select value={selectedStopType} onValueChange={setSelectedStopType}>
                        <SelectTrigger id="stopType">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {stopTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="stopMinutes">Tiempo (minutos)</Label>
                      <Input
                        id="stopMinutes"
                        type="number"
                        value={stopMinutes}
                        onChange={(e) => setStopMinutes(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="stopDescription">Descripción</Label>
                      <Textarea
                        id="stopDescription"
                        placeholder="Describa brevemente la razón del paro"
                        value={stopDescription}
                        onChange={(e) => setStopDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddStop} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
            <div>
              <span className="text-sm text-muted-foreground">Tiempo Total de Paros</span>
              <p className="text-2xl font-bold">{formatTime(totalStopMinutes)}</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          
          {(!order.paros || order.paros.length === 0) ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se han registrado paros de producción.</p>
              {order.estado === "en_progreso" && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Paro
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {order.paros.map((paro) => (
                <div 
                  key={paro.id} 
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{paro.tipoParo.nombre}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(paro.fechaRegistro)}
                      </p>
                    </div>
                    <Badge>{formatTime(paro.tiempoMinutos)}</Badge>
                  </div>
                  
                  {paro.descripcion && (
                    <>
                      <Separator />
                      <p className="text-sm">{paro.descripcion}</p>
                    </>
                  )}
                  
                  {order.estado === "en_progreso" && (
                    <div className="flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteStop(paro.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {order.estado === "completada" ? (
            <Button 
              onClick={() => router.push(`/production-chief/summary/${order.id}`)} 
              variant="outline" 
              className="w-full"
            >
              Ver Resumen de Producción
            </Button>
          ) : (
            <Button 
              onClick={() => router.push(`/production-chief?orderId=${order.id}&tab=production`)} 
              variant="outline" 
              className="w-full"
            >
              Volver a Gestión de Producción
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 