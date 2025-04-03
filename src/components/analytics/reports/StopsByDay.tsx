import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ValueFormatter } from "@tremor/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface DayStopData {
  dia: number;
  nombre: string;
  cantidad: number;
  tiempo_total: number;
  porcentaje: number;
}

const diasSemana = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function StopsByDay() {
  const [data, setData] = useState<DayStopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/stops-by-day");
        if (!response.ok) {
          throw new Error("Error al cargar los datos");
        }
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
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Paros por Día</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Paros por Día</CardTitle>
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
    "Cantidad de Paros": item.cantidad,
    "Porcentaje": item.porcentaje,
  }));

  const valueFormatter: ValueFormatter = (value: number, category?: string) => {
    if (category === "Tiempo Total") {
      return value.toLocaleString("es-MX", {
        maximumFractionDigits: 0,
      }) + " min";
    }
    return value.toLocaleString("es-MX", {
      maximumFractionDigits: 0,
    });
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Paros por Día</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <BarChart
            data={chartData}
            index="name"
            categories={["Tiempo Total", "Cantidad de Paros", "Porcentaje"]}
            colors={["blue", "emerald", "amber"]}
            valueFormatter={(value) =>
              value.toLocaleString("es-MX", {
                maximumFractionDigits: 1,
              })
            }
            className="h-full"
          />
        </div>
      </CardContent>
    </Card>
  );
} 