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
  DonutChart,
  Text,
} from "@tremor/react";
import { format, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Stop {
  id: string;
  fechaInicio: string;
  fechaFin: string | null;
  tiempoMinutos: number;
  tipo: string;
  descripcion: string | null;
  linea: string;
}

interface Summary {
  totalStops: number;
  totalTime: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
}

interface Distribution {
  tipo: string;
  count: number;
  totalTime: number;
}

export function StopsRegistry() {
  const [data, setData] = useState<Stop[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [distribution, setDistribution] = useState<Distribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [selectedType, setSelectedType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          date: format(date, "yyyy-MM-dd"),
          page: page.toString(),
          ...(selectedType && { tipoParoId: selectedType }),
        });

        const response = await fetch(`/api/analytics/detailed/stops-registry?${params}`);
        if (!response.ok) {
          throw new Error("Error al cargar los datos");
        }
        const result = await response.json();
        setData(result.data);
        setSummary(result.summary);
        setDistribution(result.distribution);
        setTotalPages(result.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [date, selectedType, page]);

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

  const getStopTypeBadge = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "mantenimiento":
        return <Badge color="red">{tipo}</Badge>;
      case "calidad":
        return <Badge color="yellow">{tipo}</Badge>;
      case "operativo":
        return <Badge color="blue">{tipo}</Badge>;
      default:
        return <Badge color="gray">{tipo}</Badge>;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const chartData = distribution.map((item) => ({
    name: item.tipo,
    value: item.totalTime,
  }));

  return (
    <Card>
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <Title>Registro de Paros</Title>
          <div className="flex gap-4">
            <Select
              value={selectedType}
              onValueChange={setSelectedType}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Paro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="calidad">Calidad</SelectItem>
                <SelectItem value="operativo">Operativo</SelectItem>
              </SelectContent>
            </Select>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Title className="text-lg mb-4">Distribución de Tiempo por Tipo</Title>
            <DonutChart
              data={chartData}
              category="value"
              index="name"
              valueFormatter={(value) => formatDuration(value)}
              colors={["red", "yellow", "blue"]}
            />
          </div>
          {summary && (
            <div className="grid grid-cols-2 gap-4">
              <Card decoration="top" decorationColor="blue">
                <Text>Total de Paros</Text>
                <Title className="mt-2">{summary.totalStops}</Title>
              </Card>
              <Card decoration="top" decorationColor="blue">
                <Text>Tiempo Total</Text>
                <Title className="mt-2">{formatDuration(summary.totalTime)}</Title>
              </Card>
              <Card decoration="top" decorationColor="gray">
                <Text>Tiempo Promedio</Text>
                <Title className="mt-2">{formatDuration(summary.averageTime)}</Title>
              </Card>
              <Card decoration="top" decorationColor="gray">
                <Text>Tiempo Máximo</Text>
                <Title className="mt-2">{formatDuration(summary.maxTime)}</Title>
              </Card>
            </div>
          )}
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Fecha y Hora</TableHeaderCell>
              <TableHeaderCell>Línea</TableHeaderCell>
              <TableHeaderCell>Tipo</TableHeaderCell>
              <TableHeaderCell>Duración</TableHeaderCell>
              <TableHeaderCell>Descripción</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((stop) => (
              <TableRow key={stop.id}>
                <TableCell>
                  {format(new Date(stop.fechaInicio), "PPp", { locale: es })}
                </TableCell>
                <TableCell>{stop.linea}</TableCell>
                <TableCell>{getStopTypeBadge(stop.tipo)}</TableCell>
                <TableCell>{formatDuration(stop.tiempoMinutos)}</TableCell>
                <TableCell>{stop.descripcion || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    </Card>
  );
} 