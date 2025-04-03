import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "../charts/BarChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { CHART_PRESETS, getChartColors } from "@/config/chart-colors";

interface ChiefPerformanceData {
  name: string;
  cajas_producidas: number;
  cajas_planificadas: number;
  cumplimiento: number;
}

export function LineChiefPerformance() {
  const [data, setData] = useState<ChiefPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/line-chief-performance");
        if (!response.ok) {
          throw new Error("Error al cargar los datos");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por Jefe de Línea</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por Jefe de Línea</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.name,
    "Cajas Producidas": item.cajas_producidas,
    "Cajas Planificadas": item.cajas_planificadas,
    "% Cumplimiento": item.cumplimiento,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento por Jefe de Línea</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          data={chartData}
          index="name"
          categories={["Cajas Producidas", "Cajas Planificadas", "% Cumplimiento"]}
          colors={getChartColors("performance")}
          valueFormatter={(value) =>
            value.toLocaleString("es-MX", {
              maximumFractionDigits: 0,
            })
          }
          yAxisWidth={80}
          showLegend
          layout="vertical"
        />
      </CardContent>
    </Card>
  );
} 