import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { PeriodOption } from "@/components/reports/DateRangeFilter";
import { ComparisonPeriod } from "@/components/reports/CompareWithFilter";
import { format } from "date-fns";

interface DashboardIndicators {
  // Tarjeta 1: Órdenes de producción
  totalOrders: number;
  ordersPercentChange: number; // Variación porcentual respecto al período comparado
  // Tarjeta 2: Cajas producidas y cumplimiento al plan
  totalBoxes: number;
  boxesPercentChange: number; // Variación porcentual respecto al período comparado
  planCompliance: number; // Porcentaje
  // Tarjeta 3: Litros producidos
  totalLiters: number;
  litersPercentChange: number; // Variación porcentual respecto al período comparado
  // Tarjeta 4: Eficiencia cajas por hora
  boxesPerHourEfficiency: number; // Porcentaje
  efficiencyPercentChange: number; // Variación porcentual respecto al período comparado
  // Datos para la tabla de órdenes
  recentOrders: ProductionOrder[];
  // Estado general
  isLoading: boolean;
  error: string | null;
}

interface ProductionOrder {
  id: string;
  line: string;
  product: string;
  producedBoxes: number;
  plannedBoxes: number;
  status: "pending" | "in-progress" | "completed";
  updatedAt: string;
}

// Interface para los datos recibidos de la API
interface ApiProductionOrder {
  id: string;
  numeroOrden?: number;
  fechaProduccion: string;
  turno: string | number;
  producto: {
    nombre: string;
    sabor: {
      nombre: string;
    };
    modelo: {
      nombre: string;
    };
    tamaño: {
      nombre: string;
    };
  };
  linea: {
    nombre: string;
  };
  cajasProducidas: number;
  cajasPlanificadas: number;
  cumplimiento: number;
  estado: string;
}

