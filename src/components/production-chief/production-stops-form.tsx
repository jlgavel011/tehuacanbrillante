"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types for the form
type Sistema = {
  id: string;
  nombre: string;
  subsistemas: Subsistema[];
};

type Subsistema = {
  id: string;
  nombre: string;
  subsubsistemas: Subsubsistema[];
};

type Subsubsistema = {
  id: string;
  nombre: string;
};

type TipoParo = {
  id: string;
  nombre: string;
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
    sistemas: Sistema[];
  };
  producto: {
    id: string;
    nombre: string;
    velocidadProduccion?: number;
  };
};

// Form schema for maintenance stops
const maintenanceStopSchema = z.object({
  tiempoMinutos: z.string().min(1, {
    message: "El tiempo es requerido",
  }).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "El tiempo debe ser un número positivo",
  }),
  sistemaId: z.string().min(1, {
    message: "El sistema es requerido",
  }),
  subsistemaId: z.string().min(1, {
    message: "El subsistema es requerido",
  }),
  subsubsistemaId: z.string().min(1, {
    message: "El subsubsistema es requerido",
  }),
  descripcion: z.string().optional(),
});

// Form schema for quality stops
const qualityStopSchema = z.object({
  tiempoMinutos: z.string().min(1, {
    message: "El tiempo es requerido",
  }).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "El tiempo debe ser un número positivo",
  }),
  descripcion: z.string().min(1, {
    message: "La descripción es requerida",
  }),
});

// Form schema for operation stops
const operationStopSchema = z.object({
  tiempoMinutos: z.string().min(1, {
    message: "El tiempo es requerido",
  }).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "El tiempo debe ser un número positivo",
  }),
  sistemaId: z.string().min(1, {
    message: "El sistema es requerido",
  }),
  descripcion: z.string().optional(),
});

interface ProductionStopsFormProps {
  orderId: string;
}

