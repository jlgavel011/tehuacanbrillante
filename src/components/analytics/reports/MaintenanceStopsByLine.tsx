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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MaintenanceStopData {
  name: string;
  paros: number;
  tiempo_total: number;
}

export function MaintenanceStopsByLine() {
  const router = useRouter();
  const { date } = useDateRange();
  const [data, setData] = useState<MaintenanceStopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"tiempo" | "cantidad">("tiempo");

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

        const response = await fetch(`/api/analytics/maintenance-stops-by-line?${params}`);
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
  }, [date]);

  if (loading) {
    return (
      <ReportCard
        title="Líneas con Más Paros por Mantenimiento"
        subtitle="Distribución de paros por línea de producción"
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
        title="Líneas con Más Paros por Mantenimiento"
        subtitle="Distribución de paros por línea de producción"
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
        title="Líneas con Más Paros por Mantenimiento"
        subtitle="Distribución de paros por línea de producción"
      >
        <Alert>
          <AlertDescription>No hay datos disponibles para el período seleccionado</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  const chartData = data.map((item) => ({
    name: item.name,
    Cantidad: selectedMetric === "cantidad" ? item.paros : item.tiempo_total,
  }));

  const handleViewDetails = () => {
    router.push("/reports/maintenance-stops");
  };

  return (
    <ReportCard
      title="Líneas con Más Paros por Mantenimiento"
      subtitle="Distribución de paros por línea de producción"
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
      headerClassName="bg-[#fff7e1]"
    >
      <div className="border-b border-border/50" />
      <div className="flex flex-col gap-2">
        <div className="px-6 pt-4">
          <Tabs
            defaultValue="tiempo"
            value={selectedMetric}
            onValueChange={(value) => setSelectedMetric(value as "tiempo" | "cantidad")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tiempo">Tiempo Total</TabsTrigger>
              <TabsTrigger value="cantidad">Cantidad de Paros</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center justify-center py-6 px-6 min-h-[400px]">
          <div className="h-[320px] w-full -ml-2">
            <BarChart
              data={chartData}
              index="name"
              categories={["Cantidad"]}
              colors={["#FFE091"]}
              valueFormatter={(value) =>
                selectedMetric === "cantidad"
                  ? value.toLocaleString("es-MX", {
                      maximumFractionDigits: 0,
                    })
                  : `${value.toLocaleString("es-MX", {
                      maximumFractionDigits: 0,
                    })} min`
              }
              showLegend={false}
              yAxisWidth={65}
              className="h-full"
              layout="vertical"
            />
          </div>
        </div>
      </div>
    </ReportCard>
  );
} 