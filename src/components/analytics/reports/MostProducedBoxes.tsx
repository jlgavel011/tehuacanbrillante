"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/dashboard/report-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDateRange } from "@/context/DateRangeContext";
import { PieChart } from "../charts/PieChart";

interface BoxData {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export function MostProducedBoxes() {
  const router = useRouter();
  const { date } = useDateRange();
  const [data, setData] = useState<BoxData[]>([]);
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

        const response = await fetch(`/api/analytics/most-produced-boxes?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos");
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date]);

  const handleViewMore = () => {
    router.push("/reports/boxes");
  };

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
            Cajas:
          </span>
          <span className="text-sm font-medium">
            {data.value.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="h-3 w-3 rounded-full opacity-0"
          />
          <span className="text-sm text-muted-foreground">
            Porcentaje:
          </span>
          <span className="text-sm font-medium">
            {data.payload.porcentaje.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  const chartData = data.map(item => ({
    name: item.nombre,
    value: item.cantidad,
    porcentaje: item.porcentaje
  }));

  return (
    <ReportCard
      title="Cajas Más Producidas"
      subtitle="Distribución de producción por tipo de caja"
      headerExtra={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleViewMore}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      }
      className="p-0"
    >
      <div className="border-b border-border/50" />
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
              customTooltip={CustomTooltip}
              className="h-full"
              valueFormatter={(value: number) => 
                value.toLocaleString("es-MX", {
                  maximumFractionDigits: 0,
                })
              }
            />
          )}
        </div>
      </div>
    </ReportCard>
  );
} 