export function ProductionStopsForm({ orderId }: ProductionStopsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [tiposParo, setTiposParo] = useState<TipoParo[]>([]);
  const [totalStopTime, setTotalStopTime] = useState<number>(0);
  
  // Forms for each type of stop
  const maintenanceForm = useForm<z.infer<typeof maintenanceStopSchema>>({
    resolver: zodResolver(maintenanceStopSchema),
    defaultValues: {
      tiempoMinutos: "",
      sistemaId: "",
      subsistemaId: "",
      subsubsistemaId: "",
      descripcion: "",
    },
  });
  
  const qualityForm = useForm<z.infer<typeof qualityStopSchema>>({
    resolver: zodResolver(qualityStopSchema),
    defaultValues: {
      tiempoMinutos: "",
      descripcion: "",
    },
  });
  
  const operationForm = useForm<z.infer<typeof operationStopSchema>>({
    resolver: zodResolver(operationStopSchema),
    defaultValues: {
      tiempoMinutos: "",
      sistemaId: "",
      descripcion: "",
    },
  });
  
  // Selected sistema for the maintenance form
  const [selectedSistema, setSelectedSistema] = useState<Sistema | null>(null);
  const [selectedSubsistema, setSelectedSubsistema] = useState<Subsistema | null>(null);
  
  // Fetch order data and tipos de paro
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch order data
        const orderResponse = await fetch(`/api/production-orders/${orderId}`);
        
        if (!orderResponse.ok) {
          throw new Error("Error al cargar la orden de producción");
        }
        
        const orderData = await orderResponse.json();
        setOrder(orderData);
        
        // Calculate total stop time based on production velocity
        if (orderData.producto.velocidadProduccion) {
          const expectedProduction = orderData.producto.velocidadProduccion; // Boxes per hour
          const actualProduction = orderData.cajasProducidas;
          const expectedTime = actualProduction / expectedProduction; // Hours
          const actualTime = 1; // 1 hour (as per requirement)
          const stopTimeHours = Math.max(0, actualTime - expectedTime);
          const stopTimeMinutes = Math.round(stopTimeHours * 60);
          setTotalStopTime(stopTimeMinutes);
        }
        
        // Fetch tipos de paro
        const tiposParoResponse = await fetch("/api/tipos-paro");
        
        if (!tiposParoResponse.ok) {
          throw new Error("Error al cargar los tipos de paro");
        }
        
        const tiposParoData = await tiposParoResponse.json();
        setTiposParo(tiposParoData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [orderId]);
  
  // Update subsistemas when sistema changes
  useEffect(() => {
    if (!order) return;
    
    const sistemaId = maintenanceForm.watch("sistemaId");
    if (!sistemaId) {
      setSelectedSistema(null);
      return;
    }
    
    const sistema = order.lineaProduccion.sistemas.find(s => s.id === sistemaId) || null;
    setSelectedSistema(sistema);
    maintenanceForm.setValue("subsistemaId", "");
    maintenanceForm.setValue("subsubsistemaId", "");
  }, [maintenanceForm.watch("sistemaId"), order]);
  
  // Update subsubsistemas when subsistema changes
  useEffect(() => {
    if (!selectedSistema) return;
    
    const subsistemaId = maintenanceForm.watch("subsistemaId");
    if (!subsistemaId) {
      setSelectedSubsistema(null);
      return;
    }
    
    const subsistema = selectedSistema.subsistemas.find(s => s.id === subsistemaId) || null;
    setSelectedSubsistema(subsistema);
    maintenanceForm.setValue("subsubsistemaId", "");
  }, [maintenanceForm.watch("subsistemaId"), selectedSistema]);
  
  // Submit handlers for each form
  const onSubmitMaintenance = async (data: z.infer<typeof maintenanceStopSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tipoParoMantenimiento = tiposParo.find(t => t.nombre === "Mantenimiento");
      
      if (!tipoParoMantenimiento) {
        throw new Error("No se encontró el tipo de paro de mantenimiento");
      }
      
      const response = await fetch(`/api/production-orders/${orderId}/paros`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tiempoMinutos: parseInt(data.tiempoMinutos),
          tipoParoId: tipoParoMantenimiento.id,
          lineaProduccionId: order?.lineaProduccion.id,
          subsistemaId: data.subsistemaId,
          subsubsistemaId: data.subsubsistemaId,
          descripcion: data.descripcion || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Error al registrar el paro de mantenimiento");
      }
      
      // Reset form
      maintenanceForm.reset();
      
      // Redirect to production page
      router.push(`/production-chief?orderId=${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el paro de mantenimiento");
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmitQuality = async (data: z.infer<typeof qualityStopSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tipoParoCalidad = tiposParo.find(t => t.nombre === "Calidad");
      
      if (!tipoParoCalidad) {
        throw new Error("No se encontró el tipo de paro de calidad");
      }
      
      const response = await fetch(`/api/production-orders/${orderId}/paros`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tiempoMinutos: parseInt(data.tiempoMinutos),
          tipoParoId: tipoParoCalidad.id,
          lineaProduccionId: order?.lineaProduccion.id,
          descripcion: data.descripcion,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Error al registrar el paro de calidad");
      }
      
      // Reset form
      qualityForm.reset();
      
      // Redirect to production page
      router.push(`/production-chief?orderId=${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el paro de calidad");
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmitOperation = async (data: z.infer<typeof operationStopSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tipoParoOperacion = tiposParo.find(t => t.nombre === "Operación");
      
      if (!tipoParoOperacion) {
        throw new Error("No se encontró el tipo de paro de operación");
      }
      
      const response = await fetch(`/api/production-orders/${orderId}/paros`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tiempoMinutos: parseInt(data.tiempoMinutos),
          tipoParoId: tipoParoOperacion.id,
          lineaProduccionId: order?.lineaProduccion.id,
          sistemaId: data.sistemaId,
          descripcion: data.descripcion || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Error al registrar el paro de operación");
      }
      
      // Reset form
      operationForm.reset();
      
      // Redirect to production page
      router.push(`/production-chief?orderId=${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el paro de operación");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && !order) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error && !order) {
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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Orden #{order.numeroOrden}</CardTitle>
          <CardDescription>
            Línea: {order.lineaProduccion.nombre} | Producto: {order.producto.nombre}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Tiempo Total de Paro Estimado</h3>
              <p className="text-sm text-muted-foreground">
                Basado en la velocidad de producción y las cajas producidas
              </p>
              <div className="mt-2">
                <span className="text-2xl font-bold">{totalStopTime} minutos</span>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium">Registro de Paros</h3>
              <p className="text-sm text-muted-foreground">
                Asigne el tiempo de paro a las diferentes categorías
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="maintenance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="maintenance">Paro por Mantenimiento</TabsTrigger>
          <TabsTrigger value="quality">Paro por Calidad</TabsTrigger>
          <TabsTrigger value="operation">Paro por Operación</TabsTrigger>
        </TabsList>
        
        {/* Maintenance Stop Form */}
        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Paro por Mantenimiento</CardTitle>
              <CardDescription>
                Registre el tiempo de paro debido a problemas de mantenimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...maintenanceForm}>
                <form onSubmit={maintenanceForm.handleSubmit(onSubmitMaintenance)} className="space-y-4">
                  <FormField
                    control={maintenanceForm.control}
                    name="tiempoMinutos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiempo (minutos)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ej. 30" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ingrese el tiempo de paro en minutos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={maintenanceForm.control}
                    name="sistemaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sistema</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un sistema" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {order.lineaProduccion.sistemas.map((sistema) => (
                              <SelectItem key={sistema.id} value={sistema.id}>
                                {sistema.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={maintenanceForm.control}
                    name="subsistemaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subsistema</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!selectedSistema}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un subsistema" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedSistema?.subsistemas.map((subsistema) => (
                              <SelectItem key={subsistema.id} value={subsistema.id}>
                                {subsistema.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={maintenanceForm.control}
                    name="subsubsistemaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subsubsistema</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!selectedSubsistema}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un subsubsistema" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedSubsistema?.subsubsistemas.map((subsubsistema) => (
                              <SelectItem key={subsubsistema.id} value={subsubsistema.id}>
                                {subsubsistema.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={maintenanceForm.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Descripción del problema" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      "Registrar Paro de Mantenimiento"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Quality Stop Form */}
        <TabsContent value="quality" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Paro por Calidad</CardTitle>
              <CardDescription>
                Registre el tiempo de paro debido a problemas de calidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...qualityForm}>
                <form onSubmit={qualityForm.handleSubmit(onSubmitQuality)} className="space-y-4">
                  <FormField
                    control={qualityForm.control}
                    name="tiempoMinutos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiempo (minutos)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ej. 30" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ingrese el tiempo de paro en minutos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={qualityForm.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Input placeholder="Descripción del problema de calidad" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      "Registrar Paro de Calidad"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Operation Stop Form */}
        <TabsContent value="operation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Paro por Operación</CardTitle>
              <CardDescription>
                Registre el tiempo de paro debido a problemas de operación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...operationForm}>
                <form onSubmit={operationForm.handleSubmit(onSubmitOperation)} className="space-y-4">
                  <FormField
                    control={operationForm.control}
                    name="tiempoMinutos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiempo (minutos)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ej. 30" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ingrese el tiempo de paro en minutos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={operationForm.control}
                    name="sistemaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sistema</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un sistema" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {order.lineaProduccion.sistemas.map((sistema) => (
                              <SelectItem key={sistema.id} value={sistema.id}>
                                {sistema.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={operationForm.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Descripción del problema de operación" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      "Registrar Paro de Operación"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 