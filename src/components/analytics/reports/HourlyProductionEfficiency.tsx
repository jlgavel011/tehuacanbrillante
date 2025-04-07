"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BarChart } from "@/components/analytics/charts/BarChart";
import { formatNumber } from "@/lib/utils/formatters";
import { useDateRange } from "@/context/DateRangeContext";
import { ReportCard } from "@/components/dashboard/report-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ProductLineEfficiency {
  productoId: string;
  productoNombre: string;
  lineaProduccionId: string;
  lineaProduccionNombre: string;
  promedioCajasHora: number;
  velocidadPlan: number;
  eficiencia: number;
  desviacion: number;
  totalRegistros: number;
}

export function HourlyProductionEfficiency() {
  const { date } = useDateRange();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProductLineEfficiency[]>([]);
  const [averageEfficiency, setAverageEfficiency] = useState<number>(0);
  const [usingDummyData, setUsingDummyData] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!date?.from || !date?.to) return;

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          from: date.from.toISOString(),
          to: date.to.toISOString(),
          limit: "5", // Only get the top 5 most deviated products
        });

        const response = await fetch(`/api/analytics/hourly-production-efficiency?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos");
        
        const result = await response.json();
        
        setData(result.topDeviated);
        setAverageEfficiency(result.averageEfficiency);
        setUsingDummyData(result.usingDummyData || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date?.from?.getTime(), date?.to?.getTime()]);

  const handleViewDetails = () => {
    router.push('/reports/hourly-production-efficiency');
  };

  // Format data for the bar chart
  const chartData = data.map(item => ({
    product: item.productoNombre.length > 15 
      ? `${item.productoNombre.substring(0, 15)}...` 
      : item.productoNombre,
    "Real (cajas/hr)": item.promedioCajasHora,
    "Plan (cajas/hr)": item.velocidadPlan,
    desviacion: item.desviacion,
  }));

  const colors = ["#16a34a", "#4ade80"]; // Verde oscuro para Plan, verde claro para Real

  // Determinar la clase de color según la eficiencia
  const getEfficiencyColorClass = (efficiency: number) => {
    if (efficiency >= 1.05) return "text-green-600";
    if (efficiency >= 0.95) return "text-amber-500";
    return "text-red-600";
  };

  return (
    <ReportCard
      title="Eficiencia Cajas por Hora"
      subtitle="Comparación de velocidad de producción real vs planificada"
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
      {usingDummyData && (
        <div className="absolute top-0 right-0 z-10 mt-2 mr-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  Datos de Ejemplo
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-52">
                  Mostrando datos de ejemplo porque hubo un problema al consultar la base de datos.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <div className="border-b border-border/50" />
      <div className="flex flex-col gap-2">
        <div className="px-6 pt-4">
          <div className="rounded-lg bg-[#e2f1f8]/20 p-4 text-center">
            <p className="text-sm text-muted-foreground">Eficiencia Promedio de Producción</p>
            <p className={`text-xl font-semibold ${loading ? '' : getEfficiencyColorClass(averageEfficiency)}`}>
              {loading ? '-' : `${(averageEfficiency * 100).toFixed(1)}%`}
              {!loading && (
                <span className="ml-2 inline-flex">
                  {averageEfficiency >= 1 ? 
                    <TrendingUp className="h-5 w-5 text-green-600" /> : 
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  }
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Top 5 productos con mayor desviación</p>
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
        ) : data.length === 0 ? (
          <div className="p-6">
            <Alert>
              <AlertDescription>
                No hay datos disponibles para el período seleccionado
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 px-6 min-h-[350px]">
            <div className="h-[350px] w-full">
              <BarChart
                data={chartData}
                index="product"
                categories={["Real (cajas/hr)", "Plan (cajas/hr)"]}
                colors={colors}
                valueFormatter={(value) => formatNumber(value)}
                className="h-full"
              />
            </div>
          </div>
        )}
      </div>
    </ReportCard>
  );
} 