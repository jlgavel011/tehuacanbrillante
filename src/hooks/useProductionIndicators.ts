import { useState, useEffect } from "react";
import { useDateRange } from "@/context/DateRangeContext";

interface ProductionIndicators {
  totalBoxes: number;
  totalLiters: number;
  isLoading: boolean;
  error: string | null;
  averageEfficiency: number;
  averageHourlyEfficiency: number;
  timeEfficiency: number;
  timeInefficiency: number;
}

export function useProductionIndicators(): ProductionIndicators {
  const [totalBoxes, setTotalBoxes] = useState(0);
  const [totalLiters, setTotalLiters] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageEfficiency, setAverageEfficiency] = useState(0);
  const [averageHourlyEfficiency, setAverageHourlyEfficiency] = useState(0);
  const [timeEfficiency, setTimeEfficiency] = useState(0);
  const [timeInefficiency, setTimeInefficiency] = useState(0);
  const { date, selectedPeriod } = useDateRange();

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
        const response = await fetch("/api/analytics/production-totals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: date.from.toISOString(),
            endDate: date.to.toISOString(),
            period: selectedPeriod,
          }),
        });

        if (!response.ok) {
          throw new Error("Error al obtener los datos de producción");
        }

        const data = await response.json();
        
        if (typeof data.totalBoxes !== 'number' || typeof data.totalLiters !== 'number') {
          throw new Error("Datos de producción inválidos");
        }

        if (isMounted) {
          setTotalBoxes(data.totalBoxes);
          setTotalLiters(data.totalLiters);
        }

        const efficiencyResponse = await fetch(`/api/analytics/production-efficiency?from=${date.from.toISOString()}&to=${date.to.toISOString()}`);
        if (efficiencyResponse.ok) {
          const efficiencyData = await efficiencyResponse.json();
          if (isMounted && typeof efficiencyData.averageEfficiency === 'number') {
            setAverageEfficiency(efficiencyData.averageEfficiency);
          }
        }

        const hourlyResponse = await fetch(`/api/analytics/hourly-production-efficiency?from=${date.from.toISOString()}&to=${date.to.toISOString()}`);
        if (hourlyResponse.ok) {
          const hourlyData = await hourlyResponse.json();
          if (isMounted && typeof hourlyData.averageEfficiency === 'number') {
            setAverageHourlyEfficiency(hourlyData.averageEfficiency);
          }
        }

        // Obtener eficiencia/ineficiencia de tiempo real vs planificado
        const timeResponse = await fetch(`/api/analytics/real-vs-planned-time?from=${date.from.toISOString()}&to=${date.to.toISOString()}`);
        if (timeResponse.ok) {
          const timeData = await timeResponse.json();
          if (isMounted) {
            if (typeof timeData.promedioDesviacionNegativa === 'number') {
              setTimeEfficiency(timeData.promedioDesviacionNegativa);
            }
            if (typeof timeData.promedioDesviacionPositiva === 'number') {
              setTimeInefficiency(timeData.promedioDesviacionPositiva);
            }
          }
        }

      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error desconocido");
          setTotalBoxes(0);
          setTotalLiters(0);
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
  }, [selectedPeriod, date?.from?.getTime(), date?.to?.getTime()]);

  return {
    totalBoxes,
    totalLiters,
    isLoading,
    error,
    averageEfficiency,
    averageHourlyEfficiency,
    timeEfficiency,
    timeInefficiency
  };
} 