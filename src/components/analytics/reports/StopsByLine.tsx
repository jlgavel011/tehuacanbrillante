"use client";

import { useEffect, useState } from "react";
import { Card } from "@tremor/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/dashboard/report-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { PieChart } from "../charts/PieChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StopData {
  name: string;
  cantidad: number;
  tiempo_total: number;
  porcentaje: number;
}

export function StopsByLine() {
  const router = useRouter();
  const { date, selectedPeriod, setSelectedPeriod, setDate } = useDateRangeFilter();
  const [data, setData] = useState<StopData[]>([]);
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

        const response = await fetch(`/api/analytics/stops-by-line?${params}`);
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

  const handleViewDetails = () => {
    router.push("/reports/stops-by-line");
  };

  const chartData = data.map((item) => ({
    name: item.name,
    value: selectedMetric === "cantidad" ? item.cantidad : item.tiempo_total,
    porcentaje: item.porcentaje,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload) return null;
    const data = payload[0];
    if (!data) return null;

    return (
      <div className="rounded-lg border bg-white p-2 shadow-md">
        <div className="font-medium">{data.name}</div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="text-sm text-muted-foreground">
            {selectedMetric === "cantidad" ? "Cantidad:" : "Tiempo Total:"}
          </span>
          <span className="text-sm font-medium">
            {selectedMetric === "cantidad"
              ? data.value.toLocaleString("es-MX")
              : `${data.value.toLocaleString("es-MX")} min`}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-3 w-3 rounded-full opacity-0" />
          <span className="text-sm text-muted-foreground">Porcentaje:</span>
          <span className="text-sm font-medium">
            {data.payload.porcentaje.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <ReportCard
      title="Paros por Línea"
      subtitle="Análisis de paros por línea de producción"
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
        <div className="flex items-center justify-center py-6 px-6">
          <div className="h-[350px] w-full">
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : data.length === 0 ? (
              <Alert>
                <AlertDescription>No hay datos disponibles para el período seleccionado</AlertDescription>
              </Alert>
            ) : (
              <PieChart
                data={chartData}
                colors={["#FFE091", "#FFCB47", "#FFA500"]}
                customTooltip={CustomTooltip}
                className="h-full"
                valueFormatter={(value) =>
                  selectedMetric === "cantidad"
                    ? value.toLocaleString("es-MX", {
                        maximumFractionDigits: 0,
                      })
                    : `${value.toLocaleString("es-MX", {
                        maximumFractionDigits: 0,
                      })} min`
                }
              />
            )}
          </div>
        </div>
      </div>
    </ReportCard>
  );
} 