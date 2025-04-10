"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, ClipboardCheck, AlertTriangle, ArrowRight, Loader2, Plus, Trash2, Pencil, CheckCircle, ArrowLeft, Timer, RefreshCw, PlayCircle, InfoIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { OrderSearch } from "./order-search";

type ProductionOrder = {
  id: string;
  numeroOrden: number;
  cajasProducidas: number;
  cajasPlanificadas: number;
  turno: number;
  fechaProduccion: string;
  lineaProduccion: {
    id: string;
    nombre: string;
  };
  producto: {
    id: string;
    nombre: string;
    velocidadProduccion?: number;
    modelo: {
      nombre: string;
    };
    sabor: {
      nombre: string;
    };
    tamaño: {
      nombre: string;
    };
    caja: {
      numeroUnidades: number;
      nombre?: string;
    };
  };
  paros?: Array<any>;
  lastUpdateTime?: string; // Última actualización de la producción
  tiempoPlan?: number; // Tiempo planificado en horas
  estado?: string;
};

type StopType = {
  id: string;
  nombre: string;
};

type Sistema = {
  id: string;
  name: string;
  productionLineId?: string;
  productionLine?: {
    id: string;
    name: string;
  };
};

type Subsistema = {
  id: string;
  name: string;
  systemId: string;
  system?: {
    id: string;
    name: string;
    productionLineId?: string;
    productionLine?: {
      id: string;
      name: string;
    };
  };
};

type Subsubsistema = {
  id: string;
  name: string;
  subsystemId: string;
  subsystem?: {
    id: string;
    name: string;
    systemId?: string;
    system?: {
      id: string;
      name: string;
      productionLineId?: string;
      productionLine?: {
        id: string;
        name: string;
      };
    };
  };
};

type Paro = {
  id?: string;
  tiempoMinutos: number;
  tipoParoId: string;
  tipoParoNombre?: string;
  sistemaId?: string;
  subsistemaId?: string;
  subsubsistemaId?: string;
  desviacionCalidadId?: string;
  materiaPrimaId?: string;
  descripcion?: string;
};

type ProductionNote = {
  id: string;
  content: string;
  timestamp: Date;
};

// Add type for quality deviations
type DesviacionCalidad = {
  id: string;
  nombre: string;
};

type MateriaPrima = {
  id: string;
  nombre: string;
};

