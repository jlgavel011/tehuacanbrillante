import { useEffect, useState } from "react";
import { Card, Title, BarChart } from "@tremor/react";
import { formatNumber } from "@/lib/utils/formatters";

interface SizeData {
  name: string;
  litros: number;
  cajas: number;
  planificadas: number;
  cumplimiento: number;
}

export function ProductionBySize() {
  const [data, setData] = useState<SizeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/production-by-size');
        if (!response.ok) {
          throw new Error('Error al obtener los datos');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full">
        <Title>Producción por Tamaño</Title>
        <div className="h-[300px] flex items-center justify-center">
          Cargando datos...
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="h-full">
        <Title>Producción por Tamaño</Title>
        <div className="h-[300px] flex items-center justify-center text-red-500">
          {error || "No hay datos disponibles"}
        </div>
      </Card>
    );
  }

  const totalCajas = data.reduce((sum, item) => sum + item.cajas, 0);
  const totalPlanificadas = data.reduce((sum, item) => sum + item.planificadas, 0);
  const cumplimientoPromedio = (totalCajas / totalPlanificadas) * 100;

  return (
    <Card className="h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Title>Producción por Tamaño</Title>
          <p className="text-sm text-gray-600 mt-2">
            Total de cajas: {formatNumber(totalCajas)} | Planificadas: {formatNumber(totalPlanificadas)} | 
            Cumplimiento: {formatNumber(cumplimientoPromedio)}%
          </p>
        </div>
      </div>

      <BarChart
        data={data}
        index="name"
        categories={["cajas", "planificadas"]}
        colors={["blue", "gray"]}
        valueFormatter={formatNumber}
        yAxisWidth={48}
        stack={false}
        layout="vertical"
      />
    </Card>
  );
} 