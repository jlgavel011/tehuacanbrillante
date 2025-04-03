import { useEffect, useState } from "react";
import { Card, Title, BarChart } from "@tremor/react";
import { formatNumber } from "@/lib/utils/formatters";

interface ProductionData {
  name: string;
  cajas: number;
  planificadas: number;
  cumplimiento: number;
}

export function TotalProductionByProduct() {
  const [data, setData] = useState<ProductionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/total-production-by-product');
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
        <Title>Producción Total por Producto</Title>
        <div className="h-[300px] flex items-center justify-center">
          Cargando datos...
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="h-full">
        <Title>Producción Total por Producto</Title>
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
          <Title>Producción Total por Producto</Title>
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
      />
    </Card>
  );
} 