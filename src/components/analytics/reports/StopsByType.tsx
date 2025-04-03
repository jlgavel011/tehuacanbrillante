"use client";

import { useEffect, useState } from "react";
import { Card, Title, BarChart, DonutChart, Flex, TabGroup, TabList, Tab, TabPanels, TabPanel } from "@tremor/react";
import { formatNumber } from "@/lib/utils/formatters";

interface StopsByTypeData {
  name: string;
  paros: number;
  tiempo_total: number;
}

export function StopsByType() {
  const [data, setData] = useState<StopsByTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/stops-by-type");
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
      <Card className="h-full">
        <Title>Paros por Tipo</Title>
        <div className="h-[300px] flex items-center justify-center">
          Cargando datos...
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="h-full">
        <Title>Paros por Tipo</Title>
        <div className="h-[300px] flex items-center justify-center text-red-500">
          {error || "No hay datos disponibles"}
        </div>
      </Card>
    );
  }

  // Calculate totals for the summary
  const totalParos = data.reduce((acc, item) => acc + item.paros, 0);
  const totalTiempo = data.reduce((acc, item) => acc + item.tiempo_total, 0);

  return (
    <Card className="h-full">
      <Title>Paros por Tipo</Title>
      
      {/* Summary section */}
      <Flex className="mt-4" justifyContent="around">
        <div className="text-center">
          <Title>Total Paros</Title>
          <p className="text-tremor-metric font-semibold">{formatNumber(totalParos)}</p>
        </div>
        <div className="text-center">
          <Title>Tiempo Total</Title>
          <p className="text-tremor-metric font-semibold">{formatNumber(totalTiempo)} min</p>
        </div>
      </Flex>

      {/* Charts section */}
      <TabGroup className="mt-6">
        <TabList>
          <Tab>Distribución</Tab>
          <Tab>Comparación</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <DonutChart
              className="mt-4 h-52"
              data={data}
              category="tiempo_total"
              index="name"
              valueFormatter={(value) => `${formatNumber(value)} min`}
              colors={["amber-500", "indigo-500", "emerald-500"]}
            />
          </TabPanel>
          <TabPanel>
            <BarChart
              className="mt-4 h-52"
              data={data}
              index="name"
              categories={["paros", "tiempo_total"]}
              valueFormatter={(value) => formatNumber(value)}
              colors={["blue-500", "emerald-500"]}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  );
} 