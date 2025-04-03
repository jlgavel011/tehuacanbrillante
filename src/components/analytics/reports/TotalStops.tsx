"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock, LineChart } from "lucide-react";
import { DonutChart, LineChart as TremorLineChart } from "@tremor/react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "./ReportCard";

interface StopData {
  tipo: string;
  cantidad: number;
  tiempo_total: number;
  porcentaje: number;
}

export function TotalStops() {
  const [data, setData] = useState<StopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/total-stops");
        if (!response.ok) throw new Error("Error al cargar los datos");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <ReportCard
        title="Total de Paros"
        subtitle="Paros por día de la semana"
        icon={Clock}
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      </ReportCard>
    );
  }

  if (error) {
    return (
      <ReportCard
        title="Total de Paros"
        subtitle="Paros por día de la semana"
        icon={Clock}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  const totalStops = data.reduce((acc, curr) => acc + curr.cantidad, 0);
  const totalTime = data.reduce((acc, curr) => acc + curr.tiempo_total, 0);

  const chartData = data.map((item) => ({
    name: item.tipo,
    value: item.cantidad,
  }));

  // Generate line chart data for the last 7 days
  const lineChartData = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString("es-MX", {
      weekday: "short",
    }),
    "Cantidad": Math.floor(Math.random() * 10),
  }));

  const colors = ["emerald", "blue", "amber"];

  return (
    <ReportCard
      title="Total de Paros"
      subtitle="Paros por día de la semana"
      icon={Clock}
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-2xl font-bold">{totalStops.toLocaleString("es-MX")}</p>
            <p className="text-sm text-muted-foreground">Total de paros</p>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">
              {totalTime.toLocaleString("es-MX")} min
            </p>
            <p className="text-sm text-muted-foreground">Tiempo total</p>
          </div>
        </div>
        <div className="h-[200px]">
          <TremorLineChart
            data={lineChartData}
            index="date"
            categories={["Cantidad"]}
            colors={["cyan"]}
            valueFormatter={(value) =>
              value.toLocaleString("es-MX", {
                maximumFractionDigits: 0,
              })
            }
            showLegend={false}
            className="h-full"
          />
        </div>
      </div>
    </ReportCard>
  );
} 