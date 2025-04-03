import { useEffect, useState } from "react";
import { Card, Title, BarChart } from "@tremor/react";

interface FlavorData {
  name: string;
  cajas: number;
  cajasPlanificadas: number;
  cumplimiento: number;
}

export function ProductionByFlavorBoxes() {
  const [data, setData] = useState<FlavorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/production-by-flavor-boxes");
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
    "Cajas Producidas": item.cajas,
    "Cajas Planificadas": item.cajasPlanificadas,
  }));

  return (
    <Card>
      <div className="p-4">
        <Title>Producción por Sabor (Cajas)</Title>
        
        <div className="mt-4">
          <BarChart
            data={chartData}
            index="name"
            categories={["Cajas Producidas", "Cajas Planificadas"]}
            colors={["blue", "gray"]}
            valueFormatter={(value) => `${value.toLocaleString()} cajas`}
            yAxisWidth={80}
            className="h-80"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>
    </Card>
  );
} 