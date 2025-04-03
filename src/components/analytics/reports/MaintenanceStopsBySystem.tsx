"use client";

import { useEffect, useState } from "react";
import { Card, Title, BarChart, TabGroup, TabList, Tab, TabPanels, TabPanel, Flex } from "@tremor/react";
import { formatNumber } from "@/lib/utils/formatters";

interface MaintenanceStopData {
  name: string;
  paros: number;
  tiempo_total: number;
  linea: string;
}

export function MaintenanceStopsBySystem() {
  const [data, setData] = useState<MaintenanceStopData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/maintenance-stops-by-system");
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
        <Title>Sistemas con Más Paros por Mantenimiento</Title>
        <div className="h-[300px] flex items-center justify-center">
          Cargando datos...
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="h-full">
        <Title>Sistemas con Más Paros por Mantenimiento</Title>
        <div className="h-[300px] flex items-center justify-center text-red-500">
          {error || "No hay datos disponibles"}
        </div>
      </Card>
    );
  }

  // Calculate totals for the summary
  const totalParos = data.reduce((acc, item) => acc + item.paros, 0);
  const totalTiempo = data.reduce((acc, item) => acc + item.tiempo_total, 0);

  // Format data for display
  const formattedData = data.map(item => ({
    ...item,
    name: `${item.name} (${item.linea})`
  }));

  return (
    <Card className="h-full">
      <Title>Sistemas con Más Paros por Mantenimiento</Title>
      
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
          <Tab>Tiempo Total</Tab>
          <Tab>Cantidad de Paros</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <BarChart
              className="mt-4 h-72"
              data={formattedData}
              index="name"
              categories={["tiempo_total"]}
              valueFormatter={(value) => `${formatNumber(value)} min`}
              colors={["blue-500"]}
            />
          </TabPanel>
          <TabPanel>
            <BarChart
              className="mt-4 h-72"
              data={formattedData}
              index="name"
              categories={["paros"]}
              valueFormatter={formatNumber}
              colors={["emerald-500"]}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  );
} 