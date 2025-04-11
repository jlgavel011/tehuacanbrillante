import { useState, useEffect } from "react";

interface ParoInfo {
  cantidad: number;
  tiempo: number;
}

interface ProductoInfo {
  nombre: string;
  modelo: string;
  sabor: string;
  tamaño: string;
  caja: string;
  unidadesPorCaja: number;
  litrosPorUnidad: number;
}

interface OrdenProduccionInfo {
  id: string;
  numeroOrden: number;
  cajasPlanificadas: number;
  cajasProducidas: number;
  tiempoPlan: number | null;
  tiempoTranscurrido: number;
  producto: ProductoInfo;
}

interface DatosActualesInfo {
  cajasProducidas: number;
  fechaInicio: string;
  tiempoTranscurrido: number;
  parosTotales: ParoInfo;
  parosMantenimiento: ParoInfo;
  parosCalidad: ParoInfo;
  parosOperacion: ParoInfo;
  promedioCajasActual: number;
  promedioPlanificado: number;
  comparacionPromedio: number;
  tiempoEstimadoRestante: number;
  tiempoFaltanteVsPlan: number;
  jefeProduccion: string;
  activo: boolean;
}

export interface LineaProduccionLiveInfo {
  id: string;
  nombre: string;
  estado: "activo" | "inactivo";
  ordenProduccion?: OrdenProduccionInfo;
  datosActuales?: DatosActualesInfo | null;
}

export function useLiveData(refreshInterval = 10000) {
  const [data, setData] = useState<LineaProduccionLiveInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = async () => {
    try {
      const response = await fetch("/api/analytics/live-data");
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos en vivo: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido al obtener datos"));
      console.error("Error fetching live data:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Initial fetch
    fetchData();
    
    // Set up refresh interval
    const intervalId = setInterval(fetchData, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);
  
  return { data, isLoading, error, refresh: fetchData };
} 