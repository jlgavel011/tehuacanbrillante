"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/dashboard/report-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDateRange } from "@/context/DateRangeContext";
import { LineChart } from "../charts/LineChart";
import { formatNumber } from "@/lib/utils/formatters";

interface EfficiencyDataPoint {
  date: string;
  efficiency: number;
}

export function ProductionEfficiency() {
  const router = useRouter();
  const { date } = useDateRange();
  const [data, setData] = useState<EfficiencyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageEfficiency, setAverageEfficiency] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!date?.from || !date?.to) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          from: date.from.toISOString(),
          to: date.to.toISOString(),
        });

        const response = await fetch(`/api/analytics/production-efficiency?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos");
        
        const result = await response.json();
        setData(result.data);
        setAverageEfficiency(result.averageEfficiency);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date?.from?.getTime(), date?.to?.getTime()]);

  if (loading) {
    return (
      <ReportCard
        title="Eficiencia de Producción"
        subtitle="Cajas producidas vs. planificadas"
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      </ReportCard>
    );
  }

  if (error) {
    return (
      <ReportCard
        title="Eficiencia de Producción"
        subtitle="Cajas producidas vs. planificadas"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ReportCard
        title="Eficiencia de Producción"
        subtitle="Cajas producidas vs. planificadas"
      >
        <Alert>
          <AlertDescription>No hay datos disponibles para el período seleccionado</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  const handleViewDetails = () => {
    router.push("/reports/production-efficiency");
  };

  // Formato para el gráfico de línea
  const chartData = data.map(item => ({
    date: item.date,
    "Eficiencia": item.efficiency * 100, // Convertir a porcentaje
  }));

  return (
    <ReportCard
      title="Eficiencia de Producción"
      subtitle="Cajas producidas vs. planificadas"
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
      headerClassName="bg-[#e8f6e9]"
    >
      <div className="border-b border-border/50" />
      <div className="flex flex-col gap-2">
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-[#e8f6e9]/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">Eficiencia Promedio</p>
              <p className="text-xl font-semibold">{(averageEfficiency * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-[#e8f6e9]/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">Tendencia</p>
              <p className="text-xl font-semibold flex items-center justify-center gap-2">
                {data[data.length - 1].efficiency > data[0].efficiency 
                  ? <><TrendingUp className="h-5 w-5 text-green-500" /> Positiva</> 
                  : data[data.length - 1].efficiency < data[0].efficiency 
                    ? <><TrendingDown className="h-5 w-5 text-red-500" /> Negativa</> 
                    : <><Minus className="h-5 w-5 text-gray-500" /> Estable</>}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-6 px-6 min-h-[400px]">
          <div className="h-[320px] w-full">
            <LineChart
              data={chartData}
              index="date"
              categories={["Eficiencia"]}
              colors={["#4ade80"]}
              valueFormatter={(value) => `${Math.round(value)}%`}
              showLegend={false}
              curveType="natural"
              yAxisWidth={48}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </ReportCard>
  );
} 