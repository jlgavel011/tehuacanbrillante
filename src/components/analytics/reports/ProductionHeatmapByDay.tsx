"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ChevronRight, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDateRange } from "@/context/DateRangeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewDetailsButton } from "@/components/analytics/reports/ViewDetailsButton";
import { ReportCard } from "@/components/dashboard/report-card";
import { useRouter } from "next/navigation";

interface DayProductionData {
  day: string;
  dayIndex: number;
  cajasProducidas: number;
  litrosProducidos: number;
  totalRegistros: number;
}

interface HeatmapResponse {
  data: DayProductionData[];
  totalCajas: number;
  totalLitros: number;
  maxCajasDia: number;
  maxLitrosDia: number;
}

// Función para generar clases de color basadas en el valor relativo
function getHeatmapColor(value: number, max: number, metric: "cajas" | "litros") {
  if (max === 0) return "bg-purple-50";
  
  const intensity = Math.min(Math.round((value / max) * 100), 100);
  
  // Para cajas y litros: escala de magentas
  if (intensity <= 20) return "bg-[#fdf4ff]/20";
  if (intensity <= 40) return "bg-[#fdf4ff]/40";
  if (intensity <= 60) return "bg-[#fdf4ff]/60";
  if (intensity <= 80) return "bg-[#fdf4ff]/80";
  return "bg-[#fdf4ff]";
}

export function ProductionHeatmapByDay() {
  const router = useRouter();
  const { date: dateRange } = useDateRange();
  const [data, setData] = useState<DayProductionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<"cajas" | "litros">("cajas");
  const [maxCajas, setMaxCajas] = useState(0);
  const [maxLitros, setMaxLitros] = useState(0);
  const [totalCajas, setTotalCajas] = useState(0);
  const [totalLitros, setTotalLitros] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = dateRange?.to?.toISOString() || new Date().toISOString();

        const response = await fetch(
          `/api/analytics/production-heatmap-by-day?from=${from}&to=${to}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: HeatmapResponse = await response.json();

        if (result.data.length === 0) {
          setError("No se encontraron datos para el período seleccionado");
        } else {
          setData(result.data);
          setMaxCajas(result.maxCajasDia);
          setMaxLitros(result.maxLitrosDia);
          setTotalCajas(result.totalCajas);
          setTotalLitros(result.totalLitros);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error al cargar los datos. Por favor intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const handleViewDetails = () => {
    router.push(`/reports/production-heatmap-by-day-detail${
      dateRange?.from && dateRange?.to
        ? `?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
        : ""
    }`);
  };

  return (
    <ReportCard
      title="Días con Mayor Producción"
      subtitle="Distribución de la producción por día de la semana"
      headerExtra={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleViewDetails}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      }
      className="p-0"
      headerClassName="bg-[#f9e8f7]"
    >
      <div className="border-b border-border/50" />
      <div className="flex flex-col gap-2">
        <div className="px-6 pt-4">
          <Tabs
            value={metric}
            onValueChange={(v) => setMetric(v as "cajas" | "litros")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cajas">Cajas Producidas</TabsTrigger>
              <TabsTrigger value="litros">Litros Producidos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {loading ? (
          <div className="px-6 py-6">
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : error ? (
          <div className="px-6 py-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            <div className="px-6 pt-3 pb-4">
              <div className="max-h-[240px] overflow-y-auto pr-2 py-1">
                <div className="grid grid-cols-1 gap-3">
                  {data.map((day) => (
                    <div key={day.dayIndex} className="flex items-center">
                      <div className="w-[80px] font-medium text-sm">{day.day}</div>
                      <div className="flex-1 h-8">
                        <div
                          className={`relative h-full rounded-md ${getHeatmapColor(
                            metric === "cajas" ? day.cajasProducidas : day.litrosProducidos,
                            metric === "cajas" ? maxCajas : maxLitros,
                            metric
                          )}`}
                          style={{ 
                            width: `${Math.max(
                              ((metric === "cajas" ? day.cajasProducidas : day.litrosProducidos) /
                              (metric === "cajas" ? maxCajas : maxLitros)) * 100, 
                              1
                            )}%`,
                            minWidth: '1%'
                          }}
                        >
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-700 font-medium">
                            {metric === "cajas" 
                              ? day.cajasProducidas.toLocaleString()
                              : day.litrosProducidos.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-3 border-t border-border/50 bg-slate-50/50 text-center text-sm text-muted-foreground">
              El gráfico muestra la producción total por día de la semana
            </div>
          </div>
        )}
      </div>
    </ReportCard>
  );
} 