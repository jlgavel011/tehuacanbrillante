import { useEffect, useState } from "react";
import { Card, Title, BarChart } from "@tremor/react";
import { formatNumber } from "@/lib/utils/formatters";

interface ProductionData {
  name: string;
  litros: number;
  litrosPlanificados: number;
  cumplimiento: number;
}

export function TotalProductionByProductLiters() {
  const [data, setData] = useState<ProductionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/total-production-by-product-liters');
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
        <Title>Producción Total por Producto (Litros)</Title>
        <div className="h-[300px] flex items-center justify-center">
          Cargando datos...
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="h-full">
        <Title>Producción Total por Producto (Litros)</Title>
        <div className="h-[300px] flex items-center justify-center text-red-500">
          {error || "No hay datos disponibles"}
        </div>
      </Card>
    );
  }

  const totalLitros = data.reduce((sum, item) => sum + item.litros, 0);
  const totalPlanificados = data.reduce((sum, item) => sum + item.litrosPlanificados, 0);
  const cumplimientoPromedio = (totalLitros / totalPlanificados) * 100;

  return (
    <Card className="h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Title>Producción Total por Producto (Litros)</Title>
          <p className="text-sm text-gray-600 mt-2">
            Total de litros: {formatNumber(totalLitros)} | Planificados: {formatNumber(totalPlanificados)} | 
            Cumplimiento: {formatNumber(cumplimientoPromedio)}%
          </p>
        </div>
      </div>

      <BarChart
        data={data}
        index="name"
        categories={["litros", "litrosPlanificados"]}
        colors={["blue", "gray"]}
        valueFormatter={formatNumber}
        yAxisWidth={48}
        stack={false}
      />
    </Card>
  );
} 