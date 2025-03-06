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
import { AlertCircle, Clock, ClipboardCheck, AlertTriangle, ArrowRight, Loader2, Plus, Trash2, Pencil, CheckCircle, ArrowLeft, Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  descripcion?: string;
};

export function ProductionStatus() {
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

  // Function to calculate stop minutes based on hourly production
  const calculateStopMinutes = (boxesProduced: number) => {
    // Get the expected production speed (boxes per hour)
    const expectedBoxesPerHour = order?.producto?.velocidadProduccion || 0;
    
    if (expectedBoxesPerHour <= 0) {
      console.log("No valid production speed available");
      return 30; // Default to 30 minutes if no valid production speed
    }
    
    // Calculate how many boxes should have been produced in 60 minutes at full capacity
    const expectedBoxes = expectedBoxesPerHour;
    
    // Calculate the percentage of production achieved
    const productionPercentage = boxesProduced / expectedBoxes;
    
    // Calculate the effective production time in minutes (out of 60 minutes)
    const effectiveProductionMinutes = productionPercentage * 60;
    
    // The stop time is the remaining time out of 60 minutes
    const stopMinutes = Math.round(60 - effectiveProductionMinutes);
    
    console.log("Expected boxes per hour:", expectedBoxesPerHour);
    console.log("Actual boxes produced:", boxesProduced);
    console.log("Production percentage:", productionPercentage);
    console.log("Effective production minutes:", effectiveProductionMinutes);
    console.log("Calculated stop minutes:", stopMinutes);
    
    // Ensure we return a non-negative value
    return Math.max(0, stopMinutes);
  };

  useEffect(() => {
    // Update stop minutes whenever hourly production changes
    if (hourlyProduction && parseInt(hourlyProduction) > 0 && order?.producto?.velocidadProduccion) {
      const calculatedStopMinutes = calculateStopMinutes(parseInt(hourlyProduction));
      setStopMinutes(calculatedStopMinutes);
    } else {
      setStopMinutes(0);
    }
  }, [hourlyProduction, order]);

  useEffect(() => {
    // Get the orderId from the URL query parameters
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orderId");
    console.log("OrderId from URL:", id);
    
    if (id) {
      setOrderId(id);
    }
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchStopTypes();
      fetchSistemas();
      fetchSubsistemas();
      fetchSubsubsistemas();
    }
  }, [orderId]);

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
      const response = await fetch("/api/production-lines/systems");
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
    const calculatedStopMinutes = calculateStopMinutes(hourlyProductionValue);
    
    // Set the final hourly production and remaining downtime minutes
    setFinalHourlyProduction(hourlyProduction);
    setRemainingDowntimeMinutes(calculatedStopMinutes);
    
    // Close hourly update dialog
    setShowHourlyUpdate(false);
    
    if (calculatedStopMinutes > 0) {
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
          tiempoMinutos: 0,
          tipoParoId: mantenimientoTipo.id,
          tipoParoNombre: mantenimientoTipo.nombre,
          sistemaId: "placeholder",
          subsistemaId: "placeholder",
          subsubsistemaId: "placeholder",
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
      
      const response = await fetch(`/api/production-orders/${order.id}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cajasProducidas: newCajasProducidas
        }),
      });
      
      if (!response.ok) {
        throw new Error("Error al actualizar la producción");
      }
      
      // Update total cajas
      setTotalCajasProducidas(newCajasProducidas);
      
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
      
      // Refresh the order data to get all updated fields
      await fetchOrder();
      setShowHourlyUpdate(false);
      toast.success("Producción actualizada correctamente");
    } catch (err) {
      console.error("Error updating production:", err);
      toast.error(err instanceof Error ? err.message : "Error al actualizar la producción");
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
    const calculatedStopMinutes = calculateStopMinutes(hourlyProductionValue);
    setRemainingDowntimeMinutes(calculatedStopMinutes);

    // Close hourly update dialog and start paros registration
    setShowHourlyUpdate(false);
    
    // Start with Mantenimiento
    setCurrentParoType("Mantenimiento");
    
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
        tiempoMinutos: 0,
        tipoParoId: mantenimientoTipo.id,
        tipoParoNombre: mantenimientoTipo.nombre,
        sistemaId: "placeholder",
        subsistemaId: "placeholder",
        subsubsistemaId: "placeholder",
        descripcion: "",
      });
      
      setShowAddParoDialog(true);
    } else {
      // If no stop minutes, just update production
      completeFinishProduction();
    }
  };

  const completeFinishProduction = async () => {
    setIsUpdating(true);
    
    try {
      if (!order) return;

      // Combine all paros
      const allParos = [...parosMantenimiento, ...parosCalidad, ...parosOperacion];
      
      console.log("Sending production data:", {
        cajasProducidas: totalCajasProducidas + parseInt(finalHourlyProduction),
        paros: allParos
      });

      const response = await fetch(`/api/production-orders/${order.id}/finish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          cajasProducidas: totalCajasProducidas + parseInt(finalHourlyProduction),
          paros: allParos
          }),
        });
        
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("API error response:", errorData);
        throw new Error(errorData?.message || "Error al finalizar la producción");
      }
      
      // Refresh the order data
      await fetchOrder();
      
      // Reset all paros lists
      setParosMantenimiento([]);
      setParosCalidad([]);
      setParosOperacion([]);
      
      // Reset hourly production
      setHourlyProduction("");
      setFinalHourlyProduction("");
      
      toast.success("Producción actualizada correctamente");
    } catch (err) {
      console.error("Error finishing production:", err);
      toast.error(err instanceof Error ? err.message : "Error al finalizar la producción");
    } finally {
      setIsUpdating(false);
      setShowAddParoDialog(false);
    }
  };

  // Function to finish the paro assignment process
  const finishParoAssignment = () => {
    // Combine all paros
    const allParos = [...parosMantenimiento, ...parosCalidad, ...parosOperacion];
    setParos(allParos);
    
    // Close the dialog
    setShowAddParoDialog(false);
    
    // Complete the finish production process
    completeFinishProduction();
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

    // Check if the sistema has been selected
    if (!currentParo.sistemaId || currentParo.sistemaId === "placeholder") {
      toast.error("Por favor seleccione un sistema");
      return;
    }
    
    // Check if subsistema and subsubsistema have been selected for Mantenimiento paros only
    if (currentParoType === "Mantenimiento") {
      if (!currentParo.subsistemaId || currentParo.subsistemaId === "placeholder") {
        toast.error("Por favor seleccione un subsistema");
        return;
      }
      
      if (!currentParo.subsubsistemaId || currentParo.subsubsistemaId === "placeholder") {
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
      sistemaId: "placeholder",
      subsistemaId: "placeholder",
      subsubsistemaId: "placeholder",
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
        descripcion: ""
      };
      setCurrentParo(newParo);
    }
  };

  // Function to move to the next paro type
  const handleNextParoType = () => {
    // Close the current dialog
    setShowAddParoDialog(false);
    
    // Calculate the total time assigned so far
    const totalAssignedTime = [
      ...parosMantenimiento, 
      ...parosCalidad, 
      ...parosOperacion
    ].filter(paro => paro && typeof paro.tiempoMinutos === 'number')
     .reduce((sum, paro) => sum + paro.tiempoMinutos, 0);
    
    // Calculate remaining time
    const remainingTime = remainingDowntimeMinutes - totalAssignedTime;
    
    // Move to the next type based on current type
    if (currentParoType === "Mantenimiento") {
      setCurrentParoType("Calidad");
      
      // Initialize new paro for Calidad if there's remaining time
      if (remainingTime > 0) {
        const calidadTipo = stopTypes.find(tipo => tipo.nombre === "Calidad");
        if (calidadTipo) {
          setCurrentParo({
            tiempoMinutos: Math.min(remainingTime, 15),
            tipoParoId: calidadTipo.id,
            tipoParoNombre: calidadTipo.nombre,
            sistemaId: "placeholder",
            subsistemaId: "placeholder",
            subsubsistemaId: "placeholder",
            descripcion: ""
          });
          setShowAddParoDialog(true);
        } else {
          // Move to next type if no Calidad type found
          setCurrentParoType("Operación");
          const operacionTipo = stopTypes.find(tipo => tipo.nombre === "Operación");
          if (operacionTipo) {
            setCurrentParo({
              tiempoMinutos: Math.min(remainingTime, 15),
              tipoParoId: operacionTipo.id,
              tipoParoNombre: operacionTipo.nombre,
              sistemaId: "placeholder",
              subsistemaId: "placeholder",
              subsubsistemaId: "placeholder",
              descripcion: ""
            });
            setShowAddParoDialog(true);
          } else {
            // If no time remaining, show summary
            setShowSummaryDialog(true);
          }
        }
      } else {
        // If no time remaining, show summary
        setShowSummaryDialog(true);
      }
    } else if (currentParoType === "Calidad") {
      setCurrentParoType("Operación");
      
      // Initialize new paro for Operación if there's remaining time
      if (remainingTime > 0) {
        const operacionTipo = stopTypes.find(tipo => tipo.nombre === "Operación");
        if (operacionTipo) {
          setCurrentParo({
            tiempoMinutos: Math.min(remainingTime, 15),
            tipoParoId: operacionTipo.id,
            tipoParoNombre: operacionTipo.nombre,
            sistemaId: "placeholder",
            subsistemaId: "placeholder",
            subsubsistemaId: "placeholder",
            descripcion: ""
          });
          setShowAddParoDialog(true);
        } else {
          // If no Operación type found, show summary
          setShowSummaryDialog(true);
        }
      } else {
        // If no time remaining, show summary
        setShowSummaryDialog(true);
      }
    } else {
      // If we're already on Operación, finish the process
      finishParoAssignment();
    }
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
                    <Button variant="ghost" size="icon" onClick={() => handleEditParo(index)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteParo(index, "Mantenimiento")}>
                      <Trash2 className="h-4 w-4 text-destructive" />
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
    if (lastUpdateTime && order?.estado === "en_progreso") {
      const interval = setInterval(() => {
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60));
        setTimeElapsed(diffMinutes);
      }, 60000); // Update every minute
      
      // Initial calculation
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60));
      setTimeElapsed(diffMinutes);
      
      return () => clearInterval(interval);
    }
  }, [lastUpdateTime, order]);

  if (isLoading) {
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
              order.estado === "completada" ? "secondary" :
              order.estado === "en_progreso" ? "default" : "outline"
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
              className="w-full" 
              disabled={isStarting}
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                "Iniciar Producción"
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
                    className={showCountdownWarning ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    Actualizar Ahora
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleOpenHourlyUpdate} 
                  variant="default"
                >
                  <Clock className="mr-2 h-4 w-4" /> Actualizar por Hora
                </Button>
                
                <Button 
                  onClick={() => setShowFinishDialog(true)} 
                  variant="outline"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Finalizar Producción
                </Button>
              </div>
            </div>
          )}
          
          {order.estado === "completada" && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button 
                onClick={handleViewStops} 
                variant="outline"
              >
                Ver Paros Registrados
              </Button>
              
              <Button 
                onClick={handleViewSummary} 
                variant="default"
              >
                Ver Resumen
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Hourly Update Dialog */}
      <Dialog open={showHourlyUpdate} onOpenChange={setShowHourlyUpdate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Actualización por Hora</DialogTitle>
            <DialogDescription>
              Ingrese la cantidad de cajas producidas en la última hora.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hourlyProduction" className="text-right">
                Cajas producidas
              </Label>
              <Input
                id="hourlyProduction"
                type="number"
                value={hourlyProduction}
                onChange={(e) => setHourlyProduction(e.target.value)}
                className="col-span-3"
                placeholder="Ingrese la cantidad de cajas"
              />
            </div>
            {order?.producto?.velocidadProduccion && (
              <div className="text-sm text-muted-foreground px-4">
                Velocidad registrada: {order.producto.velocidadProduccion} cajas/hora
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowHourlyUpdate(false)}>
              Cancelar
            </Button>
            <Button 
              variant="default" 
              onClick={handleStartParosRegistration}
              disabled={!hourlyProduction || isNaN(parseInt(hourlyProduction))}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Registrar Producción"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Paro Dialog */}
      <Dialog 
        open={showAddParoDialog} 
        onOpenChange={(open) => {
          if (!open && currentParo && (currentParo.tiempoMinutos > 0 || currentParo.sistemaId !== "placeholder")) {
            // If trying to close the dialog and there's unsaved data
            setShowAddParoCloseConfirmDialog(true);
          } else {
            // No data to lose, close directly
            setShowAddParoDialog(open);
          }
        }}
      >
        <DialogContent 
          className={`sm:max-w-[600px] ${
            currentParoType === "Mantenimiento" 
              ? "border-blue-500 border-t-4" 
              : currentParoType === "Calidad" 
                ? "border-amber-500 border-t-4" 
                : currentParoType === "Operación" 
                  ? "border-green-500 border-t-4" 
                  : ""
          }`}
        >
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
                <>
                  {currentParoType === "Mantenimiento" && "Registre los paros por mantenimiento indicando sistema, subsistema y subsubsistema."}
                  {currentParoType === "Calidad" && "Registre los paros por calidad indicando el sistema afectado."}
                  {currentParoType === "Operación" && "Registre los paros por operación indicando el sistema afectado."}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
            
            {/* Sistema selection - for all paro types */}
                <div>
              <Label htmlFor="sistema">Sistema</Label>
              <Select
                value={currentParo?.sistemaId || "placeholder"}
                onValueChange={(value) => {
                  if (currentParo && value !== "placeholder") {
                    setCurrentParo({
                      ...currentParo,
                      sistemaId: value,
                      subsistemaId: "placeholder",
                      subsubsistemaId: "placeholder"
                    });
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
                  <SelectValue placeholder="Seleccione un sistema" />
                    </SelectTrigger>
                    <SelectContent>
                  <SelectItem value="placeholder">Seleccione un sistema</SelectItem>
                  {sistemas.map((sistema) => (
                    <SelectItem key={sistema.id} value={sistema.id}>
                      {sistema.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            
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
                  !currentParo.sistemaId ||
                  currentParo.sistemaId === "placeholder" ||
                  (currentParoType === "Mantenimiento" && (!currentParo.subsistemaId || currentParo.subsistemaId === "placeholder")) ||
                  (currentParoType === "Mantenimiento" && (!currentParo.subsubsistemaId || currentParo.subsubsistemaId === "placeholder"))
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
            
            <div>
              {/* Navigation buttons */}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Producción</DialogTitle>
            <DialogDescription>
              Ingrese la cantidad de cajas producidas en la última hora y registre los paros de producción.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hourlyProduction" className="text-right">
                Cajas producidas
              </Label>
              <Input
                id="hourlyProduction"
                type="number"
                value={finalHourlyProduction}
                onChange={(e) => setFinalHourlyProduction(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinishDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFinishProduction} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                "Finalizar Producción"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Summary Dialog */}
      <Dialog 
        open={showSummaryDialog} 
        onOpenChange={(open) => {
          if (!open) {
            // If trying to close the dialog
            const hasUnassignedTime = remainingDowntimeMinutes - 
              [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                .reduce((sum, paro) => sum + paro.tiempoMinutos, 0) > 0;
            
            const hasParos = parosMantenimiento.length > 0 || 
                            parosCalidad.length > 0 || 
                            parosOperacion.length > 0;
            
            if (hasParos || hasUnassignedTime) {
              // Show confirmation dialog
              setShowCloseConfirmDialog(true);
            } else {
              // No data to lose, close directly
              setShowSummaryDialog(false);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl">Resumen Final de Producción</DialogTitle>
            <DialogDescription>
              Revise la información de producción y los paros registrados antes de guardar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
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
                  <h4 className="font-medium flex items-center text-blue-700 dark:text-blue-400">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Mantenimiento ({parosMantenimiento.length})
                  </h4>
                  {parosMantenimiento.length === 0 ? (
                    <div className="text-center py-2 text-muted-foreground text-sm">
                      No hay paros registrados
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {parosMantenimiento.map((paro, index) => (
                        <div key={index} className="bg-white dark:bg-slate-800 p-2 rounded-md shadow-sm border border-blue-100 dark:border-blue-900">
                          <div className="flex justify-between items-start">
                            <div className="font-medium">{paro.tiempoMinutos} minutos</div>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => {
                                  setCurrentParoType("Mantenimiento");
                                  setCurrentParo({...paro});
                                  setEditingParoIndex(index);
                                  setShowSummaryDialog(false);
                                  setShowAddParoDialog(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive hover:text-destructive" 
                                onClick={() => handleDeleteParo(index, "Mantenimiento")}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {paro.sistemaId && paro.sistemaId !== "placeholder" && (
                            <div className="text-xs text-muted-foreground">
                              Sistema: {getSistemaNombre(paro.sistemaId)}
                            </div>
                          )}
                          {paro.subsistemaId && paro.subsistemaId !== "placeholder" && (
                            <div className="text-xs text-muted-foreground">
                              Subsistema: {getSubsistemaNombre(paro.subsistemaId)}
                            </div>
                          )}
                          {paro.subsubsistemaId && paro.subsubsistemaId !== "placeholder" && (
                            <div className="text-xs text-muted-foreground">
                              Subsubsistema: {getSubsubsistemaNombre(paro.subsubsistemaId)}
                            </div>
                          )}
                        </div>
                      ))}
                </div>
                  )}
              </div>
              
                {/* Calidad paros */}
                <div className="space-y-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                  <h4 className="font-medium flex items-center text-amber-700 dark:text-amber-400">
                    <span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
                    Calidad ({parosCalidad.length})
                  </h4>
                  {parosCalidad.length === 0 ? (
                    <div className="text-center py-2 text-muted-foreground text-sm">
                      No hay paros por calidad registrados
              </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {parosCalidad.map((paro, index) => (
                        <div key={index} className="bg-white dark:bg-slate-800 p-2 rounded-md shadow-sm border border-amber-100 dark:border-amber-900">
                          <div className="flex justify-between items-start">
                            <div className="font-medium">{paro.tiempoMinutos} minutos</div>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => {
                                  setCurrentParoType("Calidad");
                                  setCurrentParo({...paro});
                                  setEditingParoIndex(index);
                                  setShowSummaryDialog(false);
                                  setShowAddParoDialog(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive hover:text-destructive" 
                                onClick={() => handleDeleteParo(index, "Calidad")}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {paro.sistemaId && paro.sistemaId !== "placeholder" && (
                            <div className="text-xs text-muted-foreground">
                              Sistema: {getSistemaNombre(paro.sistemaId)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
            </div>
            
                {/* Operación paros */}
                <div className="space-y-2 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                  <h4 className="font-medium flex items-center text-green-700 dark:text-green-400">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Operación ({parosOperacion.length})
                  </h4>
                  {parosOperacion.length === 0 ? (
                    <div className="text-center py-2 text-muted-foreground text-sm">
                      No hay paros registrados
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {parosOperacion.map((paro, index) => (
                        <div key={index} className="bg-white dark:bg-slate-800 p-2 rounded-md shadow-sm border border-green-100 dark:border-green-900">
                          <div className="flex justify-between items-start">
                            <div className="font-medium">{paro.tiempoMinutos} minutos</div>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => {
                                  setCurrentParoType("Operación");
                                  setCurrentParo({...paro});
                                  setEditingParoIndex(index);
                                  setShowSummaryDialog(false);
                                  setShowAddParoDialog(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive hover:text-destructive" 
                                onClick={() => handleDeleteParo(index, "Operación")}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {paro.sistemaId && paro.sistemaId !== "placeholder" && (
                            <div className="text-xs text-muted-foreground">
                              Sistema: {getSistemaNombre(paro.sistemaId)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
          </div>
          
            {/* Time Summary */}
            <div className="bg-card rounded-lg border shadow-sm p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Tiempo total asignado:</p>
                  <p className="font-medium text-lg">
                    {[...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                      .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                      .reduce((sum, paro) => sum + paro.tiempoMinutos, 0)} minutos
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Tiempo restante sin asignar:</p>
                  <p className={`font-medium text-lg ${
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
                    {remainingDowntimeMinutes - 
                     [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                       .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                       .reduce((sum, paro) => sum + paro.tiempoMinutos, 0) > 0 && (
                      <span className="ml-2 text-amber-500 text-sm">
                        (Debe asignar todo el tiempo antes de guardar)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Buttons to assign remaining time */}
              {remainingDowntimeMinutes - 
               [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                 .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                 .reduce((sum, paro) => sum + paro.tiempoMinutos, 0) > 0 && (
                <div className="mt-4 border-t pt-4">
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Tiempo sin asignar</p>
                      <p className="text-sm text-amber-700">
                        Debes asignar {remainingDowntimeMinutes - 
                        [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                          .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                          .reduce((sum, paro) => sum + paro.tiempoMinutos, 0)} minutos para continuar.
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium mb-3">Asignar tiempo restante a:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:hover:bg-blue-900/50"
                      onClick={() => {
                        const remainingTime = remainingDowntimeMinutes - 
                          [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                            .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                            .reduce((sum, paro) => sum + paro.tiempoMinutos, 0);
                        
                        setCurrentParoType("Mantenimiento");
                        const mantenimientoTipo = stopTypes.find(tipo => tipo.nombre === "Mantenimiento");
                        if (mantenimientoTipo) {
                          setCurrentParo({
                            tiempoMinutos: remainingTime,
                            tipoParoId: mantenimientoTipo.id,
                            tipoParoNombre: mantenimientoTipo.nombre,
                            sistemaId: "placeholder",
                            subsistemaId: "placeholder",
                            subsubsistemaId: "placeholder",
                            descripcion: ""
                          });
                        }
                        setShowSummaryDialog(false);
                        setShowAddParoDialog(true);
                      }}
                    >
                      Mantenimiento
            </Button>
                    
            <Button 
                      variant="outline" 
                      size="sm"
                      className="border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:hover:bg-amber-900/50"
                      onClick={() => {
                        const remainingTime = remainingDowntimeMinutes - 
                          [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                            .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                            .reduce((sum, paro) => sum + paro.tiempoMinutos, 0);
                        
                        setCurrentParoType("Calidad");
                        const calidadTipo = stopTypes.find(tipo => tipo.nombre === "Calidad");
                        if (calidadTipo) {
                          setCurrentParo({
                            tiempoMinutos: remainingTime,
                            tipoParoId: calidadTipo.id,
                            tipoParoNombre: calidadTipo.nombre,
                            sistemaId: "placeholder",
                            descripcion: ""
                          });
                        }
                        setShowSummaryDialog(false);
                        setShowAddParoDialog(true);
                      }}
                    >
                      Calidad
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/30 dark:hover:bg-green-900/50"
                      onClick={() => {
                        const remainingTime = remainingDowntimeMinutes - 
                          [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                            .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                            .reduce((sum, paro) => sum + paro.tiempoMinutos, 0);
                        
                        setCurrentParoType("Operación");
                        const operacionTipo = stopTypes.find(tipo => tipo.nombre === "Operación");
                        if (operacionTipo) {
                          setCurrentParo({
                            tiempoMinutos: remainingTime,
                            tipoParoId: operacionTipo.id,
                            tipoParoNombre: operacionTipo.nombre,
                            sistemaId: "placeholder",
                            descripcion: ""
                          });
                        }
                        setShowSummaryDialog(false);
                        setShowAddParoDialog(true);
                      }}
                    >
                      Operación
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex justify-between pt-4 border-t mt-2">
            <Button variant="outline" onClick={() => {
              setShowSummaryDialog(false);
              
              // Go back to the appropriate step based on which paros are missing
              if (parosMantenimiento.length === 0) {
                setCurrentParoType("Mantenimiento");
                const mantenimientoTipo = stopTypes.find(tipo => tipo.nombre === "Mantenimiento");
                if (mantenimientoTipo) {
                  setCurrentParo({
                    tiempoMinutos: 0,
                    tipoParoId: mantenimientoTipo.id,
                    tipoParoNombre: mantenimientoTipo.nombre,
                    sistemaId: "placeholder",
                    subsistemaId: "placeholder",
                    subsubsistemaId: "placeholder",
                    descripcion: ""
                  });
                }
              } else if (parosCalidad.length === 0) {
                setCurrentParoType("Calidad");
                const calidadTipo = stopTypes.find(tipo => tipo.nombre === "Calidad");
                if (calidadTipo) {
                  setCurrentParo({
                    tiempoMinutos: 0,
                    tipoParoId: calidadTipo.id,
                    tipoParoNombre: calidadTipo.nombre,
                    sistemaId: "placeholder",
                    descripcion: ""
                  });
                }
              } else {
                setCurrentParoType("Operación");
                const operacionTipo = stopTypes.find(tipo => tipo.nombre === "Operación");
                if (operacionTipo) {
                  setCurrentParo({
                    tiempoMinutos: 0,
                    tipoParoId: operacionTipo.id,
                    tipoParoNombre: operacionTipo.nombre,
                    sistemaId: "placeholder",
                    descripcion: ""
                  });
                }
              }
              
              setShowAddParoDialog(true);
            }}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Editar Paros
            </Button>
            <Button 
              onClick={completeFinishProduction}
              disabled={
                isUpdating || 
                (remainingDowntimeMinutes - 
                [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                  .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                  .reduce((sum, paro) => sum + paro.tiempoMinutos, 0) > 0)
              }
              className={
                remainingDowntimeMinutes - 
                [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                  .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                  .reduce((sum, paro) => sum + paro.tiempoMinutos, 0) > 0 
                  ? "relative group" 
                  : ""
              }
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Producción"
              )}
              {remainingDowntimeMinutes - 
                [...parosMantenimiento, ...parosCalidad, ...parosOperacion]
                  .filter(paro => paro && typeof paro.tiempoMinutos === 'number')
                  .reduce((sum, paro) => sum + paro.tiempoMinutos, 0) > 0 && (
                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-max bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  Debes asignar todo el tiempo de paros antes de guardar
                </span>
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
                      sistemaId: "placeholder",
                      subsistemaId: "placeholder",
                      subsubsistemaId: "placeholder",
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
    </div>
  );
} 