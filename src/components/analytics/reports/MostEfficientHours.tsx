"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@tremor/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface HourEfficiencyData {
  hour: number;
  cajas_producidas: number;
  cajas_planificadas: number;
  cumplimiento: number;
}

export function MostEfficientHours() {
  const [data, setData] = useState<HourEfficiencyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/most-efficient-hours");
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
          <CardTitle>Horas Más Eficientes</CardTitle>
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
          <CardTitle>Horas Más Eficientes</CardTitle>
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
    hour: `${item.hour}:00`,
    "Cajas Producidas": item.cajas_producidas,
    "Cajas Planificadas": item.cajas_planificadas,
    "% Cumplimiento": item.cumplimiento,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horas Más Eficientes</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          data={chartData}
          index="hour"
          categories={["Cajas Producidas", "Cajas Planificadas", "% Cumplimiento"]}
          colors={["blue", "gray", "green"]}
          valueFormatter={(value) =>
            value.toLocaleString("es-MX", {
              maximumFractionDigits: 0,
            })
          }
          yAxisWidth={80}
          showLegend
        />
      </CardContent>
    </Card>
  );
} 