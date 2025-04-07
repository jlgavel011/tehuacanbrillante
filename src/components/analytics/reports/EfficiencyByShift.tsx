"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/dashboard/report-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDateRange } from "@/context/DateRangeContext";
import { BarChart } from "../charts/BarChart";

interface ShiftEfficiencyData {
  name: string;
  efficiency: number;
  producedCases: number;
  plannedCases: number;
}

export function EfficiencyByShift() {
  const router = useRouter();
  const { date } = useDateRange();
  const [data, setData] = useState<ShiftEfficiencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const response = await fetch(`/api/analytics/efficiency-by-shift?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos");
        
        const result = await response.json();
        setData(result.data);
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
        title="% Eficiencia por Turno"
        subtitle="Porcentaje de cajas producidas vs. planificadas por turno"
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
        title="% Eficiencia por Turno"
        subtitle="Porcentaje de cajas producidas vs. planificadas por turno"
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
        title="% Eficiencia por Turno"
        subtitle="Porcentaje de cajas producidas vs. planificadas por turno"
      >
        <Alert>
          <AlertDescription>No hay datos disponibles para el período seleccionado</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  const handleViewDetails = () => {
    router.push("/reports/efficiency-by-shift");
  };

  // Formato para el gráfico de barras
  const chartData = data.map(item => ({
    name: item.name,
    "% Eficiencia": Math.round(item.efficiency * 100),
  }));

  // Ordenar por eficiencia descendente
  chartData.sort((a, b) => b["% Eficiencia"] - a["% Eficiencia"]);

  return (
    <ReportCard
      title="% Eficiencia por Turno"
      subtitle="Porcentaje de cajas producidas vs. planificadas por turno"
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
        <div className="flex items-center justify-center py-6 px-6 min-h-[400px]">
          <div className="h-[320px] w-full">
            <BarChart
              data={chartData}
              index="name"
              categories={["% Eficiencia"]}
              colors={["#4ade80"]}
              valueFormatter={(value) => `${value}%`}
              showLegend={false}
              yAxisWidth={48}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </ReportCard>
  );
} 