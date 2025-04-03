import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Cog } from "lucide-react";
import { BarChart } from "@tremor/react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "./ReportCard";

interface SystemStopData {
  sistema: string;
  subsistema: string;
  cantidad: number;
  tiempo_total: number;
  porcentaje: number;
}

export function StopsBySystem() {
  const [data, setData] = useState<SystemStopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/stops-by-system");
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
        title="Paros por Sistema"
        subtitle="Distribución por sistema y subsistema"
        icon={Cog}
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
        title="Paros por Sistema"
        subtitle="Distribución por sistema y subsistema"
        icon={Cog}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  const chartData = data.map((item) => ({
    name: `${item.sistema} - ${item.subsistema}`,
    "Tiempo Total": item.tiempo_total,
    "Cantidad de Paros": item.cantidad,
  }));

  return (
    <ReportCard
      title="Paros por Sistema"
      subtitle="Distribución por sistema y subsistema"
      icon={Cog}
    >
      <div className="h-[300px]">
        <BarChart
          data={chartData}
          index="name"
          categories={["Tiempo Total", "Cantidad de Paros"]}
          colors={["cyan", "blue"]}
          valueFormatter={(value) =>
            value.toLocaleString("es-MX", {
              maximumFractionDigits: 0,
            })
          }
          className="h-full"
        />
      </div>
    </ReportCard>
  );
} 