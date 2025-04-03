"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/dashboard/report-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDateRange } from "@/context/DateRangeContext";
import { BarChart } from "../charts/BarChart";
import { CHART_PRESETS, getChartColors } from "@/config/chart-colors";

interface FlavorData {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export function MostProducedFlavors() {
  const router = useRouter();
  const { date } = useDateRange();
  const [data, setData] = useState<FlavorData[]>([]);
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

        const response = await fetch(`/api/analytics/most-produced-flavors?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos");
        const result = await response.json();
        setData(result.slice(0, 5)); // Asegurar que solo mostramos el top 5
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date]);

  if (loading) {
    return (
      <ReportCard
        title="Sabores Más Producidos"
        subtitle="Top 5 sabores por cajas producidas"
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
        title="Sabores Más Producidos"
        subtitle="Top 5 sabores por cajas producidas"
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
        title="Sabores Más Producidos"
        subtitle="Top 5 sabores por cajas producidas"
      >
        <Alert>
          <AlertDescription>No hay datos disponibles para el período seleccionado</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  const chartData = data.map((item) => ({
    name: item.nombre,
    Cantidad: item.cantidad,
  }));

  const totalProduction = data.reduce((acc, curr) => acc + curr.cantidad, 0);

  const handleViewDetails = () => {
    router.push("/reports/flavors");
  };

  return (
    <ReportCard
      title="Sabores Más Producidos"
      subtitle="Top 5 sabores por cajas producidas"
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
    >
      <div className="border-b border-border/50" />
      <div className="flex items-center justify-center py-8 px-6 min-h-[400px]">
        <div className="h-[320px] w-full -ml-2">
          <BarChart
            data={chartData}
            index="name"
            categories={["Cantidad"]}
            colors={["#0284C7"]}
            valueFormatter={(value) =>
              value.toLocaleString("es-MX", {
                maximumFractionDigits: 0,
              })
            }
            showLegend={false}
            yAxisWidth={65}
            className="h-full"
          />
        </div>
      </div>
    </ReportCard>
  );
} 