export function useDashboardIndicators(
  date: DateRange | undefined,
  selectedPeriod: PeriodOption,
  comparisonPeriod?: ComparisonPeriod
): DashboardIndicators {
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalBoxes, setTotalBoxes] = useState(0);
  const [totalLiters, setTotalLiters] = useState(0);
  const [planCompliance, setPlanCompliance] = useState(0);
  const [boxesPerHourEfficiency, setBoxesPerHourEfficiency] = useState(0);
  const [recentOrders, setRecentOrders] = useState<ProductionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para variaciones porcentuales
  const [ordersPercentChange, setOrdersPercentChange] = useState(0);
  const [boxesPercentChange, setBoxesPercentChange] = useState(0);
  const [litersPercentChange, setLitersPercentChange] = useState(0);
  const [efficiencyPercentChange, setEfficiencyPercentChange] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!date?.from || !date?.to) {
        setError("Fechas no válidas");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        // 1. Obtener datos de producción total (cajas y litros)
        const productionResponse = await fetch("/api/analytics/production-totals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: date.from.toISOString(),
            endDate: date.to.toISOString(),
            period: selectedPeriod,
            comparisonPeriod: comparisonPeriod || "previous_period", // Usar el período de comparación para las 4 tarjetas principales
          }),
        });

        if (!productionResponse.ok) {
          throw new Error("Error al obtener los datos de producción");
        }

        const productionData = await productionResponse.json();
        
        if (isMounted) {
          setTotalBoxes(productionData.totalBoxes || 0);
          setTotalLiters(productionData.totalLiters || 0);
          
          // Capturar variaciones porcentuales si están disponibles
          setBoxesPercentChange(productionData.boxesPercentChange || 0);
          setLitersPercentChange(productionData.litersPercentChange || 0);
        }

        // 2. Obtener la eficiencia de producción (cumplimiento al plan)
        const efficiencyParams = new URLSearchParams({
          from: date.from.toISOString(),
          to: date.to.toISOString(),
          comparisonPeriod: comparisonPeriod || "previous_period", // Usar el período de comparación
        });
        
        const efficiencyResponse = await fetch(`/api/analytics/production-efficiency?${efficiencyParams}`);
        if (efficiencyResponse.ok) {
          const efficiencyData = await efficiencyResponse.json();
          if (isMounted && typeof efficiencyData.averageEfficiency === 'number') {
            setPlanCompliance(efficiencyData.averageEfficiency * 100);
            setEfficiencyPercentChange(efficiencyData.percentChange || 0);
          }
        }

        // 3. Obtener la eficiencia de cajas por hora
        const hourlyResponse = await fetch(`/api/analytics/hourly-production-efficiency?${efficiencyParams}`);
        if (hourlyResponse.ok) {
          const hourlyData = await hourlyResponse.json();
          if (isMounted && typeof hourlyData.averageEfficiency === 'number') {
            setBoxesPerHourEfficiency(hourlyData.averageEfficiency * 100);
            setEfficiencyPercentChange(hourlyData.percentChange || 0);
          }
        }

        // 4. Obtener las órdenes de producción recientes
        // Esta parte no usa el período de comparación ya que solo muestra datos actuales
        const ordersResponse = await fetch(`/api/analytics/detailed/production-orders?page=1&limit=4&compare=${comparisonPeriod || "previous_period"}`);
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          
          if (isMounted && ordersData.data && Array.isArray(ordersData.data)) {
            // Verificar los datos recibidos
            console.log("Datos de órdenes recibidos:", ordersData.data);
            
            // Mapear los datos de la API al formato que necesitamos
            const mappedOrders: ProductionOrder[] = ordersData.data.map((order: ApiProductionOrder) => {
              // Crear un ID más legible
              let displayId = "ORD-";
              if (order.numeroOrden) {
                displayId += order.numeroOrden.toString().padStart(4, '0');
              } else {
                // Si no hay numeroOrden, usar los primeros 6 caracteres del ID
                displayId += order.id.substring(0, 6);
              }
              
              return {
                id: displayId,
                line: order.linea.nombre,
                product: `${order.producto.nombre} ${order.producto.sabor.nombre} ${order.producto.modelo.nombre} ${order.producto.tamaño.nombre}`,
                producedBoxes: order.cajasProducidas,
                plannedBoxes: order.cajasPlanificadas,
                status: mapOrderStatus(order.estado),
                updatedAt: order.fechaProduccion
              };
            });
            
            setRecentOrders(mappedOrders);
            setTotalOrders(ordersData.total || mappedOrders.length);
            setOrdersPercentChange(ordersData.percentChange || 0);
          }
        }

      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error desconocido");
          setTotalBoxes(0);
          setTotalLiters(0);
          setPlanCompliance(0);
          setBoxesPerHourEfficiency(0);
          setRecentOrders([]);
          setTotalOrders(0);
          
          // Resetear variaciones porcentuales
          setOrdersPercentChange(0);
          setBoxesPercentChange(0);
          setLitersPercentChange(0);
          setEfficiencyPercentChange(0);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedPeriod, date?.from?.getTime(), date?.to?.getTime(), comparisonPeriod]);

  // Función auxiliar para mapear el estado de la orden de la API a nuestro formato
  const mapOrderStatus = (apiStatus: string): "pending" | "in-progress" | "completed" => {
    const statusMap: Record<string, "pending" | "in-progress" | "completed"> = {
      "pendiente": "pending",
      "en_proceso": "in-progress",
      "en_progreso": "in-progress",
      "completada": "completed",
      "terminada": "completed",
      "finalizada": "completed"
    };
    
    return statusMap[apiStatus.toLowerCase()] || "pending";
  };

  return {
    totalOrders,
    ordersPercentChange,
    totalBoxes,
    boxesPercentChange, 
    planCompliance,
    totalLiters,
    litersPercentChange,
    boxesPerHourEfficiency,
    efficiencyPercentChange,
    recentOrders,
    isLoading,
    error
  };
} 