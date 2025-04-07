"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/dashboard/report-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDateRange } from "@/context/DateRangeContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart } from "../charts/BarChart";

interface OperationalStopData {
  name: string;
  paros: number;
  tiempo_total: number;
  porcentaje: number;
}

export function OperationalStopsByLine() {
  const router = useRouter();
  const { date } = useDateRange();
  const [data, setData] = useState<OperationalStopData[]>([]);
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

        console.log(`Consultando paros operativos con fechas: ${date.from.toISOString()} - ${date.to.toISOString()}`);
        const response = await fetch(`/api/analytics/operational-stops-by-line?${params}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error en la respuesta:", errorData);
          throw new Error(errorData.error || "Error al cargar los datos");
        }
        
        const result = await response.json();
        console.log("Datos recibidos de paros operativos por línea:", result);
        
        // Asegurar que tenemos el formato correcto
        if (Array.isArray(result) && result.length > 0) {
          setData(result);
        } else {
          console.log("No se encontraron datos para el período");
          setData([]);
        }
      } catch (err) {
        console.error("Error fetching operational stops by line:", err);
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
        title="Líneas con Más Paros por Operación"
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
        title="Líneas con Más Paros por Operación"
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
        title="Líneas con Más Paros por Operación"
        subtitle="Distribución de paros por línea de producción"
      >
        <Alert className="bg-amber-50">
          <Info className="h-4 w-4" />
          <AlertDescription>No hay datos de paros operativos para el período seleccionado</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  // Preparar los datos para el gráfico de barras
  const chartData = data.map((item) => ({
    name: item.name,
    Cantidad: selectedMetric === "cantidad" ? item.paros : item.tiempo_total,
  }));

  const handleViewDetails = () => {
    router.push("/reports/operational-stops");
  };
  
  return (
    <ReportCard
      title="Líneas con Más Paros por Operación"
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