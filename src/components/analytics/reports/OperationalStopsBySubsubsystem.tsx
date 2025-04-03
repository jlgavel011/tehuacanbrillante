import { useEffect, useState } from "react";
import { Card, Title, TabGroup, TabList, Tab, TabPanels, TabPanel } from "@tremor/react";
import { BarChart } from "@tremor/react";
import { formatMinutesToHours } from "@/lib/utils/formatters";

interface OperationalStopData {
  name: string;
  paros: number;
  tiempo_total: number;
}

export function OperationalStopsBySubsubsystem() {
  const [data, setData] = useState<OperationalStopData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/operational-stops-by-subsubsystem');
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
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const totalParos = data.reduce((sum, item) => sum + item.paros, 0);
  const totalTime = data.reduce((sum, item) => sum + item.tiempo_total, 0);

  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div>
          <Title>Paros por Subsubsistema</Title>
          <p className="text-sm text-gray-600 mt-2">
            Total de paros: {totalParos} | Tiempo total: {formatMinutesToHours(totalTime)}
          </p>
        </div>
      </div>

      <TabGroup>
        <TabList className="mt-8">
          <Tab>Tiempo Total</Tab>
          <Tab>Cantidad de Paros</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <BarChart
              data={data}
              index="name"
              categories={["tiempo_total"]}
              colors={["blue"]}
              valueFormatter={formatMinutesToHours}
              yAxisWidth={48}
              showLegend={false}
            />
          </TabPanel>

          <TabPanel>
            <BarChart
              data={data}
              index="name"
              categories={["paros"]}
              colors={["blue"]}
              yAxisWidth={48}
              showLegend={false}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  );
} 