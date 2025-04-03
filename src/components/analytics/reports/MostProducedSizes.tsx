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

interface Size {
  id: string;
  nombre: string;
}

interface SizeData {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export function MostProducedSizes() {
  const router = useRouter();
  const { date } = useDateRange();
  const [data, setData] = useState<SizeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!date?.from || !date?.to) return;

      setLoading(true);
      setError(null);
      try {
        // Primero obtenemos todos los tamaños
        const sizesResponse = await fetch('/api/tamanos');
        if (!sizesResponse.ok) throw new Error("Error al cargar los tamaños");
        const sizes: Size[] = await sizesResponse.json();

        // Luego obtenemos la producción para el rango de fechas
        const params = new URLSearchParams({
          from: date.from.toISOString(),
          to: date.to.toISOString(),
        });

        const productionResponse = await fetch(`/api/produccion?${params}`);
        if (!productionResponse.ok) throw new Error("Error al cargar la producción");
        const production = await productionResponse.json();

        // Calculamos la producción por tamaño
        const sizeProduction = sizes.map(size => {
          // Filtramos las producciones que corresponden a productos con este tamaño
          const produced = production
            .filter((p: any) => p.producto.tamanoId === size.id)
            .reduce((acc: number, curr: any) => acc + curr.cajasProducidas, 0);
          
          return {
            nombre: size.nombre,
            cantidad: produced,
          };
        }).filter(item => item.cantidad > 0); // Solo incluimos tamaños que tienen producción

        // Calculamos el total y los porcentajes
        const total = sizeProduction.reduce((acc, curr) => acc + curr.cantidad, 0);
        const sizeData = sizeProduction
          .map(item => ({
            ...item,
            porcentaje: (item.cantidad / total) * 100,
          }))
          .sort((a, b) => b.cantidad - a.cantidad);

        setData(sizeData);
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
        title="Tamaños Más Producidos"
        subtitle="Distribución de la producción por tamaño"
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
        title="Tamaños Más Producidos"
        subtitle="Distribución de la producción por tamaño"
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
        title="Tamaños Más Producidos"
        subtitle="Distribución de la producción por tamaño"
      >
        <Alert>
          <AlertDescription>No hay datos disponibles para el período seleccionado</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  const chartData = data.map((item) => ({
    name: item.nombre,
    value: item.cantidad,
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
            Cantidad:
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
            {data.payload.porcentaje?.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  const handleViewDetails = () => {
    router.push("/reports/sizes");
  };

  return (
    <ReportCard
      title="Tamaños Más Producidos"
      subtitle="Distribución de la producción por tamaño"
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
      <div className="flex items-center justify-center py-6 px-6">
        <div className="h-[350px] w-full">
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
        </div>
      </div>
    </ReportCard>
  );
} 