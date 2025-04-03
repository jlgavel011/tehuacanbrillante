import { useEffect, useState } from "react";
import { Card, Title } from "@tremor/react";
import { PieChart } from "../charts/PieChart";

interface ProductData {
  name: string;
  cajas: number;
  cajasPlanificadas: number;
  cumplimiento: number;
}

export function ProductionByModelBoxes() {
  const [data, setData] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/production-by-model-boxes");
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload) return null;
    const data = payload[0];
    if (!data) return null;

    const item = data.payload;

    return (
      <div className="rounded-lg border bg-white p-2 shadow-md">
        <div className="font-medium">{data.name}</div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="text-sm text-muted-foreground">
            Cajas:
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
            Planificadas:
          </span>
          <span className="text-sm font-medium">
            {item.cajasPlanificadas.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="h-3 w-3 rounded-full opacity-0"
          />
          <span className="text-sm text-muted-foreground">
            Cumplimiento:
          </span>
          <span className="text-sm font-medium">
            {item.cumplimiento.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse">Cargando...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="h-80 flex items-center justify-center text-red-500">
          {error}
        </div>
      </Card>
    );
  }

  const totalCajas = data.reduce((sum, item) => sum + item.cajas, 0);
  const totalCajasPlanificadas = data.reduce((sum, item) => sum + item.cajasPlanificadas, 0);
  const promedioCumplimiento = data.reduce((sum, item) => sum + item.cumplimiento, 0) / data.length;

  const chartData = data.map((item) => ({
    name: item.name,
    value: item.cajas,
    cajasPlanificadas: item.cajasPlanificadas,
    cumplimiento: item.cumplimiento,
  }));

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border/50">
        <Title>Producción por Modelo (Cajas)</Title>
      </div>
      
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

      <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Total Cajas</p>
          <p className="text-xl font-semibold">{totalCajas.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Cajas Planificadas</p>
          <p className="text-xl font-semibold">{totalCajasPlanificadas.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Cumplimiento Promedio</p>
          <p className="text-xl font-semibold">{promedioCumplimiento.toFixed(1)}%</p>
        </div>
      </div>
    </Card>
  );
} 