export function ProductionStatus({ onProductionStateChange }: { onProductionStateChange?: (isActive: boolean) => void }) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showHourlyUpdate, setShowHourlyUpdate] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [hourlyProduction, setHourlyProduction] = useState<string>("");
  const [stopMinutes, setStopMinutes] = useState<number>(0);
  const [stopTypes, setStopTypes] = useState<StopType[]>([]);
  const [selectedStopType, setSelectedStopType] = useState<string>("");
  const [stopDescription, setStopDescription] = useState<string>("");
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [totalCajasProducidas, setTotalCajasProducidas] = useState<number>(0);
  
  // New state for multiple paros
  const [paros, setParos] = useState<Paro[]>([]);
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [subsistemas, setSubsistemas] = useState<Subsistema[]>([]);
  const [subsubsistemas, setSubsubsistemas] = useState<Subsubsistema[]>([]);
  const [currentParo, setCurrentParo] = useState<Paro | null>(null);
  const [showAddParoDialog, setShowAddParoDialog] = useState(false);
  const [currentParoType, setCurrentParoType] = useState<"Mantenimiento" | "Calidad" | "Operación">("Mantenimiento");
  const [remainingDowntimeMinutes, setRemainingDowntimeMinutes] = useState(0);
  const [finalHourlyProduction, setFinalHourlyProduction] = useState<string>("");
  const [parosMantenimiento, setParosMantenimiento] = useState<Paro[]>([]);
  const [parosCalidad, setParosCalidad] = useState<Paro[]>([]);
  const [parosOperacion, setParosOperacion] = useState<Paro[]>([]);
  const [editingParoIndex, setEditingParoIndex] = useState<number | null>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false);
  const [showAddParoCloseConfirmDialog, setShowAddParoCloseConfirmDialog] = useState(false);
  
  // Countdown timer state
  const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null);
  const [countdownMinutes, setCountdownMinutes] = useState<number>(60);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [showCountdownWarning, setShowCountdownWarning] = useState<boolean>(false);

  // Add state for reopening
  const [isReopening, setIsReopening] = useState(false);
  
  // Add state to track if this is the first load
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // New state for production notes
  const [productionNotes, setProductionNotes] = useState<ProductionNote[]>([]);
  const [currentNote, setCurrentNote] = useState<string>("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Add new state for inline editing
  const [inlineEditNote, setInlineEditNote] = useState<string>("");

  // Add state for quality deviations
  const [desviacionesCalidad, setDesviacionesCalidad] = useState<DesviacionCalidad[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);

  // Estados independientes para los modales
  const [hourlyParos, setHourlyParos] = useState<Paro[]>([]);
  const [finishParos, setFinishParos] = useState<Paro[]>([]);

  // Agregar el estado isFinalizingProduction
  const [isFinalizingProduction, setIsFinalizingProduction] = useState<boolean>(false);

  // Add function to fetch quality deviations
  const fetchDesviacionesCalidad = async (lineaId: string) => {
    try {
      const response = await fetch(`/api/production-lines/${lineaId}/quality-deviations`);
      if (!response.ok) {
        throw new Error("Error al cargar las desviaciones de calidad");
      }
      const data = await response.json();
      setDesviacionesCalidad(data);
    } catch (error) {
      console.error("Error fetching desviaciones de calidad:", error);
      toast.error("Error al cargar las desviaciones de calidad");
    }
  };

  // Add function to fetch materias primas for the current product
  const fetchMateriasPrimas = async (productoId: string) => {
    try {
      console.log("Fetching materias primas for producto:", productoId);
      const response = await fetch(`/api/productos/${productoId}/materias-primas`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Error response from API:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData?.error || "Error al cargar las materias primas");
      }
      
      const data = await response.json();
      console.log("Materias primas loaded:", data);
      setMateriasPrimas(data);
    } catch (error) {
      console.error("Error fetching materias primas:", error);
      toast.error("Error al cargar las materias primas");
    }
  };

  // Modify useEffect to include fetching quality deviations when order changes
  useEffect(() => {
    if (order?.lineaProduccion?.id) {
      fetchDesviacionesCalidad(order.lineaProduccion.id);
    }
    if (order?.producto?.id) {
      fetchMateriasPrimas(order.producto.id);
    }
  }, [order?.lineaProduccion?.id, order?.producto?.id]);

  // Function to calculate stop minutes based on hourly production
  const calculateStopMinutes = (boxesProduced: number, isFinalizingProduction = false) => {
    // Get the expected production speed (boxes per hour)
    const expectedBoxesPerHour = order?.producto?.velocidadProduccion || 0;
    
    if (expectedBoxesPerHour <= 0) {
      console.log("No valid production speed available");
      return 30; // Default to 30 minutes if no valid production speed
    }
    
    // Si estamos finalizando la producción, calcular basado en el tiempo transcurrido desde la última actualización
    if (isFinalizingProduction && lastUpdateTime) {
      // Calcular el tiempo transcurrido en minutos
      const now = new Date();
      const elapsedMinutes = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60));
      
      // No tiene sentido usar menos de 1 minuto o más de 8 horas (un turno completo)
      const validElapsedMinutes = Math.min(Math.max(1, elapsedMinutes), 480);
      
      // Calcular cuántas cajas se esperarían en ese tiempo
      const expectedBoxesInTime = (expectedBoxesPerHour * validElapsedMinutes) / 60;
      
      // Calcular el porcentaje de producción logrado
      const productionPercentage = boxesProduced / expectedBoxesInTime;
      
      // Calcular el tiempo efectivo de producción en minutos
      const effectiveProductionMinutes = productionPercentage * validElapsedMinutes;
      
      // El tiempo de paro es el tiempo restante
      const stopMinutes = Math.round(validElapsedMinutes - effectiveProductionMinutes);
      
      console.log("Finalizando producción - cálculo de tiempo de paro basado en tiempo transcurrido:", {
        esperadoPorHora: expectedBoxesPerHour,
        tiempoTranscurridoMinutos: validElapsedMinutes,
        cajasEsperadas: expectedBoxesInTime,
        cajasProducidas: boxesProduced,
        porcentajeProduccion: productionPercentage,
        tiempoEfectivoMinutos: effectiveProductionMinutes,
        tiempoParoMinutos: stopMinutes
      });
      
      // Asegurar que retornamos un valor no negativo
      return Math.max(0, stopMinutes);
    } else {
      // Para actualizaciones por hora, seguimos usando el cálculo basado en 60 minutos
      
      // Calculate how many boxes should have been produced in 60 minutes at full capacity
      const expectedBoxes = expectedBoxesPerHour;
      
      // Calculate the percentage of production achieved
      const productionPercentage = boxesProduced / expectedBoxes;
      
      // Calculate the effective production time in minutes (out of 60 minutes)
      const effectiveProductionMinutes = productionPercentage * 60;
      
      // The stop time is the remaining time out of 60 minutes
      const stopMinutes = Math.round(60 - effectiveProductionMinutes);
      
      console.log("Actualización por hora - cálculo de tiempo de paro:", {
        esperadoPorHora: expectedBoxesPerHour,
        cajasProducidas: boxesProduced,
        porcentajeProduccion: productionPercentage,
        tiempoEfectivoMinutos: effectiveProductionMinutes,
        tiempoParoMinutos: stopMinutes
      });
      
      // Ensure we return a non-negative value
      return Math.max(0, stopMinutes);
    }
  };

  useEffect(() => {
    // Update stop minutes whenever hourly production changes
    if (hourlyProduction && parseInt(hourlyProduction) > 0 && order?.producto?.velocidadProduccion) {
      const calculatedStopMinutes = calculateStopMinutes(parseInt(hourlyProduction), false);
      setStopMinutes(calculatedStopMinutes);
    } else {
      setStopMinutes(0);
    }
  }, [hourlyProduction, order]);

  // Determine order ID from URL on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get("orderId");
    setOrderId(id);
    
    // If no ID is found, set loading to false
    if (!id) {
      setIsLoading(false);
    }
  }, []);

  // Fetch order data when orderId changes
  useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchStopTypes();
      fetchSubsistemas();
      fetchSubsubsistemas();
    }
  }, [orderId]);

  // Add a new useEffect to fetch systems after the order is loaded
  useEffect(() => {
    if (order && order.lineaProduccion && order.lineaProduccion.id) {
      fetchSistemas();
    }
  }, [order]);

  useEffect(() => {
    if (order) {
      setTotalCajasProducidas(order.cajasProducidas);
      
      // If order is in progress, start the timer
      if (order.estado === "en_progreso") {
        const timer = setInterval(() => {
          setTimeElapsed(prev => prev + 1);
        }, 60000); // Update every minute
        
        return () => clearInterval(timer);
      }
    }
  }, [order]);

  useEffect(() => {
    // Check if an hour has passed since last update
    if (lastUpdateTime && order?.estado === "en_progreso") {
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60));
      
      if (diffMinutes >= 60) {
        setShowHourlyUpdate(true);
      }
    }
  }, [timeElapsed, lastUpdateTime, order]);

  // Function to update the countdown timer
  const updateCountdown = useCallback(() => {
    if (!nextUpdateTime || !order || order.estado !== "en_progreso") return;
    
    const now = new Date();
    const diffMs = nextUpdateTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      // Time to update
      setCountdownMinutes(0);
      setCountdownSeconds(0);
      setShowCountdownWarning(true);
      return;
    }
    
    const diffSec = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffSec / 60);
    const seconds = diffSec % 60;
    
    setCountdownMinutes(minutes);
    setCountdownSeconds(seconds);
    
    // Show warning when less than 5 minutes remaining
    setShowCountdownWarning(minutes < 5);
  }, [nextUpdateTime, order]);

  // Set up the countdown timer
  useEffect(() => {
    if (order?.estado === "en_progreso") {
      // If we have a lastUpdateTime, set the next update time to 1 hour later
      if (lastUpdateTime) {
        const nextUpdate = new Date(lastUpdateTime);
        nextUpdate.setHours(nextUpdate.getHours() + 1);
        setNextUpdateTime(nextUpdate);
      } else {
        // If no lastUpdateTime, set it to 1 hour from now
        const nextUpdate = new Date();
        nextUpdate.setHours(nextUpdate.getHours() + 1);
        setNextUpdateTime(nextUpdate);
      }
    }
  }, [order?.estado, lastUpdateTime]);

  // Update the countdown every second
  useEffect(() => {
    if (order?.estado !== "en_progreso") return;
    
    const timer = setInterval(() => {
      updateCountdown();
    }, 1000);
    
    return () => clearInterval(timer);
  }, [order?.estado, updateCountdown]);

  const fetchOrder = async () => {
    if (!orderId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching order with ID:", orderId);
      const response = await fetch(`/api/production-orders/${orderId}`);
      
      if (!response.ok) {
        console.error("Error response:", response.status, response.statusText);
        throw new Error("Error al obtener la orden de producción");
      }
      
      const orderData = await response.json();
      console.log("Order data:", orderData);
      setOrder(orderData);
      
      // Check for stored lastUpdateTime in localStorage first
      const storedUpdateTime = getStoredLastUpdateTime(orderId);
      
      if (storedUpdateTime) {
        console.log("Using lastUpdateTime from localStorage:", storedUpdateTime);
        setLastUpdateTime(storedUpdateTime);
      } else if (orderData.lastUpdateTime) {
        // Use lastUpdateTime from API if available and not in localStorage
        console.log("Using lastUpdateTime from API:", orderData.lastUpdateTime);
        const apiLastUpdateTime = new Date(orderData.lastUpdateTime);
        setLastUpdateTime(apiLastUpdateTime);
        
        // Also store this in localStorage for future refreshes
        storeLastUpdateTime(orderId, apiLastUpdateTime);
      } else if (orderData.estado === "en_progreso") {
        // Fallback for older records without lastUpdateTime
        console.log("No lastUpdateTime in API response or localStorage, using current time");
        const now = new Date();
        setLastUpdateTime(now);
        storeLastUpdateTime(orderId, now);
      }
      
      // Set total cajas producidas
      setTotalCajasProducidas(orderData.cajasProducidas || 0);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(err instanceof Error ? err.message : "Error al obtener la orden de producción");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStopTypes = async () => {
    try {
      const response = await fetch("/api/tipos-paro");
      if (!response.ok) {
        throw new Error("Error al cargar los tipos de paro");
      }
      const data = await response.json();
      setStopTypes(data);
    } catch (error) {
      console.error("Error fetching stop types:", error);
      toast.error("Error al cargar los tipos de paro");
    }
  };

  const fetchSistemas = async () => {
    try {
      if (!order || !order.lineaProduccion || !order.lineaProduccion.id) {
        console.warn("No production line ID available for filtering systems");
        return;
      }

      const lineaProduccionId = order.lineaProduccion.id;
      const response = await fetch(`/api/production-lines/systems?productionLineId=${lineaProduccionId}`);
      if (!response.ok) {
        throw new Error("Error al cargar los sistemas");
      }
      const data = await response.json();
      setSistemas(data);
    } catch (error) {
      console.error("Error fetching sistemas:", error);
      toast.error("Error al cargar los sistemas");
    }
  };

  const fetchSubsistemas = async () => {
    try {
      const response = await fetch("/api/production-lines/subsystems");
      if (!response.ok) {
        throw new Error("Error al cargar los subsistemas");
      }
      const data = await response.json();
      setSubsistemas(data);
    } catch (error) {
      console.error("Error fetching subsistemas:", error);
      toast.error("Error al cargar los subsistemas");
    }
  };

  const fetchSubsubsistemas = async () => {
    try {
      const response = await fetch("/api/production-lines/subsubsystems");
      if (!response.ok) {
        throw new Error("Error al cargar los subsubsistemas");
      }
      const data = await response.json();
      setSubsubsistemas(data);
    } catch (error) {
      console.error("Error fetching subsubsistemas:", error);
      toast.error("Error al cargar los subsubsistemas");
    }
  };

  const handleStartProduction = async () => {
    if (!order) return;
    
    setIsStarting(true);
    
    try {
      const response = await fetch(`/api/production-orders/${order.id}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Error al iniciar la producción");
      }
      
      // Get the updated order with lastUpdateTime from API
      const updatedOrder = await response.json();
      
      // Use lastUpdateTime from API response
      if (updatedOrder.lastUpdateTime) {
        const apiLastUpdateTime = new Date(updatedOrder.lastUpdateTime);
        console.log("Using lastUpdateTime from API response:", apiLastUpdateTime);
        setLastUpdateTime(apiLastUpdateTime);
        
        // Store in localStorage
        storeLastUpdateTime(order.id, apiLastUpdateTime);
        
        // Set next update time to 1 hour from the API lastUpdateTime
        const nextUpdate = new Date(apiLastUpdateTime);
        nextUpdate.setHours(nextUpdate.getHours() + 1);
        setNextUpdateTime(nextUpdate);
      } else {
        // Fallback if API doesn't return lastUpdateTime (should not happen after our updates)
        console.log("No lastUpdateTime in API response, using current time");
        const now = new Date();
        setLastUpdateTime(now);
        
        // Store in localStorage
        storeLastUpdateTime(order.id, now);
        
        // Set next update time to 1 hour from now
        const nextUpdate = new Date(now);
        nextUpdate.setHours(nextUpdate.getHours() + 1);
        setNextUpdateTime(nextUpdate);
      }
      
      // Reset countdown warning
      setShowCountdownWarning(false);
      
      // Refresh the order data
      await fetchOrder();
      toast.success("Producción iniciada correctamente");
    } catch (err) {
      console.error("Error starting production:", err);
      toast.error(err instanceof Error ? err.message : "Error al iniciar la producción");
    } finally {
      setIsStarting(false);
    }
  };

  // Function to start the paros registration process
  const handleStartParosRegistration = () => {
    if (!hourlyProduction || isNaN(parseInt(hourlyProduction))) {
      toast.error("Por favor ingrese la cantidad de cajas producidas en la última hora");
      return;
    }

    // Calculate stop minutes for the hour
    const hourlyProductionValue = parseInt(hourlyProduction);
    const calculatedStopMinutes = calculateStopMinutes(hourlyProductionValue, false);
    
    // Set the final hourly production and remaining downtime minutes
    setFinalHourlyProduction(hourlyProduction);
    setRemainingDowntimeMinutes(calculatedStopMinutes);
    
    // Close hourly update dialog
    setShowHourlyUpdate(false);
    
    if (calculatedStopMinutes > 0) {
      // Asegurarse de que los sistemas estén cargados
      if (sistemas.length === 0 && order?.lineaProduccion?.id) {
        fetchSistemas();
      }
      
      // Start with Mantenimiento paros
      setCurrentParoType("Mantenimiento");
      
      // Reset all paros lists
      setParosMantenimiento([]);
      setParosCalidad([]);
      setParosOperacion([]);
      
      // Show the add paro dialog
      const mantenimientoTipo = stopTypes.find(tipo => tipo.nombre === "Mantenimiento");
      if (mantenimientoTipo) {
        setCurrentParo({
          tiempoMinutos: 0,  // Iniciar con 0 para no sugerir tiempo
          tipoParoId: mantenimientoTipo.id,
          tipoParoNombre: mantenimientoTipo.nombre,
          sistemaId: "",
          subsistemaId: undefined,
          subsubsistemaId: undefined,
          descripcion: ""
        });
        setShowAddParoDialog(true);
      }
    } else {
      // If no downtime, just update production directly
      handleHourlyUpdate();
    }
  };

  const handleHourlyUpdate = async () => {
    if (!order || !hourlyProduction) return;
    
    setIsUpdating(true);
    
    try {
      const hourlyProductionValue = parseInt(hourlyProduction);
      
      // Calculate total cajas produced
      const newCajasProducidas = totalCajasProducidas + hourlyProductionValue;
      
      // Crear la nueva fecha de actualización antes de la solicitud
      const now = new Date();
      
      const response = await fetch(`/api/production-orders/${order.id}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cajasProducidas: newCajasProducidas,
          lastUpdateTime: now.toISOString() // Enviar la hora actual al servidor
        }),
      });
      
      if (!response.ok) {
        throw new Error("Error al actualizar la producción");
      }

      const data = await response.json();
      
      // Update total cajas
      setTotalCajasProducidas(newCajasProducidas);
      
      // Reset hourly production input
      setHourlyProduction("");
      
      // Show success message
      toast.success("Producción actualizada correctamente");
      
      // Actualizar explícitamente la hora de última actualización
      console.log("Actualizando lastUpdateTime a:", now.toISOString());
      setLastUpdateTime(now);
      storeLastUpdateTime(order.id, now);
      
      // Set next update time to 1 hour from now
      const nextUpdate = new Date(now);
      nextUpdate.setHours(nextUpdate.getHours() + 1);
      setNextUpdateTime(nextUpdate);
      
      // Reiniciar explícitamente el contador y las advertencias
      setCountdownMinutes(60);
      setCountdownSeconds(0);
      setShowCountdownWarning(false);
      
      // Recalcular inmediatamente el tiempo transcurrido
      setTimeElapsed(0);
      
      // Recargar la orden para obtener la información actualizada del servidor
      await fetchOrder();

      // Cerrar el diálogo
      setShowHourlyUpdate(false);
      
    } catch (error) {
      console.error("Error updating production:", error);
      toast.error("Error al actualizar la producción");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFinishProduction = () => {
    if (!finalHourlyProduction || isNaN(parseInt(finalHourlyProduction))) {
      toast.error("Por favor ingrese la cantidad de cajas producidas en la última hora");
      return;
    }

    // Calculate remaining downtime minutes
    const hourlyProductionValue = parseInt(finalHourlyProduction);
    const calculatedStopMinutes = calculateStopMinutes(hourlyProductionValue, true);
    
    // Almacenar explícitamente el valor para que esté disponible en el resumen
    setFinalHourlyProduction(finalHourlyProduction); 
    setRemainingDowntimeMinutes(calculatedStopMinutes);

    // Close hourly update dialog 
    setShowFinishDialog(false);
    setShowHourlyUpdate(false);
    
    // Start with Mantenimiento
    setCurrentParoType("Mantenimiento");
    
    // Reset all paros lists
    setParosMantenimiento([]);
    setParosCalidad([]);
    setParosOperacion([]);
    
    // Show the add paro dialog if there are stop minutes
    if (calculatedStopMinutes > 0) {
      // Find the Mantenimiento stop type
      const mantenimientoTipo = stopTypes.find(tipo => tipo.nombre === "Mantenimiento");
      
      if (!mantenimientoTipo) {
        toast.error("Error: No se encontró el tipo de paro Mantenimiento");
        return;
      }
      
      // Set the current paro with the mantenimiento type ID already selected
      setCurrentParo({
        tiempoMinutos: 0,  // Iniciar con 0 para no sugerir tiempo
        tipoParoId: mantenimientoTipo.id,
        tipoParoNombre: mantenimientoTipo.nombre,
        sistemaId: "",
        subsistemaId: undefined,
        subsubsistemaId: undefined,
        descripcion: "",
      });
      
      setShowAddParoDialog(true);
    } else {
      // Si no hay tiempo de paro, mostrar el resumen directamente
      setShowSummaryDialog(true);
    }
  };

  const completeFinishProduction = async () => {
    setIsUpdating(true);
    
    try {
      if (!order) return;

      // Usar paros específicos para finalización
      const allParos = [...finishParos];
      
      // Comprobar si tenemos el valor de producción final
      // Usando el valor almacenado en finalHourlyProduction
      if (!finalHourlyProduction || isNaN(parseInt(finalHourlyProduction))) {
        console.log("Error: No hay un valor válido de cajas producidas", { finalHourlyProduction });
        toast.error("Por favor ingrese la cantidad de cajas producidas en la última hora");
        setIsUpdating(false);
        return;
      }
      
      // Parse una sola vez para reutilizar
      const parsedProduccionFinal = parseInt(finalHourlyProduction);
      
      // Validar paros (sólo si hay tiempo de paro asignado)
      if (remainingDowntimeMinutes > 0) {
        // Calculate the total assigned time
        const totalAssignedTime = [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
          .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
          .reduce((sum, paro) => sum + paro.tiempoMinutos, 0);
        
        // Check if all downtime has been assigned
        if (totalAssignedTime < remainingDowntimeMinutes) {
          toast.error(`Debe asignar todo el tiempo de paro (${remainingDowntimeMinutes} minutos) antes de continuar`);
          setIsUpdating(false);
          return;
        }
      }
      
      // Calcular el tiempo transcurrido en horas desde la última actualización
      let tiempoTranscurridoHoras = 0;
      if (isFinalizingProduction && lastUpdateTime) {
        const ahora = new Date();
        tiempoTranscurridoHoras = (ahora.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
        console.log("Tiempo transcurrido calculado:", {
          ultimaActualizacion: lastUpdateTime,
          ahora,
          tiempoTranscurridoHoras
        });
      }
      
      console.log("Sending production data:", {
        cajasProducidas: totalCajasProducidas + parsedProduccionFinal,
        paros: allParos,
        isFinalizingProduction,
        tiempoTranscurridoHoras
      });

      // Use the appropriate endpoint based on whether we're finalizing or updating
      const endpoint = isFinalizingProduction ? 
        `/api/production-orders/${order.id}/finish` :
        `/api/production-orders/${order.id}/update`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cajasProducidas: totalCajasProducidas + parsedProduccionFinal,
          paros: allParos.map(paro => ({
            ...paro,
            // Ensure IDs are valid before sending
            sistemaId: paro.sistemaId && paro.sistemaId !== "" ? paro.sistemaId : undefined,
            subsistemaId: paro.subsistemaId && paro.subsistemaId !== "placeholder" ? paro.subsistemaId : undefined,
            subsubsistemaId: paro.subsubsistemaId && paro.subsubsistemaId !== "placeholder" ? paro.subsubsistemaId : undefined,
            desviacionCalidadId: paro.desviacionCalidadId && paro.desviacionCalidadId !== "placeholder" ? paro.desviacionCalidadId : undefined,
            materiaPrimaId: paro.materiaPrimaId && paro.materiaPrimaId !== "placeholder" ? paro.materiaPrimaId : undefined
          })),
          isFinalizingProduction,
          tiempoTranscurridoHoras
        }),
      });
        
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Error al procesar la producción";
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(errorText);
          console.error("API error response:", errorData);
          errorMessage = errorData?.message || errorMessage;
        } catch (e) {
          // If not JSON, use the raw text
          console.error("API error response (raw):", errorText);
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Actualizar explícitamente la hora de última actualización
      const now = new Date();
      setLastUpdateTime(now);
      storeLastUpdateTime(order.id, now);
      
      // Reiniciar el contador
      setCountdownMinutes(60);
      setCountdownSeconds(0);
      setShowCountdownWarning(false);
      
      // Show appropriate success message
      toast.success(isFinalizingProduction ? 
        "Producción finalizada correctamente" : 
        "Producción actualizada correctamente"
      );
      
      if (isFinalizingProduction) {
        // Marcar la orden como completada
        try {
          const completeResponse = await fetch(`/api/production-orders/${order.id}/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            }
          });
          
          if (!completeResponse.ok) {
            console.error("Error marking order as complete:", await completeResponse.text());
            // Continue anyway
          }

          // Redirigir al usuario al buscador con una recarga completa
          setTimeout(() => {
            window.location.href = '/production-chief?tab=search';
          }, 1500);
        } catch (error) {
          console.error("Error marking order as complete:", error);
          // Continue anyway, since the main update was successful
        }
      } else {
        // Si es una actualización por hora, mantener la orden en proceso
        // y no redirigir al usuario
        console.log("Actualización por hora completada, manteniendo la orden en proceso.");
      }
      
      // Clear local storage of downtime data after submission
      localStorage.removeItem(`paros_${order.id}`);

      // Close dialogs
      setShowAddParoDialog(false);
      setShowSummaryDialog(false);
      
    } catch (err) {
      console.error("Error processing production:", err);
      toast.error(err instanceof Error ? err.message : "Error al procesar la producción");
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to finish the paro assignment process
  const finishParoAssignment = () => {
    // Combine all paros
    const allParos = [...parosMantenimiento, ...parosCalidad, ...parosOperacion];
    setFinishParos(allParos);
    
    // Close the dialog
    setShowAddParoDialog(false);
    
    // Show the summary dialog
    setShowSummaryDialog(true);
  };

  const handleViewStops = () => {
    if (order) {
      router.push(`/production-chief/stops/${order.id}`);
    }
  };

  const handleViewSummary = () => {
    if (order) {
      router.push(`/production-chief/summary/${order.id}`);
    }
  };

  const getProgressPercentage = () => {
    if (!order) return 0;
    return Math.min(Math.round((totalCajasProducidas / order.cajasPlanificadas) * 100), 100);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  const handleAddParo = () => {
    if (!currentParo) return;
    
    // Skip the tipoParoId check since we now set it automatically based on the currentParoType
    // The tipoParoId should already be correctly set based on the currentParoType
    
    if (!currentParo.tiempoMinutos || currentParo.tiempoMinutos <= 0) {
      toast.error("Por favor ingrese un tiempo válido");
      return;
    }

    // Check if the sistema has been selected for Mantenimiento and Operación
    if (currentParoType !== "Calidad") {
      if (!currentParo.sistemaId || currentParo.sistemaId === "") {
        toast.error("Por favor seleccione un sistema");
        return;
      }
    }

    // Check if desviacion de calidad has been selected for Calidad
    if (currentParoType === "Calidad") {
      if (!currentParo.desviacionCalidadId || currentParo.desviacionCalidadId === "placeholder") {
        toast.error("Por favor seleccione una desviación de calidad");
        return;
      }

      // Check if materia prima has been selected when required
      const selectedDesviacion = desviacionesCalidad.find(d => d.id === currentParo.desviacionCalidadId);
      if (selectedDesviacion?.nombre === "Materia prima" && 
          (!currentParo.materiaPrimaId || currentParo.materiaPrimaId === "placeholder")) {
        toast.error("Por favor seleccione una materia prima");
        return;
      }
    }
    
    // Check if subsistema and subsubsistema have been selected for Mantenimiento paros only
    if (currentParoType === "Mantenimiento") {
      if (!currentParo.subsistemaId) {
        toast.error("Por favor seleccione un subsistema");
        return;
      }
      
      if (!currentParo.subsubsistemaId) {
        toast.error("Por favor seleccione un subsubsistema");
        return;
      }
    }

    // Calculate the total time assigned so far, excluding the current paro if editing
    let totalAssignedTime = 0;
    
    if (editingParoIndex !== null) {
      // If editing, exclude the current paro's time from the total
      if (currentParoType === "Mantenimiento") {
        totalAssignedTime = [
          ...parosMantenimiento.filter((_, i) => i !== editingParoIndex), 
          ...parosCalidad, 
          ...parosOperacion
        ].filter(paro => paro && typeof paro.tiempoMinutos === 'number')
         .reduce((sum, paro) => sum + paro.tiempoMinutos, 0);
      } else if (currentParoType === "Calidad") {
        totalAssignedTime = [
          ...parosMantenimiento, 
          ...parosCalidad.filter((_, i) => i !== editingParoIndex), 
          ...parosOperacion
        ].filter(paro => paro && typeof paro.tiempoMinutos === 'number')
         .reduce((sum, paro) => sum + paro.tiempoMinutos, 0);
      } else if (currentParoType === "Operación") {
        totalAssignedTime = [
          ...parosMantenimiento, 
          ...parosCalidad, 
          ...parosOperacion.filter((_, i) => i !== editingParoIndex)
        ].filter(paro => paro && typeof paro.tiempoMinutos === 'number')
         .reduce((sum, paro) => sum + paro.tiempoMinutos, 0);
      }
    } else {
      // If adding new, include all paros
      totalAssignedTime = [
        ...parosMantenimiento, 
        ...parosCalidad, 
        ...parosOperacion
      ].filter(paro => paro && typeof paro.tiempoMinutos === 'number')
       .reduce((sum, paro) => sum + paro.tiempoMinutos, 0);
    }
    
    // Check if the new paro would exceed the total downtime
    if (totalAssignedTime + currentParo.tiempoMinutos > remainingDowntimeMinutes) {
      toast.error(`El tiempo total de paros no puede exceder ${remainingDowntimeMinutes} minutos`);
      return;
    }

    // Create the paro object
    const newParo: Paro = {
      tiempoMinutos: currentParo.tiempoMinutos,
      tipoParoId: currentParo.tipoParoId,
      tipoParoNombre: currentParo.tipoParoNombre,
      sistemaId: currentParo.sistemaId,
      subsistemaId: currentParo.subsistemaId,
      subsubsistemaId: currentParo.subsubsistemaId,
      desviacionCalidadId: currentParo.desviacionCalidadId,
      materiaPrimaId: currentParo.materiaPrimaId,
      descripcion: currentParo.descripcion
    };
    
    // Add or update the paro in the appropriate list
    if (currentParoType === "Mantenimiento") {
      if (editingParoIndex !== null) {
        // Update existing paro
        const updatedParos = [...parosMantenimiento];
        updatedParos[editingParoIndex] = newParo;
        setParosMantenimiento(updatedParos);
      } else {
        // Add new paro
        setParosMantenimiento([...parosMantenimiento, newParo]);
      }
    } else if (currentParoType === "Calidad") {
      if (editingParoIndex !== null) {
        // Update existing paro
        const updatedParos = [...parosCalidad];
        updatedParos[editingParoIndex] = newParo;
        setParosCalidad(updatedParos);
      } else {
        // Add new paro
        setParosCalidad([...parosCalidad, newParo]);
      }
    } else if (currentParoType === "Operación") {
      if (editingParoIndex !== null) {
        // Update existing paro
        const updatedParos = [...parosOperacion];
        updatedParos[editingParoIndex] = newParo;
        setParosOperacion(updatedParos);
      } else {
        // Add new paro
        setParosOperacion([...parosOperacion, newParo]);
      }
    }

    // Reset current paro for the same type to allow adding another
    const tipoParoId = currentParo.tipoParoId;
    setCurrentParo({
      tiempoMinutos: 0,
      tipoParoId,
      sistemaId: "",  // Empty string instead of placeholder
      subsistemaId: undefined,  // undefined instead of null
      subsubsistemaId: undefined,  // undefined instead of null
      descripcion: "",
    });
    
    // Reset editing index
    setEditingParoIndex(null);
    
    // Show success message
    toast.success(editingParoIndex !== null ? "Paro actualizado correctamente" : "Paro agregado correctamente");
    
    // Check if all time has been assigned
    const newTotalAssignedTime = totalAssignedTime + currentParo.tiempoMinutos;
    if (newTotalAssignedTime >= remainingDowntimeMinutes) {
      // If all time has been assigned, show the summary
      setShowAddParoDialog(false);
      setShowSummaryDialog(true);
    }
  };

  // Function to initialize a new paro
  const initializeNewParo = (remainingTime: number) => {
    const tipoParo = stopTypes.find(tipo => tipo.nombre === currentParoType);
    if (tipoParo) {
      // Create a new paro with default values
      // Always provide a reasonable default time (5 minutes) if remaining time is too low
      const defaultTime = Math.max(5, Math.min(remainingTime, 15));
      
      const newParo: Paro = {
        tiempoMinutos: remainingTime > 0 ? defaultTime : 5,
        tipoParoId: tipoParo.id,
        tipoParoNombre: tipoParo.nombre,
        descripcion: "",
        ...(currentParoType !== "Calidad" && {
          sistemaId: "",  // Empty string instead of placeholder
          subsistemaId: undefined,  // undefined instead of placeholder
          subsubsistemaId: undefined  // undefined instead of placeholder
        }),
        ...(currentParoType === "Calidad" && {
          desviacionCalidadId: "placeholder",
          materiaPrimaId: "placeholder"
        })
      };
      setCurrentParo(newParo);
    }
  };

  // Function to move to the next paro type
  const handleNextParoType = () => {
    // Verificar que se completó un paro de este tipo antes de pasar al siguiente
    if (currentParoType === "Mantenimiento") {
      // Cambiar a paro de Calidad
      setCurrentParoType("Calidad");
      
      // Buscar tipo de paro Calidad
      const calidadTipo = stopTypes.find(tipo => tipo.nombre === "Calidad");
      
      if (!calidadTipo) {
        toast.error("Error: No se encontró el tipo de paro Calidad");
        return;
      }
      
      // Preparar objeto de paro de Calidad con tiempo en 0
      setCurrentParo({
        tiempoMinutos: 0,  // Iniciar con 0 para no sugerir tiempo
        tipoParoId: calidadTipo.id,
        tipoParoNombre: calidadTipo.nombre,
        desviacionCalidadId: "",
        materiaPrimaId: undefined,
        sistemaId: undefined,
        subsistemaId: undefined,
        subsubsistemaId: undefined,
        descripcion: ""
      });
      
    } else if (currentParoType === "Calidad") {
      // Cambiar a paro de Operación
      setCurrentParoType("Operación");
      
      // Buscar tipo de paro Operación
      const operacionTipo = stopTypes.find(tipo => tipo.nombre === "Operación");
      
      if (!operacionTipo) {
        toast.error("Error: No se encontró el tipo de paro Operación");
        return;
      }
      
      // Calcular minutos restantes por asignar
      const totalMinutosAsignados = [...parosMantenimiento, ...parosCalidad].reduce(
        (sum, paro) => sum + (paro.tiempoMinutos || 0), 
        0
      );
      
      const minutosRestantes = remainingDowntimeMinutes - totalMinutosAsignados;
      
      // Preparar objeto de paro de Operación con el tiempo restante
      setCurrentParo({
        tiempoMinutos: Math.max(0, minutosRestantes),  // Sugerir el tiempo restante para operación
        tipoParoId: operacionTipo.id,
        tipoParoNombre: operacionTipo.nombre,
        sistemaId: "",
        subsistemaId: undefined,
        subsubsistemaId: undefined,
        descripcion: ""
      });
    }
    
    // Resetear el índice de edición cuando cambiamos de tipo
    setEditingParoIndex(null);
  };

  // Function to edit a paro
  const handleEditParo = (index: number) => {
    let paroToEdit: Paro;
    
    if (currentParoType === "Mantenimiento") {
      paroToEdit = {...parosMantenimiento[index]};
    } else if (currentParoType === "Calidad") {
      paroToEdit = {...parosCalidad[index]};
    } else {
      paroToEdit = {...parosOperacion[index]};
    }
    
    // Make sure we're working with a copy, not a reference
    setCurrentParo({...paroToEdit});
    setEditingParoIndex(index);
  };

  // Function to delete a paro
  const handleDeleteParo = (index: number, paroType?: string) => {
    // Use provided paroType or fall back to currentParoType
    const typeToUse = paroType || currentParoType;
    
    // Delete from the appropriate list based on paroType
    if (typeToUse === "Mantenimiento") {
      const updatedParos = [...parosMantenimiento];
      updatedParos.splice(index, 1);
      setParosMantenimiento(updatedParos);
    } else if (typeToUse === "Calidad") {
      const updatedParos = [...parosCalidad];
      updatedParos.splice(index, 1);
      setParosCalidad(updatedParos);
    } else if (typeToUse === "Operación") {
      const updatedParos = [...parosOperacion];
      updatedParos.splice(index, 1);
      setParosOperacion(updatedParos);
    }
    
    toast.success("Paro eliminado correctamente");
  };

  // Function to render the paros table
  const renderParosTable = () => {
    let currentParos: Paro[] = [];
    
    if (currentParoType === "Mantenimiento") {
      currentParos = parosMantenimiento;
    } else if (currentParoType === "Calidad") {
      currentParos = parosCalidad;
    } else {
      currentParos = parosOperacion;
    }
    
    if (currentParos.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No hay paros de {currentParoType} registrados
        </div>
      );
    }
    
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiempo (min)</TableHead>
              <TableHead>Sistema</TableHead>
              <TableHead>Subsistema</TableHead>
              <TableHead>Subsubsistema</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentParos.map((paro, index) => (
              <TableRow key={index}>
                <TableCell>{paro.tiempoMinutos}</TableCell>
                <TableCell>{getSistemaNombre(paro.sistemaId || "")}</TableCell>
                <TableCell>{getSubsistemaNombre(paro.subsistemaId || "")}</TableCell>
                <TableCell>{getSubsubsistemaNombre(paro.subsubsistemaId || "")}</TableCell>
                <TableCell className="max-w-[200px] truncate">{paro.descripcion}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditParo(index)}
                      className="h-8 w-8 rounded-full hover:bg-primary-light/30 dark:hover:bg-primary-dark/30 transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-primary dark:text-primary-light" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteParo(index, "Mantenimiento")}
                      className="h-8 w-8 rounded-full hover:bg-error-light dark:hover:bg-error-dark/30 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-error" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const getFilteredSubsistemas = (sistemaId: string) => {
    return subsistemas.filter(subsistema => subsistema.systemId === sistemaId);
  };
  
  const getFilteredSubsubsistemas = (subsistemaId: string) => {
    return subsubsistemas.filter(subsubsistema => subsubsistema.subsystemId === subsistemaId);
  };
  
  const getTipoParoNombre = (tipoParoId: string) => {
    const tipo = stopTypes.find(type => type.id === tipoParoId);
    return tipo ? tipo.nombre : "Desconocido";
  };
  
  const getSistemaNombre = (sistemaId: string) => {
    const sistema = sistemas.find(s => s.id === sistemaId);
    return sistema ? sistema.name : "Desconocido";
  };
  
  const getSubsistemaNombre = (subsistemaId: string) => {
    const subsistema = subsistemas.find(s => s.id === subsistemaId);
    return subsistema ? subsistema.name : "Desconocido";
  };
  
  const getSubsubsistemaNombre = (subsubsistemaId: string) => {
    const subsubsistema = subsubsistemas.find(s => s.id === subsubsistemaId);
    return subsubsistema ? subsubsistema.name : "Desconocido";
  };

  // Reset hourly production when opening the dialog
  const handleOpenHourlyUpdate = () => {
    setHourlyProduction("");
    setIsFinalizingProduction(false); // Marcar explícitamente que es solo actualización
    setShowHourlyUpdate(true);
  };

  // Function to store lastUpdateTime in localStorage
  const storeLastUpdateTime = useCallback((orderId: string, timestamp: Date) => {
    if (!orderId) return;
    
    try {
      const storageKey = `lastUpdateTime_${orderId}`;
      localStorage.setItem(storageKey, timestamp.toISOString());
      console.log(`Stored lastUpdateTime for order ${orderId}:`, timestamp.toISOString());
    } catch (error) {
      console.error('Error storing lastUpdateTime in localStorage:', error);
    }
  }, []);

  // Function to retrieve lastUpdateTime from localStorage
  const getStoredLastUpdateTime = useCallback((orderId: string): Date | null => {
    if (!orderId) return null;
    
    try {
      const storageKey = `lastUpdateTime_${orderId}`;
      const storedTime = localStorage.getItem(storageKey);
      
      if (storedTime) {
        console.log(`Retrieved lastUpdateTime for order ${orderId}:`, storedTime);
        return new Date(storedTime);
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving lastUpdateTime from localStorage:', error);
      return null;
    }
  }, []);

  // Update timeElapsed every minute
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (lastUpdateTime && order?.estado === "en_progreso") {
      // Calculo inicial inmediato
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60));
      setTimeElapsed(diffMinutes);
      
      // Log para debug
      console.log(`[Timer Effect] lastUpdateTime: ${lastUpdateTime.toISOString()}, diffMinutes: ${diffMinutes}`);
      
      // Actualizar cada minuto
      interval = setInterval(() => {
        const currentTime = new Date();
        const currentDiffMinutes = Math.floor((currentTime.getTime() - lastUpdateTime.getTime()) / (1000 * 60));
        
        console.log(`[Timer Update] currentTime: ${currentTime.toISOString()}, lastUpdateTime: ${lastUpdateTime.toISOString()}, diff: ${currentDiffMinutes}min`);
        
        setTimeElapsed(currentDiffMinutes);
      }, 60000); // Update every minute
    } else {
      // Si no hay lastUpdateTime o la orden no está en progreso, resetear el tiempo transcurrido
      setTimeElapsed(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [lastUpdateTime, order?.estado]);

  // Add function to handle reopening production
  const handleReopenProduction = async () => {
    if (!order) return;
    
    setIsReopening(true);
    
    try {
      const response = await fetch(`/api/production-orders/${order.id}/reopen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("API error response:", errorData);
        throw new Error(errorData?.message || "Error al reabrir la producción");
      }
      
      // Reset state for hourly production
      setHourlyProduction("");
      setFinalHourlyProduction("");
      
      // Reset countdown timer
      const now = new Date();
      setLastUpdateTime(now);
      
      // Set next update time to 1 hour from now
      const nextUpdate = new Date(now);
      nextUpdate.setHours(nextUpdate.getHours() + 1);
      setNextUpdateTime(nextUpdate);
      
      // Reset countdown values
      setCountdownMinutes(60);
      setCountdownSeconds(0);
      
      // Reset countdown warnings
      setShowCountdownWarning(false);
      
      // Reset the "first load" state to true to avoid immediate prompts
      setIsFirstLoad(true);
      
      // Store the lastUpdateTime in localStorage to persist across refreshes
      if (order.id) {
        const storageKey = `lastUpdateTime_${order.id}`;
        localStorage.setItem(storageKey, now.toISOString());
        console.log(`Stored lastUpdateTime for order ${order.id}:`, now.toISOString());
        
        // Also store a flag to indicate this order was just reopened
        // This will help ensure the page fully refreshes with the new state
        localStorage.setItem(`reopened_${order.id}`, "true");
      }
      
      toast.success("Producción reabierta correctamente");
      
      // Redirect to the production page with this order
      setTimeout(() => {
        try {
          console.log(`Redirecting to order page for order ID: ${order.id}`);
          // Force a hard navigation to ensure a fresh page load with the reopened order
          // Add timestamp to prevent caching
          window.location.href = `/production-chief?orderId=${order.id}&reopened=true&t=${Date.now()}`;
        } catch (redirectError) {
          console.error("Error during redirect:", redirectError);
          // Use router as fallback
          router.push(`/production-chief?orderId=${order.id}&reopened=true`);
        }
      }, 1000); // Reduced delay for better user experience
      
    } catch (err) {
      console.error("Error reopening production:", err);
      toast.error(err instanceof Error ? err.message : "Error al reabrir la producción");
    } finally {
      setIsReopening(false);
    }
  };

  // Function to add a new note
  const handleAddNote = () => {
    if (!currentNote.trim()) return;
    
    if (productionNotes.length >= 6) {
      toast.error("Máximo 6 notas permitidas");
      return;
    }
    
    const newNote: ProductionNote = {
      id: crypto.randomUUID(),
      content: currentNote.trim(),
      timestamp: new Date()
    };
    
    setProductionNotes([...productionNotes, newNote]);
    setCurrentNote("");
    toast.success("Nota agregada correctamente");
  };

  // Function to edit a note
  const handleEditNote = (noteId: string) => {
    const note = productionNotes.find(n => n.id === noteId);
    if (note) {
      setInlineEditNote(note.content);
      setEditingNoteId(noteId);
    }
  };

  // Function to update a note
  const handleUpdateNote = () => {
    if (!editingNoteId || !currentNote.trim()) return;
    
    setProductionNotes(productionNotes.map(note => 
      note.id === editingNoteId 
        ? { ...note, content: currentNote.trim(), timestamp: new Date() }
        : note
    ));
    
    setCurrentNote("");
    setEditingNoteId(null);
    toast.success("Nota actualizada correctamente");
  };

  // Function to delete a note
  const handleDeleteNote = (noteId: string) => {
    setProductionNotes(productionNotes.filter(note => note.id !== noteId));
    toast.success("Nota eliminada correctamente");
  };

  // Add new function for inline update
  const handleInlineUpdateNote = (noteId: string) => {
    if (!inlineEditNote.trim()) return;
    
    setProductionNotes(productionNotes.map(note => 
      note.id === noteId 
        ? { ...note, content: inlineEditNote.trim(), timestamp: new Date() }
        : note
    ));
    
    setEditingNoteId(null);
    setInlineEditNote("");
    toast.success("Nota actualizada correctamente");
  };

  const handleSaveParo = async () => {
    if (!currentParo) return;

    // Validate required fields
    if (currentParo.tiempoMinutos <= 0) {
      toast.error("El tiempo debe ser mayor a 0 minutos");
      return;
    }

    if (currentParoType === "Calidad" && !currentParo.desviacionCalidadId) {
      toast.error("Debe seleccionar una desviación de calidad");
      return;
    } else if (currentParoType !== "Calidad" && !currentParo.sistemaId) {
      toast.error("Debe seleccionar un sistema");
      return;
    }

    try {
      const response = await fetch("/api/production-orders/stops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentParo,
          ordenProduccionId: order?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar el paro");
      }

      const data = await response.json();
      
      // Update paros list based on type
      if (currentParoType === "Mantenimiento") {
        setParosMantenimiento([...parosMantenimiento, data]);
      } else if (currentParoType === "Calidad") {
        setParosCalidad([...parosCalidad, data]);
      } else if (currentParoType === "Operación") {
        setParosOperacion([...parosOperacion, data]);
      }

      // Reset form
      setCurrentParo({
        tiempoMinutos: 0,
        tipoParoId: currentParoType === "Mantenimiento" ? "1" : currentParoType === "Calidad" ? "2" : "3",
        sistemaId: "",  // Empty string instead of placeholder
        subsistemaId: undefined,  // undefined instead of placeholder
        subsubsistemaId: undefined,  // undefined instead of placeholder
        desviacionCalidadId: "placeholder",
        descripcion: "",
      });

      toast.success("Paro guardado exitosamente");
    } catch (error) {
      console.error("Error saving paro:", error);
      toast.error("Error al guardar el paro");
    }
  };

  // Update parent component when production state changes
  useEffect(() => {
    if (onProductionStateChange && order) {
      onProductionStateChange(order.estado === "En Progreso");
    }
  }, [order?.estado, onProductionStateChange]);

  const handleOpenFinishDialog = () => {
    setFinishParos([]); // Limpiar paros para finalización de producción
    setIsFinalizingProduction(true); // Marcar explícitamente que es finalización
    setShowFinishDialog(true);
  };

  // Reset downtime-related states when starting a new operation
  const resetDowntimeStates = () => {
    setParosMantenimiento([]);
    setParosCalidad([]);
    setParosOperacion([]);
    setCurrentParo(null);
    setEditingParoIndex(null);
    setRemainingDowntimeMinutes(0);
    setFinalHourlyProduction("");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin-slow"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              <span className="absolute inset-0 animate-ping h-full w-full rounded-full bg-primary opacity-20"></span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Cargando información de la orden</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Por favor espere un momento...</p>
        </div>
        <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-primary rounded-full" style={{ width: '70%', animation: 'pulse 1.5s infinite' }}></div>
        </div>
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

  if (!orderId) {
    return (
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
    );
  }

  if (!order) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No se encontró la orden</AlertTitle>
        <AlertDescription>
          No se ha seleccionado ninguna orden de producción o la orden no existe.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Orden #{order.numeroOrden}</CardTitle>
              <CardDescription>
                Línea: {order.lineaProduccion.nombre} | Producto: {order.producto.nombre}
              </CardDescription>
            </div>
            <Badge variant={
              order.estado === "completada" ? "outline" : // Changed from secondary to outline
              order.estado === "en_progreso" ? "default" : "outline"
            } className={
              order.estado === "completada" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : // Added yellow styling
              order.estado === "en_progreso" ? "bg-green-100 text-green-800 hover:bg-green-100" : 
              "bg-gray-100 text-gray-800 hover:bg-gray-100"
            }>
              {order.estado === "completada" ? "Completada" :
               order.estado === "en_progreso" ? "En Progreso" : "Pendiente"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Progreso</span>
              <span className="text-sm">{getProgressPercentage()}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{totalCajasProducidas} cajas producidas</span>
              <span>{order.cajasPlanificadas} cajas planificadas</span>
            </div>
          </div>
          
          {order.estado === "pendiente" && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium">Orden pendiente de iniciar</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Para comenzar la producción, haga clic en el botón "Iniciar Producción".
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {order.estado === "en_progreso" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">Cajas Producidas Totales</span>
                  <p className="text-xl font-bold">{totalCajasProducidas}</p>
                </div>
                
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Última actualización</span>
                  <p className="font-medium">
                    {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : "No actualizado"}
                  </p>
                </div>
              </div>
              
              {showHourlyUpdate && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Actualización por hora</AlertTitle>
                  <AlertDescription>
                    Ha pasado una hora desde la última actualización. Por favor, actualice la información de producción.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {order.estado === "completada" && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start">
                <ClipboardCheck className="h-5 w-5 text-primary mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium">Orden completada</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta orden de producción ha sido completada. Puede ver el resumen o los paros registrados.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          {order.estado === "pendiente" && (
            <Button 
              onClick={handleStartProduction} 
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" 
              disabled={isStarting}
              size="lg"
            >
              {isStarting ? (
                <>
                  <div className="mr-2 relative">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="absolute inset-0 animate-ping h-full w-full rounded-full bg-white opacity-20"></span>
                  </div>
                  <span className="animate-pulse">Iniciando producción...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Iniciar Producción
                </>
              )}
            </Button>
          )}
          
          {order.estado === "en_progreso" && (
            <div className="w-full space-y-3">
              {/* Countdown Timer */}
              <div className={`rounded-md p-3 mb-2 flex items-center justify-between ${
                showCountdownWarning 
                  ? "bg-red-50 border border-red-200 text-red-800" 
                  : "bg-blue-50 border border-blue-200 text-blue-800"
              }`}>
                <div className="flex items-center">
                  <Clock className={`h-5 w-5 mr-2 ${showCountdownWarning ? "text-red-500" : "text-blue-500"}`} />
                  <div>
                    <p className="text-sm font-medium">
                      {showCountdownWarning && countdownMinutes === 0 && countdownSeconds === 0
                        ? "¡Tiempo de actualizar la producción!"
                        : "Próxima actualización en:"}
                    </p>
                    {!(showCountdownWarning && countdownMinutes === 0 && countdownSeconds === 0) && (
                      <p className="text-2xl font-bold">
                        {countdownMinutes.toString().padStart(2, '0')}:{countdownSeconds.toString().padStart(2, '0')}
                      </p>
                    )}
                  </div>
                </div>
                {showCountdownWarning && (
                  <Button 
                    onClick={handleOpenHourlyUpdate}
                    size="sm"
                    className="bg-warning hover:bg-warning-dark text-white font-medium transition-all duration-200"
                  >
                    Actualizar Ahora
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleOpenHourlyUpdate} 
                  variant="default"
                  className="bg-primary hover:bg-primary-dark text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
                >
                  <Clock className="mr-2 h-5 w-5" /> Actualizar por Hora
                </Button>
                
                <Button 
                  onClick={handleOpenFinishDialog} 
                  variant="outline"
                  className="border-success text-success hover:bg-success-light hover:border-success-dark transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
                >
                  <CheckCircle className="mr-2 h-5 w-5" /> Finalizar Producción
                </Button>
              </div>
            </div>
          )}
          
          {order.estado === "completada" && (
            <div className="w-full">
              {/* Only show the Reopen Production button */}
              <Button 
                onClick={handleReopenProduction} 
                variant="default"
                disabled={isReopening}
                className="w-full bg-gradient-to-r from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary text-white transition-all duration-300 hover:shadow-lg"
                size="lg"
              >
                {isReopening ? (
                  <>
                    <div className="relative mr-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="absolute inset-0 animate-ping h-full w-full rounded-full bg-white opacity-20"></span>
                    </div>
                    <span className="animate-pulse">Reabriendo producción...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin-slow" /> Reabrir Producción
                  </>
                )}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Hourly Update Dialog */}
      <Dialog open={showHourlyUpdate} onOpenChange={setShowHourlyUpdate}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Actualización por Hora</DialogTitle>
            <DialogDescription>
              Ingrese la cantidad de cajas producidas en la última hora.
              <Button
                variant="outline"
                size="sm"
                className="mt-2 flex items-center gap-1"
                onClick={() => {
                  // Cerrar el diálogo actual
                  setShowHourlyUpdate(false);
                  
                  // Restablecer el valor de producción por hora
                  setHourlyProduction("");
                  
                  // Abrir nuevamente el diálogo de actualización por hora
                  setTimeout(() => setShowHourlyUpdate(true), 100);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Corregir cajas producidas
              </Button>
            </DialogDescription>
          </DialogHeader>
          
          {/* Production Notes Section - Moved to top */}
          {productionNotes.length > 0 && (
            <div className="border rounded-lg p-4 mb-4">
              <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Notas de Producción
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {productionNotes.map((note) => (
                  <div 
                    key={note.id}
                    className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-sm border-b-4 border-yellow-200 dark:border-yellow-800 shadow-md transform rotate-1 hover:rotate-0 transition-transform duration-200 relative"
                    style={{
                      backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.2), transparent)',
                    }}
                  >
                    <p className="font-handwriting text-sm text-gray-800 dark:text-gray-200">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hourlyProduction" className="text-right font-medium">
                Cajas producidas
              </Label>
              <Input
                id="hourlyProduction"
                type="number"
                value={hourlyProduction}
                onChange={(e) => setHourlyProduction(e.target.value)}
                className="col-span-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                placeholder="Ingrese la cantidad de cajas"
              />
            </div>
            {order?.producto?.velocidadProduccion && (
              <div className="text-sm text-muted-foreground px-4 py-2 bg-muted/30 rounded-md border border-muted/50">
                <span className="font-medium">Velocidad registrada:</span> {order.producto.velocidadProduccion} cajas/hora
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowHourlyUpdate(false)}
              className="border-border hover:bg-surface transition-all"
            >
              Cancelar
            </Button>
            <Button 
              variant="default" 
              onClick={handleStartParosRegistration}
              disabled={!hourlyProduction || isNaN(parseInt(hourlyProduction))}
              className="bg-primary hover:bg-primary-dark text-white transition-all duration-200"
            >
              {isUpdating ? (
                <>
                  <div className="relative mr-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="absolute inset-0 animate-ping h-full w-full rounded-full bg-white opacity-20"></span>
                  </div>
                  <span className="animate-pulse">Procesando...</span>
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Paro Dialog */}
      <Dialog open={showAddParoDialog} onOpenChange={(open) => {
        if (!open && currentParo && (currentParo.tiempoMinutos > 0 || currentParo.sistemaId !== "")) {
          setShowAddParoCloseConfirmDialog(true);
        } else {
          setShowAddParoDialog(open);
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className={`flex items-center ${
              currentParoType === "Mantenimiento" 
                ? "text-blue-700" 
                : currentParoType === "Calidad" 
                  ? "text-amber-700" 
                  : currentParoType === "Operación" 
                    ? "text-green-700" 
                    : ""
            }`}>
              {currentParoType === "Mantenimiento" && (
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              )}
              {currentParoType === "Calidad" && (
                <span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
              )}
              {currentParoType === "Operación" && (
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              )}
              {editingParoIndex !== null ? (
                `Editar Paro por ${currentParoType}`
              ) : (
                <>
                  {currentParoType === "Mantenimiento" && "Registrar Paro por Mantenimiento (Paso 1 de 3)"}
                  {currentParoType === "Calidad" && "Registrar Paro por Calidad (Paso 2 de 3)"}
                  {currentParoType === "Operación" && "Registrar Paro por Operación (Paso 3 de 3)"}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingParoIndex !== null ? (
                "Modifique la información del paro seleccionado."
              ) : (
                <span className="flex flex-col space-y-2">
                  <span>
                    {currentParoType === "Mantenimiento" && "Registre los paros por mantenimiento indicando sistema, subsistema y subsubsistema."}
                    {currentParoType === "Calidad" && "Registre los paros por calidad indicando el sistema afectado."}
                    {currentParoType === "Operación" && "Registre los paros por operación indicando el sistema afectado."}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Close the paros dialog
                      setShowAddParoDialog(false);
                      
                      // Reset the hourly production value to allow correction
                      setHourlyProduction(finalHourlyProduction || "");
                      
                      // Open the hourly update dialog again
                      setShowHourlyUpdate(true);
                    }}
                    className="text-xs flex items-center gap-1 self-end"
                  >
                    <ArrowLeft className="h-3 w-3" /> Corregir cajas producidas
                  </Button>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {/* Production Notes Section - Post-it style */}
          {productionNotes.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-3">
                {productionNotes.map((note) => (
                  <div 
                    key={note.id}
                    className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-sm border-b-4 border-yellow-200 dark:border-yellow-800 shadow-md transform rotate-1 hover:rotate-0 transition-transform duration-200 relative"
                    style={{
                      backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.2), transparent)',
                    }}
                  >
                    <p className="font-handwriting text-sm text-gray-800 dark:text-gray-200">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Left column for paro form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tiempoMinutos">Tiempo (minutos)</Label>
                      <Input
                      id="tiempoMinutos"
                        type="number"
                      value={currentParo?.tiempoMinutos || 0}
                      onChange={(e) => {
                        if (currentParo) {
                          setCurrentParo({
                            ...currentParo,
                            tiempoMinutos: parseInt(e.target.value) || 0
                          });
                        }
                      }}
                      className={`${
                        currentParoType === "Mantenimiento" 
                          ? "focus-visible:ring-blue-500" 
                          : currentParoType === "Calidad" 
                            ? "focus-visible:ring-amber-500" 
                            : currentParoType === "Operación" 
                              ? "focus-visible:ring-green-500" 
                              : ""
                      }`}
                      />
                    </div>
                    
                  {/* Remaining time display */}
                  <div className="flex items-center justify-end">
                    <div className="text-sm text-muted-foreground">
                      <p>Tiempo total a asignar: {remainingDowntimeMinutes} min</p>
                      <p>Tiempo asignado: {
                        [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                          .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                          .reduce((sum, paro) => sum + paro.tiempoMinutos, 0)
                      } min</p>
                      <p>Tiempo restante: {
                        remainingDowntimeMinutes - 
                        [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                          .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                          .reduce((sum, paro) => sum + paro.tiempoMinutos, 0)
                      } min</p>
                    </div>
                  </div>
                </div>
                
                {/* Sistema or Desviacion selection based on paro type */}
                <div>
                  <Label htmlFor={currentParoType === "Calidad" ? "desviacion" : "sistema"}>
                    {currentParoType === "Calidad" ? "Desviación de Calidad" : "Sistema"}
                  </Label>
                  <Select
                    value={currentParoType === "Calidad" ? (currentParo?.desviacionCalidadId || "placeholder") : (currentParo?.sistemaId || "placeholder")}
                    onValueChange={(value) => {
                      if (currentParo && value !== "placeholder") {
                        if (currentParoType === "Calidad") {
                          setCurrentParo({
                            ...currentParo,
                            desviacionCalidadId: value,
                            sistemaId: undefined,
                            subsistemaId: undefined,
                            subsubsistemaId: undefined,
                            materiaPrimaId: undefined
                          });
                        } else {
                          setCurrentParo({
                            ...currentParo,
                            sistemaId: value,
                            subsistemaId: undefined,  // undefined instead of placeholder
                            subsubsistemaId: undefined  // undefined instead of placeholder
                          });
                        }
                      }
                    }}
                  >
                    <SelectTrigger className={`${
                      currentParoType === "Mantenimiento" 
                        ? "focus-visible:ring-blue-500 border-blue-200" 
                        : currentParoType === "Calidad" 
                          ? "focus-visible:ring-amber-500 border-amber-200" 
                          : currentParoType === "Operación" 
                            ? "focus-visible:ring-green-500 border-green-200" 
                            : ""
                    }`}>
                      <SelectValue placeholder={currentParoType === "Calidad" ? "Seleccione una desviación" : "Seleccione un sistema"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder">
                        {currentParoType === "Calidad" ? "Seleccione una desviación" : "Seleccione un sistema"}
                      </SelectItem>
                      {currentParoType === "Calidad" 
                        ? desviacionesCalidad.map((desviacion) => (
                            <SelectItem key={desviacion.id} value={desviacion.id}>
                              {desviacion.nombre}
                            </SelectItem>
                          ))
                        : sistemas.map((sistema) => (
                            <SelectItem key={sistema.id} value={sistema.id}>
                              {sistema.name}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                {/* Materia Prima selection - only for Calidad when desviacion is "Materia prima" */}
                {currentParoType === "Calidad" && 
                  currentParo?.desviacionCalidadId && 
                  currentParo.desviacionCalidadId !== "placeholder" &&
                  desviacionesCalidad.find(d => d.id === currentParo.desviacionCalidadId)?.nombre === "Materia prima" && (
                  <div className="space-y-2">
                    <Label htmlFor="materiaPrima">Materia Prima</Label>
                    <Select
                      value={currentParo?.materiaPrimaId || "placeholder"}
                      onValueChange={(value) => {
                        if (currentParo) {
                          setCurrentParo({
                            ...currentParo,
                            materiaPrimaId: value
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="focus-visible:ring-amber-500 border-amber-200">
                        <SelectValue placeholder="Seleccione una materia prima" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder">Seleccione una materia prima</SelectItem>
                        {materiasPrimas.map((materiaPrima) => (
                          <SelectItem key={materiaPrima.id} value={materiaPrima.id}>
                            {materiaPrima.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Subsistema selection - only for Mantenimiento */}
                {currentParoType === "Mantenimiento" && currentParo?.sistemaId && currentParo.sistemaId !== "placeholder" && (
                  <div>
                    <Label htmlFor="subsistema">Subsistema</Label>
                    <Select
                      value={currentParo?.subsistemaId || "placeholder"}
                      onValueChange={(value) => {
                        if (currentParo && value !== "placeholder") {
                          setCurrentParo({
                            ...currentParo,
                            subsistemaId: value,
                            subsubsistemaId: "placeholder"
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="focus-visible:ring-blue-500 border-blue-200">
                        <SelectValue placeholder="Seleccione un subsistema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder">Seleccione un subsistema</SelectItem>
                        {getFilteredSubsistemas(currentParo.sistemaId).map((subsistema) => (
                          <SelectItem key={subsistema.id} value={subsistema.id}>
                            {subsistema.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Subsubsistema selection - only for Mantenimiento */}
                {currentParoType === "Mantenimiento" && currentParo?.subsistemaId && currentParo.subsistemaId !== "placeholder" && (
                  <div>
                    <Label htmlFor="subsubsistema">Subsubsistema</Label>
                    <Select
                      value={currentParo?.subsubsistemaId || "placeholder"}
                      onValueChange={(value) => {
                        if (currentParo && value !== "placeholder") {
                          setCurrentParo({
                            ...currentParo,
                            subsubsistemaId: value
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="focus-visible:ring-blue-500 border-blue-200">
                        <SelectValue placeholder="Seleccione un subsubsistema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder">Seleccione un subsubsistema</SelectItem>
                        {getFilteredSubsubsistemas(currentParo.subsistemaId).map((subsubsistema) => (
                          <SelectItem key={subsubsistema.id} value={subsubsistema.id}>
                            {subsubsistema.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Add Paro button at the bottom of the form */}
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={handleAddParo}
                    disabled={
                      !currentParo || 
                      !currentParo.tiempoMinutos || 
                      currentParo.tiempoMinutos <= 0 || 
                      (currentParoType === "Calidad" ? (
                        !currentParo.desviacionCalidadId || 
                        currentParo.desviacionCalidadId === "placeholder" ||
                        (desviacionesCalidad.find(d => d.id === currentParo.desviacionCalidadId)?.nombre === "Materia prima" &&
                        (!currentParo.materiaPrimaId || currentParo.materiaPrimaId === "placeholder"))
                      ) : (
                        !currentParo.sistemaId ||
                        currentParo.sistemaId === "placeholder" ||
                        (currentParoType === "Mantenimiento" && (!currentParo.subsistemaId || currentParo.subsistemaId === "placeholder")) ||
                        (currentParoType === "Mantenimiento" && (!currentParo.subsubsistemaId || currentParo.subsubsistemaId === "placeholder"))
                      ))
                    }
                    className={`${
                      currentParoType === "Mantenimiento" 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : currentParoType === "Calidad" 
                          ? "bg-amber-600 hover:bg-amber-700" 
                          : currentParoType === "Operación" 
                            ? "bg-green-600 hover:bg-green-700" 
                            : ""
                    }`}
                  >
                    {editingParoIndex !== null ? (
                      <>
                        <Pencil className="mr-2 h-4 w-4" /> Actualizar Paro
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" /> Agregar Paro
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Paros table for the current type */}
                  <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-base">
                      {currentParoType === "Mantenimiento" && "Paros por Mantenimiento"}
                      {currentParoType === "Calidad" && "Paros por Calidad"}
                      {currentParoType === "Operación" && "Paros por Operación"}
                    </Label>
                  </div>
                  
                  {/* Render the appropriate paros table based on currentParoType */}
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {currentParoType === "Mantenimiento" && parosMantenimiento.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No hay paros por mantenimiento registrados
              </div>
                    )}
                    
                    {currentParoType === "Mantenimiento" && parosMantenimiento.map((paro, index) => (
                      <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 p-2 rounded-md">
                        <div>
                          <div className="font-medium text-blue-700">Mantenimiento - {paro.tiempoMinutos} min</div>
                          {paro.sistemaId && (
                            <div className="text-xs text-blue-600">
                              Sistema: {getSistemaNombre(paro.sistemaId)}
          </div>
                          )}
                          {paro.subsistemaId && (
                            <div className="text-xs text-blue-600">
                              Subsistema: {getSubsistemaNombre(paro.subsistemaId)}
                            </div>
                          )}
                          {paro.subsubsistemaId && (
                            <div className="text-xs text-blue-600">
                              Subsubsistema: {getSubsubsistemaNombre(paro.subsubsistemaId)}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:text-destructive" 
                          onClick={() => handleDeleteParo(index, "Mantenimiento")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    
                    {currentParoType === "Calidad" && parosCalidad.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No hay paros por calidad registrados
                      </div>
                    )}
                    
                    {currentParoType === "Calidad" && parosCalidad.map((paro, index) => (
                      <div key={index} className="flex items-center justify-between bg-amber-50 border border-amber-200 p-2 rounded-md">
                        <div>
                          <div className="font-medium text-amber-700">Calidad - {paro.tiempoMinutos} min</div>
                          {paro.sistemaId && (
                            <div className="text-xs text-amber-600">
                              Sistema: {getSistemaNombre(paro.sistemaId)}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:text-destructive" 
                          onClick={() => handleDeleteParo(index, "Calidad")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    
                    {currentParoType === "Operación" && parosOperacion.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No hay paros por operación registrados
                      </div>
                    )}
                    
                    {currentParoType === "Operación" && parosOperacion.map((paro, index) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 border border-green-200 p-2 rounded-md">
                        <div>
                          <div className="font-medium text-green-700">Operación - {paro.tiempoMinutos} min</div>
                          {paro.sistemaId && (
                            <div className="text-xs text-green-600">
                              Sistema: {getSistemaNombre(paro.sistemaId)}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:text-destructive" 
                          onClick={() => handleDeleteParo(index, "Operación")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                if (currentParo && (currentParo.tiempoMinutos > 0 || currentParo.sistemaId !== "placeholder")) {
                  // If there's unsaved data, show confirmation
                  setShowAddParoCloseConfirmDialog(true);
                } else {
                  // No data to lose, close directly
                  setShowAddParoDialog(false);
                }
              }}
            >
              Cancelar
            </Button>
            
            <div className="flex space-x-2">
              {/* Back button - Only show for Calidad and Operación */}
              {(currentParoType === "Calidad" || currentParoType === "Operación") && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Regresar al tipo anterior
                    if (currentParoType === "Calidad") {
                      setCurrentParoType("Mantenimiento");
                      // Buscar tipo de paro Mantenimiento
                      const mantenimientoTipo = stopTypes.find(tipo => tipo.nombre === "Mantenimiento");
                      if (mantenimientoTipo) {
                        setCurrentParo({
                          tiempoMinutos: 0,
                          tipoParoId: mantenimientoTipo.id,
                          tipoParoNombre: mantenimientoTipo.nombre,
                          sistemaId: "",
                          subsistemaId: undefined,
                          subsubsistemaId: undefined,
                          descripcion: ""
                        });
                      }
                    } else if (currentParoType === "Operación") {
                      setCurrentParoType("Calidad");
                      // Buscar tipo de paro Calidad
                      const calidadTipo = stopTypes.find(tipo => tipo.nombre === "Calidad");
                      if (calidadTipo) {
                        setCurrentParo({
                          tiempoMinutos: 0,
                          tipoParoId: calidadTipo.id,
                          tipoParoNombre: calidadTipo.nombre,
                          desviacionCalidadId: "",
                          materiaPrimaId: undefined,
                          sistemaId: undefined,
                          subsistemaId: undefined,
                          subsubsistemaId: undefined,
                          descripcion: ""
                        });
                      }
                    }
                    // Resetear el índice de edición cuando cambiamos de tipo
                    setEditingParoIndex(null);
                  }}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {currentParoType === "Calidad" && "Volver a Mantenimiento"}
                  {currentParoType === "Operación" && "Volver a Calidad"}
                </Button>
              )}
              
              {/* Botón para corregir cajas producidas - solo en primer paso */}
              {currentParoType === "Mantenimiento" && (
                <Button 
                  variant="outline" 
                  className="border-amber-200 text-amber-600 hover:text-amber-700 hover:bg-amber-50 flex items-center gap-1"
                  onClick={() => {
                    // Cerrar el diálogo de paros
                    setShowAddParoDialog(false);
                    
                    // Restaurar los valores de producción por hora
                    // El finalHourlyProduction se guarda en hourlyProduction para el diálogo de actualización
                    setHourlyProduction(finalHourlyProduction);
                    
                    // Abrir el diálogo de actualización por hora
                    setShowHourlyUpdate(true);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Corregir cajas
                </Button>
              )}
              
              {/* Forward navigation buttons */}
              {(currentParoType === "Mantenimiento" || currentParoType === "Calidad") && (
                <Button 
                  variant="default" 
                  onClick={handleNextParoType}
                >
                  {currentParoType === "Mantenimiento" && (
                    <>Continuar a Calidad <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                  {currentParoType === "Calidad" && (
                    <>Continuar a Operación <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              )}
              {currentParoType === "Operación" && (
                <Button 
                  variant="default" 
                  onClick={() => {
                    // Antes de mostrar el resumen, verificar si hay paros registrados con tiempo
                    // Si no hay, mostrar un mensaje
                    const totalParosRegistrados = [...parosMantenimiento, ...parosCalidad, ...parosOperacion].length;
                    if (totalParosRegistrados === 0 && remainingDowntimeMinutes > 0) {
                      toast.warning("Debe registrar al menos un paro antes de continuar");
                      return;
                    }
                    
                    setShowAddParoDialog(false);
                    setShowSummaryDialog(true);
                  }}
                >
                  Ver Resumen <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Finish Production Dialog */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Finalización de Producción</DialogTitle>
            <DialogDescription>
              Ingrese la cantidad de cajas producidas desde la última actualización.
              <Button
                variant="outline"
                size="sm"
                className="mt-2 flex items-center gap-1"
                onClick={() => {
                  // Cerrar el diálogo actual
                  setShowFinishDialog(false);
                  
                  // Restablecer el valor de producción final
                  setFinalHourlyProduction("");
                  
                  // Abrir nuevamente el diálogo de finalización de producción
                  setTimeout(() => setShowFinishDialog(true), 100);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Corregir cajas producidas
              </Button>
            </DialogDescription>
          </DialogHeader>
          
          {/* Production Notes Section - Moved to top */}
          {productionNotes.length > 0 && (
            <div className="border rounded-lg p-4 mb-4">
              <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Notas de Producción
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {productionNotes.map((note) => (
                  <div 
                    key={note.id}
                    className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-sm border-b-4 border-yellow-200 dark:border-yellow-800 shadow-md transform rotate-1 hover:rotate-0 transition-transform duration-200 relative"
                    style={{
                      backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.2), transparent)',
                    }}
                  >
                    <p className="font-handwriting text-sm text-gray-800 dark:text-gray-200">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="finalHourlyProduction" className="text-right font-medium">
                Cajas producidas
              </Label>
              <Input
                id="finalHourlyProduction"
                type="number"
                value={finalHourlyProduction}
                onChange={(e) => setFinalHourlyProduction(e.target.value)}
                className="col-span-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                placeholder="Ingrese la cantidad de cajas"
              />
            </div>
            {order?.producto?.velocidadProduccion && (
              <div className="text-sm text-muted-foreground px-4 py-2 bg-muted/30 rounded-md border border-muted/50">
                <span className="font-medium">Velocidad registrada:</span> {order.producto.velocidadProduccion} cajas/hora
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowFinishDialog(false)}
              className="border-border hover:bg-surface transition-all"
            >
              Cancelar
            </Button>
            <Button 
              variant="default" 
              onClick={handleFinishProduction}
              disabled={!finalHourlyProduction || isNaN(parseInt(finalHourlyProduction))}
              className="bg-primary hover:bg-primary-dark text-white transition-all duration-200"
            >
              {isUpdating ? (
                <>
                  <div className="relative mr-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="absolute inset-0 animate-ping h-full w-full rounded-full bg-white opacity-20"></span>
                  </div>
                  <span className="animate-pulse">Procesando...</span>
                </>
              ) : (
                "Finalizar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Paro Close Confirmation Dialog */}
      <Dialog open={showAddParoCloseConfirmDialog} onOpenChange={setShowAddParoCloseConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>¿Está seguro?</DialogTitle>
            <DialogDescription>
              Si cierra esta ventana, perderá los datos del paro que está registrando.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowAddParoCloseConfirmDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowAddParoCloseConfirmDialog(false);
                setShowAddParoDialog(false);
                // Reset current paro if not editing
                if (editingParoIndex === null) {
                  const tipoParoId = currentParo?.tipoParoId;
                  if (tipoParoId) {
                    setCurrentParo({
                      tiempoMinutos: 0,
                      tipoParoId,
                      sistemaId: "",  // Empty string instead of placeholder
                      subsistemaId: undefined,  // undefined instead of null
                      subsubsistemaId: undefined,  // undefined instead of null
                      descripcion: "",
                    });
                  }
                }
                setEditingParoIndex(null);
              }}
            >
              Sí, cerrar y perder cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Resumen Final de Producción</DialogTitle>
            <DialogDescription>
              Revise la información de producción y los paros registrados antes de guardar.
            </DialogDescription>
          </DialogHeader>
          
          {/* Production Notes Section - Post-it style */}
          {productionNotes.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-3">
                {productionNotes.map((note) => (
                  <div 
                    key={note.id}
                    className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-sm border-b-4 border-yellow-200 dark:border-yellow-800 shadow-md transform rotate-1 hover:rotate-0 transition-transform duration-200 relative"
                    style={{
                      backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.2), transparent)',
                    }}
                  >
                    <p className="font-handwriting text-sm text-gray-800 dark:text-gray-200">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Production Info Card */}
            <div className="bg-card rounded-lg border shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Información de Producción</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Orden de Producción:</p>
                  <p className="font-medium text-lg">{order?.numeroOrden}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Producto:</p>
                  <p className="font-medium text-lg">{order?.producto.nombre}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Cajas producidas en esta hora:</p>
                  <p className="font-medium text-lg">{finalHourlyProduction}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Tiempo total de paros:</p>
                  <p className="font-medium text-lg">{remainingDowntimeMinutes} minutos</p>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="bg-card rounded-lg border shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Progreso de Registro</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className={parosMantenimiento.length > 0 ? "font-medium" : "text-muted-foreground"}>
                    Mantenimiento {parosMantenimiento.length > 0 ? `(${parosMantenimiento.length})` : ""}
                  </span>
                  <span className={parosCalidad.length > 0 ? "font-medium" : "text-muted-foreground"}>
                    Calidad {parosCalidad.length > 0 ? `(${parosCalidad.length})` : ""}
                  </span>
                  <span className={parosOperacion.length > 0 ? "font-medium" : "text-muted-foreground"}>
                    Operación {parosOperacion.length > 0 ? `(${parosOperacion.length})` : ""}
                  </span>
                </div>
                <div className="flex space-x-1">
                  <div className={`h-2.5 flex-1 rounded-l-full ${parosMantenimiento.length > 0 ? "bg-blue-500" : "bg-muted"}`}></div>
                  <div className={`h-2.5 flex-1 ${parosCalidad.length > 0 ? "bg-amber-500" : "bg-muted"}`}></div>
                  <div className={`h-2.5 flex-1 rounded-r-full ${parosOperacion.length > 0 ? "bg-green-500" : "bg-muted"}`}></div>
                </div>
              </div>
            </div>

            {/* Paros Summary */}
            <div className="bg-card rounded-lg border shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Resumen de Paros</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Mantenimiento paros */}
                <div className="space-y-2 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-700 dark:text-blue-400">Mantenimiento</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      onClick={() => {
                        setShowSummaryDialog(false);
                        setCurrentParoType("Mantenimiento");
                        setShowAddParoDialog(true);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Paros registrados:</p>
                    <p className="font-medium">{parosMantenimiento.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tiempo total:</p>
                    <p className="font-medium">{parosMantenimiento.reduce((sum, paro) => sum + paro.tiempoMinutos, 0)} min</p>
                  </div>
                </div>

                {/* Calidad paros */}
                <div className="space-y-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-amber-700 dark:text-amber-400">Calidad</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                      onClick={() => {
                        setShowSummaryDialog(false);
                        setCurrentParoType("Calidad");
                        setShowAddParoDialog(true);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Paros registrados:</p>
                    <p className="font-medium">{parosCalidad.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tiempo total:</p>
                    <p className="font-medium">{parosCalidad.reduce((sum, paro) => sum + paro.tiempoMinutos, 0)} min</p>
                  </div>
                </div>

                {/* Operación paros */}
                <div className="space-y-2 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-green-700 dark:text-green-400">Operación</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                      onClick={() => {
                        setShowSummaryDialog(false);
                        setCurrentParoType("Operación");
                        setShowAddParoDialog(true);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Paros registrados:</p>
                    <p className="font-medium">{parosOperacion.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tiempo total:</p>
                    <p className="font-medium">{parosOperacion.reduce((sum, paro) => sum + paro.tiempoMinutos, 0)} min</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border shadow-sm">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tiempo Total Asignado</h4>
                <p className="text-2xl font-bold">
                  {[...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                    .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                    .reduce((sum, paro) => sum + paro.tiempoMinutos, 0)} minutos
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border shadow-sm">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tiempo Restante por Asignar</h4>
                <p className={`text-2xl font-bold ${
                  remainingDowntimeMinutes - 
                  [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                    .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                    .reduce((sum, paro) => sum + paro.tiempoMinutos, 0) > 0 
                    ? "text-amber-500" 
                    : "text-green-500"
                }`}>
                  {remainingDowntimeMinutes - 
                   [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                     .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                     .reduce((sum, paro) => sum + paro.tiempoMinutos, 0)} minutos
                </p>
                {remainingDowntimeMinutes - 
                   [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                     .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                     .reduce((sum, paro) => sum + paro.tiempoMinutos, 0) > 0 && (
                    <p className="text-sm font-normal text-amber-500 mt-1">
                      Debe asignar todo el tiempo antes de guardar
                    </p>
                )}
              </div>
            </div>
          </div>

          {/* Dialog Footer con botones */}
          <DialogFooter className="flex justify-between pt-4 border-t mt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSummaryDialog(false);
                setShowAddParoDialog(true);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Paros
            </Button>
            <Button 
              onClick={completeFinishProduction}
              disabled={isUpdating}
              className="bg-primary hover:bg-primary/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  Guardar y Finalizar <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <Dialog open={showCloseConfirmDialog} onOpenChange={setShowCloseConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>¿Está seguro?</DialogTitle>
            <DialogDescription>
              Si cierra esta ventana, perderá todo el progreso de registro de paros. 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowCloseConfirmDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowCloseConfirmDialog(false);
                setShowSummaryDialog(false);
                // Reset paros data
                setParosMantenimiento([]);
                setParosCalidad([]);
                setParosOperacion([]);
              }}
            >
              Sí, cerrar y perder cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Additional Information Card */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">Estado</h3>
          <Badge className={order?.estado === "en_progreso" ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"}>
            {order?.estado === "pendiente" ? "Pendiente" : 
             order?.estado === "en_progreso" ? "En Progreso" : 
             "Completada"}
          </Badge>
        </div>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Última actualización</p>
              <p className="text-sm font-medium">
                {lastUpdateTime ? lastUpdateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "No actualizado"}
              </p>
            </div>
          </div>
          
          {/* Time elapsed since last update */}
          {lastUpdateTime && order?.estado === "en_progreso" && (
            <div className="flex items-center">
              <Timer className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Tiempo desde última actualización</p>
                <p className="text-sm font-medium">
                  {formatTime(timeElapsed)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Production Notes Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Notas de Producción
          </CardTitle>
          <CardDescription>
            Agregue notas o recordatorios importantes durante la producción (máximo 6)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Note Input */}
            <div className="flex gap-2">
              <Input
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Escriba una nota..."
                className="flex-1"
                maxLength={200}
              />
              <Button 
                onClick={editingNoteId ? handleUpdateNote : handleAddNote}
                disabled={!currentNote.trim() || (productionNotes.length >= 6 && !editingNoteId)}
                className="whitespace-nowrap"
              >
                {editingNoteId ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Actualizar
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar
                  </>
                )}
              </Button>
            </div>

            {/* Notes List */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {productionNotes.length === 0 ? (
                <div className="col-span-full text-center py-4 text-muted-foreground">
                  No hay notas registradas
                </div>
              ) : (
                productionNotes.map((note, index) => (
                  <div 
                    key={note.id}
                    className={`p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-sm border-b-4 border-yellow-200 dark:border-yellow-800 shadow-md relative group transform ${
                      index % 2 === 0 ? 'rotate-1' : '-rotate-1'
                    } hover:rotate-0 transition-all duration-200`}
                    style={{
                      backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.2), transparent)',
                    }}
                  >
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={inlineEditNote}
                          onChange={(e) => setInlineEditNote(e.target.value)}
                          className="w-full bg-transparent border-none focus:ring-0 font-handwriting text-sm text-gray-800 dark:text-gray-200 resize-none min-h-[80px]"
                          maxLength={200}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleInlineUpdateNote(note.id);
                            }
                            if (e.key === 'Escape') {
                              setEditingNoteId(null);
                              setInlineEditNote("");
                            }
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingNoteId(null);
                              setInlineEditNote("");
                            }}
                            className="h-7 px-2 text-xs hover:bg-red-100"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleInlineUpdateNote(note.id)}
                            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-handwriting text-sm text-gray-800 dark:text-gray-200 mb-2">{note.content}</p>
                        
                        {/* Action buttons - only show on hover */}
                        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => handleEditNote(note.id)}
                            className="h-7 w-7 bg-white shadow-md hover:bg-gray-100"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-7 w-7 bg-white shadow-md hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 