"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "../charts/BarChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { CATEGORY_COLORS, getCategoryColors } from "@/config/chart-colors";

interface RawMaterialIssueData {
  nombre: string;
  cantidad_paros: number;
  tiempo_total: number;
  impacto_porcentaje: number;
}

export function RawMaterialsWithIssues() {
  const [data, setData] = useState<RawMaterialIssueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/raw-materials-with-issues");
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
          <CardTitle>Materias Primas con Más Problemas de Calidad</CardTitle>
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
          <CardTitle>Materias Primas con Más Problemas de Calidad</CardTitle>
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
    name: item.nombre,
    "Cantidad de Paros": item.cantidad_paros,
    "Tiempo Total (min)": item.tiempo_total,
    "% Impacto": item.impacto_porcentaje,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materias Primas con Más Problemas de Calidad</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          data={chartData}
          index="name"
          categories={["Cantidad de Paros", "Tiempo Total (min)", "% Impacto"]}
          colors={getCategoryColors("quality")}
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