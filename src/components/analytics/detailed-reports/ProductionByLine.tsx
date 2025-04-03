import { useState, useEffect } from "react";
import {
  Card,
  Title,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  BarChart,
  Text,
} from "@tremor/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";

interface Production {
  id: string;
  fechaProduccion: string;
  producto: string;
  cajasProducidas: number;
  cajasPlanificadas: number;
  cumplimiento: number;
}

interface LineData {
  id: string;
  nombre: string;
  totalCajas: number;
  cajasPlanificadas: number;
  cumplimiento: number;
  producciones: Production[];
}

interface Summary {
  totalProducido: number;
  totalPlanificado: number;
  cumplimientoPromedio: number;
}

export function ProductionByLine() {
  const [data, setData] = useState<LineData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/analytics/detailed/production-by-line?date=${format(date, "yyyy-MM-dd")}`
        );
        if (!response.ok) {
          throw new Error("Error al cargar los datos");
        }
        const result = await response.json();
        setData(result.data);
        setSummary(result.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [date]);

  if (isLoading) {
    return (
      <Card>
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse">Cargando...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="h-96 flex items-center justify-center text-red-500">
          {error}
        </div>
      </Card>
    );
  }

  const chartData = data.map((line) => ({
    linea: line.nombre,
    "Cajas Producidas": line.totalCajas,
    "Cajas Planificadas": line.cajasPlanificadas,
    Cumplimiento: line.cumplimiento,
  }));

  const getCumplimientoBadge = (cumplimiento: number) => {
    if (cumplimiento >= 95) return <Badge color="green">{cumplimiento.toFixed(1)}%</Badge>;
    if (cumplimiento >= 85) return <Badge color="yellow">{cumplimiento.toFixed(1)}%</Badge>;
    return <Badge color="red">{cumplimiento.toFixed(1)}%</Badge>;
  };

  return (
    <Card>
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <Title>Producción por Línea</Title>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="mt-6">
          <BarChart
            data={chartData}
            index="linea"
            categories={["Cajas Producidas", "Cajas Planificadas"]}
            colors={["blue", "gray"]}
            yAxisWidth={48}
            valueFormatter={(number: number) => number.toLocaleString()}
            showLegend
            onValueChange={(v) => {
              if (typeof v === "object" && v !== null && "linea" in v) {
                setSelectedLine(v.linea as string);
              }
            }}
          />
        </div>

        {selectedLine && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <Title className="text-lg">Detalle de Producción - {selectedLine}</Title>
              <Button
                variant="ghost"
                onClick={() => setSelectedLine(null)}
              >
                Cerrar
              </Button>
            </div>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Hora</TableHeaderCell>
                  <TableHeaderCell>Producto</TableHeaderCell>
                  <TableHeaderCell>Cajas Producidas</TableHeaderCell>
                  <TableHeaderCell>Cajas Planificadas</TableHeaderCell>
                  <TableHeaderCell>Cumplimiento</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data
                  .find((l) => l.nombre === selectedLine)
                  ?.producciones.map((prod) => (
                    <TableRow key={prod.id}>
                      <TableCell>
                        {format(new Date(prod.fechaProduccion), "HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>{prod.producto}</TableCell>
                      <TableCell>{prod.cajasProducidas.toLocaleString()}</TableCell>
                      <TableCell>{prod.cajasPlanificadas.toLocaleString()}</TableCell>
                      <TableCell>{getCumplimientoBadge(prod.cumplimiento)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}

        {summary && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card decoration="top" decorationColor="blue">
              <Text>Total Cajas Producidas</Text>
              <Title className="mt-2">
                {summary.totalProducido.toLocaleString()}
              </Title>
            </Card>
            <Card decoration="top" decorationColor="gray">
              <Text>Total Cajas Planificadas</Text>
              <Title className="mt-2">
                {summary.totalPlanificado.toLocaleString()}
              </Title>
            </Card>
            <Card decoration="top" decorationColor="green">
              <Text>Cumplimiento Promedio</Text>
              <Title className="mt-2">
                {getCumplimientoBadge(summary.cumplimientoPromedio)}
              </Title>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
} 