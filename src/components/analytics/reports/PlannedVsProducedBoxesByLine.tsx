"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ChevronRight, Clock, TrendingUp, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/dashboard/report-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDateRange } from "@/context/DateRangeContext";
import { BarChart } from "../charts/BarChart";

interface LineWithBoxesData {
  id: string;
  nombre: string;
  cajasPlanificadas: number;
  cajasProducidas: number;
  diferencia: number;
  diferenciaPorcentaje: number;
  totalOrdenes: number;
}

interface PlannedVsProducedBoxesByLineResponse {
  data: LineWithBoxesData[];
  totalLineas: number;
  promedioDesviacionPositiva: number;
  promedioDesviacionNegativa: number;
}

export function PlannedVsProducedBoxesByLine() {
  const router = useRouter();
  const { date: dateRange } = useDateRange();
  const [data, setData] = useState<LineWithBoxesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promedioDesviacionPositiva, setPromedioDesviacionPositiva] = useState(0);
  const [promedioDesviacionNegativa, setPromedioDesviacionNegativa] = useState(0);
  const [totalLineas, setTotalLineas] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = dateRange?.to?.toISOString() || new Date().toISOString();
        
        const response = await fetch(
          `/api/analytics/planned-vs-produced-boxes-by-line?from=${from}&to=${to}&limit=10`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: PlannedVsProducedBoxesByLineResponse = await response.json();
        
        if (result.data.length === 0) {
          setError("No se encontraron datos para el período seleccionado");
        } else {
          setData(result.data);
          setPromedioDesviacionPositiva(result.promedioDesviacionPositiva);
          setPromedioDesviacionNegativa(result.promedioDesviacionNegativa);
          setTotalLineas(result.totalLineas);
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
    // Navigate to detailed view when implemented
    router.push(`/reports/planned-vs-produced-boxes-by-line-detail`);
  };

  // Preparar datos para el gráfico de barras
  const chartData = data.map(item => ({
    line: item.nombre,
    "Cajas Planificadas": item.cajasPlanificadas,
    "Cajas Producidas": item.cajasProducidas,
    diferenciaPorcentaje: item.diferenciaPorcentaje
  }));

  function getEfficiencyColorClass(value: number): string {
    if (value >= 10) return "text-green-600"; // Sobrecumplimiento
    if (value <= -10) return "text-red-600"; // Incumplimiento
    return "text-amber-500"; // Cerca del objetivo
  }

  return (
    <ReportCard
      title="Cajas Planificadas vs Producidas por Línea"
      subtitle="Comparación de producción real vs planificada por línea de producción"
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
      className="p-0 relative"
      headerClassName="bg-[#e8f6e9]"
    >
      <div className="border-b border-border/50" />
      <div className="flex flex-col gap-2">
        <div className="px-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-[#e2f1f8]/20 p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-slate-500" />
                <p className="text-sm text-muted-foreground">Líneas Analizadas</p>
              </div>
              <p className="text-xl font-semibold">
                {loading ? '-' : totalLineas}
              </p>
            </div>
            
            <div className="rounded-lg bg-[#e2f1f8]/20 p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Eficiencia Promedio</p>
              </div>
              <p className={`text-xl font-semibold ${loading ? '' : getEfficiencyColorClass(promedioDesviacionNegativa)}`}>
                {loading ? '-' : `${promedioDesviacionNegativa < 0 ? (promedioDesviacionNegativa * -1).toFixed(1) : promedioDesviacionNegativa.toFixed(1)}%`}
                {!loading && promedioDesviacionNegativa < 0 ? (
                  <span className="ml-2 inline-flex">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </span>
                ) : null}
              </p>
            </div>
            
            <div className="rounded-lg bg-[#e2f1f8]/20 p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <p className="text-sm text-muted-foreground">Promedio Diferencia Positiva</p>
              </div>
              <p className="text-xl font-semibold">
                {loading ? '-' : `${promedioDesviacionPositiva.toFixed(1)}%`}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="p-6">
            <div className="h-[350px]">
              <BarChart
                data={chartData}
                index="line"
                categories={["Cajas Planificadas", "Cajas Producidas"]}
                colors={["#16a34a", "#4ade80"]}
                valueFormatter={(value) => value.toLocaleString("es-MX")}
                layout="vertical"
                className="h-full"
              />
            </div>
          </div>
        )}
      </div>
    </ReportCard>
  );
} 