"use client";

import { useEffect, useState } from "react";
import { Card, Title } from "@tremor/react";
import { BarChart } from "@/components/analytics/charts/BarChart";
import { formatNumber } from "@/components/analytics/utils/dataTransform";

interface ChiefPerformance {
  name: string;
  cajas_producidas: number;
  cajas_planificadas: number;
  cumplimiento: number;
}

export const ProductionChiefPerformance = () => {
  const [data, setData] = useState<ChiefPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/production-chief-performance");
        if (!response.ok) {
          throw new Error("Error al cargar los datos");
        }
        const data = await response.json();
        setData(data);
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
        <Title>Rendimiento por Jefe de Línea</Title>
        <div className="h-72 flex items-center justify-center">
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Title>Rendimiento por Jefe de Línea</Title>
        <div className="h-72 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <BarChart
      data={data}
      index="name"
      categories={["cumplimiento"]}
      colors={["blue"]}
      title="Rendimiento por Jefe de Línea"
      subtitle="Porcentaje de cumplimiento de producción"
      valueFormatter={(value) => `${formatNumber(value)}%`}
    />
  );
}; 