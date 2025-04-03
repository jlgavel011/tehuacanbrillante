import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@tremor/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface QualityDeviationStopData {
  nombre: string;
  cantidad: number;
  tiempo_total: number;
  porcentaje: number;
}

export function StopsByQualityDeviation() {
  const [data, setData] = useState<QualityDeviationStopData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/stops-by-quality-deviation");
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
          <CardTitle>Paros por Desviación de Calidad</CardTitle>
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
          <CardTitle>Paros por Desviación de Calidad</CardTitle>
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
    "Tiempo Total": item.tiempo_total,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paros por Desviación de Calidad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <BarChart
            data={chartData}
            index="name"
            categories={["Tiempo Total"]}
            valueFormatter={(value) =>
              value.toLocaleString("es-MX", {
                maximumFractionDigits: 0,
              }) + " min"
            }
            colors={["red"]}
          />

          <div className="space-y-2">
            {data.map((item) => (
              <div
                key={item.nombre}
                className="flex justify-between items-center"
              >
                <span className="font-medium">{item.nombre}</span>
                <span className="text-sm">
                  {item.porcentaje.toFixed(1)}% ({item.cantidad} paros)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 