"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Beaker } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "../../../components/dashboard/report-card";
import { BarChart } from "../charts/BarChart";
import { CATEGORY_COLORS, getCategoryColors } from "@/config/chart-colors";

interface DeviationImpactData {
  nombre: string;
  cantidad_paros: number;
  tiempo_total: number;
  impacto_porcentaje: number;
}

export function QualityDeviationsImpact() {
  const [data, setData] = useState<DeviationImpactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/quality-deviations-impact");
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
        title="Desviaciones de Calidad"
        subtitle="Impacto en la producción"
        icon={Beaker}
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
        title="Desviaciones de Calidad"
        subtitle="Impacto en la producción"
        icon={Beaker}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  const chartData = data.map((item) => ({
    name: item.nombre,
    "Tiempo Total": item.tiempo_total,
    "Cantidad de Paros": item.cantidad_paros,
    "Impacto %": item.impacto_porcentaje,
  }));

  return (
    <ReportCard
      title="Desviaciones de Calidad"
      subtitle="Impacto en la producción"
      icon={Beaker}
    >
      <div className="h-[300px]">
        <BarChart
          data={chartData}
          index="name"
          categories={["Tiempo Total", "Cantidad de Paros", "Impacto %"]}
          colors={getCategoryColors("quality")}
          valueFormatter={(value) =>
            value.toLocaleString("es-MX", {
              maximumFractionDigits: 1,
            })
          }
          className="h-full"
        />
      </div>
    </ReportCard>
  );
} 