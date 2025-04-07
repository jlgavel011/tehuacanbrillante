"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ArrowLeft, Search, ChevronUp, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart } from "@/components/analytics/charts/BarChart";
import { DateRangeProvider, useDateRange } from "@/context/DateRangeContext";

interface ShiftWithBoxesData {
  id: number;
  nombre: string;
  cajasPlanificadas: number;
  cajasProducidas: number;
  diferencia: number;
  diferenciaPorcentaje: number;
  totalOrdenes: number;
}

interface PlannedVsProducedBoxesByShiftResponse {
  data: ShiftWithBoxesData[];
  totalTurnos: number;
  promedioDesviacionPositiva: number;
  promedioDesviacionNegativa: number;
}

function PlannedVsProducedBoxesByShiftDetail() {
  const router = useRouter();
  const { date: dateRange } = useDateRange();
  const [data, setData] = useState<ShiftWithBoxesData[]>([]);
  const [filteredData, setFilteredData] = useState<ShiftWithBoxesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("cajasProducidas");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [promedioDesviacionPositiva, setPromedioDesviacionPositiva] = useState(0);
  const [promedioDesviacionNegativa, setPromedioDesviacionNegativa] = useState(0);
  const [totalTurnos, setTotalTurnos] = useState(0);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  useEffect(() => {
    // Apply search filter
    if (searchTerm.trim() === "") {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item => 
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, data]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const from = dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = dateRange?.to?.toISOString() || new Date().toISOString();
      
      const response = await fetch(
        `/api/analytics/planned-vs-produced-boxes-by-shift?from=${from}&to=${to}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result: PlannedVsProducedBoxesByShiftResponse = await response.json();
      
      if (result.data.length === 0) {
        setError("No se encontraron datos para el período seleccionado");
        setData([]);
        setFilteredData([]);
      } else {
        setData(result.data);
        setFilteredData(result.data);
        setPromedioDesviacionPositiva(result.promedioDesviacionPositiva);
        setPromedioDesviacionNegativa(result.promedioDesviacionNegativa);
        setTotalTurnos(result.totalTurnos);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar los datos. Por favor intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
    
    const sorted = [...filteredData].sort((a, b) => {
      // @ts-ignore
      const aValue = a[column];
      // @ts-ignore
      const bValue = b[column];
      
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      } else {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    });
    
    setFilteredData(sorted);
  };

  // Calcular totales
  const totalCajasPlanificadas = filteredData.reduce((sum, item) => sum + item.cajasPlanificadas, 0);
  const totalCajasProducidas = filteredData.reduce((sum, item) => sum + item.cajasProducidas, 0);
  const totalCumplimiento = totalCajasPlanificadas > 0 
    ? (totalCajasProducidas / totalCajasPlanificadas) * 100 
    : 0;

  // Preparar datos para el gráfico
  const chartData = filteredData.map(item => ({
    shift: item.nombre,
    "Cajas Planificadas": item.cajasPlanificadas,
    "Cajas Producidas": item.cajasProducidas
  }));

  function getEfficiencyColorClass(value: number): string {
    if (value >= 10) return "text-green-600"; // Sobrecumplimiento
    if (value <= -10) return "text-red-600"; // Incumplimiento
    return "text-amber-500"; // Cerca del objetivo
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Cajas Planificadas vs Producidas por Turno</h1>
        </div>
        <DateRangeFilter
          date={dateRange}
          selectedPeriod={dateRange ? "custom" : "30d"}
          onPeriodChange={() => {}}
          onDateChange={() => {}}
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3 px-4">
                <div className="text-2xl font-bold">{totalTurnos}</div>
                <p className="text-xs text-muted-foreground">
                  turnos analizados en periodo seleccionado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">Cajas Planificadas</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3 px-4">
                <div className="text-2xl font-bold">{totalCajasPlanificadas.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  total en el periodo seleccionado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">Cajas Producidas</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3 px-4">
                <div className="text-2xl font-bold">{totalCajasProducidas.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  total en el periodo seleccionado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">Cumplimiento</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3 px-4">
                <div className={`text-2xl font-bold ${getEfficiencyColorClass(totalCumplimiento - 100)}`}>
                  {totalCumplimiento.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  promedio general de cumplimiento
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico */}
          <Card>
            <CardHeader>
              <CardTitle>Comparación por Turno</CardTitle>
              <CardDescription>
                Comparación de cajas planificadas vs producidas por turno
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <BarChart
                  data={chartData}
                  index="shift"
                  categories={["Cajas Planificadas", "Cajas Producidas"]}
                  colors={["#94A3B8", "#22C55E"]}
                  valueFormatter={(value) => value.toLocaleString("es-MX")}
                  layout="vertical"
                  className="h-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabla de datos */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle por Turno</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por turno..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("nombre")}
                    >
                      <div className="flex items-center">
                        Turno
                        {sortColumn === "nombre" && (
                          sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer"
                      onClick={() => handleSort("cajasPlanificadas")}
                    >
                      <div className="flex items-center justify-end">
                        Cajas Planificadas
                        {sortColumn === "cajasPlanificadas" && (
                          sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer"
                      onClick={() => handleSort("cajasProducidas")}
                    >
                      <div className="flex items-center justify-end">
                        Cajas Producidas
                        {sortColumn === "cajasProducidas" && (
                          sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer"
                      onClick={() => handleSort("diferencia")}
                    >
                      <div className="flex items-center justify-end">
                        Diferencia
                        {sortColumn === "diferencia" && (
                          sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer"
                      onClick={() => handleSort("diferenciaPorcentaje")}
                    >
                      <div className="flex items-center justify-end">
                        % Desviación
                        {sortColumn === "diferenciaPorcentaje" && (
                          sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer"
                      onClick={() => handleSort("totalOrdenes")}
                    >
                      <div className="flex items-center justify-end">
                        Órdenes
                        {sortColumn === "totalOrdenes" && (
                          sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.nombre}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.cajasPlanificadas.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.cajasProducidas.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={
                          item.diferencia > 0 
                            ? "text-green-600" 
                            : item.diferencia < 0 
                              ? "text-red-600" 
                              : ""
                        }>
                          {item.diferencia > 0 ? "+" : ""}{item.diferencia.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={getEfficiencyColorClass(item.diferenciaPorcentaje)}>
                          {item.diferenciaPorcentaje > 0 ? "+" : ""}{item.diferenciaPorcentaje.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.totalOrdenes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Wrapper component that provides DateRangeProvider context
export default function PlannedVsProducedBoxesByShiftDetailPage() {
  return (
    <DateRangeProvider>
      <PlannedVsProducedBoxesByShiftDetail />
    </DateRangeProvider>
  );
} 