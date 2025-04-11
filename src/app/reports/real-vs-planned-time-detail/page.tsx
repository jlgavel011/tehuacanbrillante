"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useDateRange, DateRangeProvider } from "@/context/DateRangeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Download,
  ArrowUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Interfaces para los datos
interface OrdenTiempoReal {
  id: string;
  numeroOrden: number;
  producto: string;
  productoId: string;
  lineaProduccion: string;
  lineaProduccionId: string;
  fechaProduccion: Date;
  tiempoPlan: number;
  tiempoReal: number;
  diferencia: number;
  diferenciaPorcentaje: number;
  porcentajeCumplimiento?: number;
}

interface RealVsPlannedTimeResponse {
  data: OrdenTiempoReal[];
  totalOrdenes: number;
  promedioDesviacionPositiva: number;
  promedioDesviacionNegativa: number;
  filtroCompletadas?: boolean;
}

type SortField = "orden" | "producto" | "linea" | "fecha" | "plan" | "real" | "diferencia" | "porcentaje";
type SortDirection = "asc" | "desc";

function RealVsPlannedTimeDetail() {
  const router = useRouter();
  const { date: dateRange } = useDateRange();
  const [data, setData] = useState<OrdenTiempoReal[]>([]);
  const [filteredData, setFilteredData] = useState<OrdenTiempoReal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promedioDesviacionPositiva, setPromedioDesviacionPositiva] = useState(0);
  const [promedioDesviacionNegativa, setPromedioDesviacionNegativa] = useState(0);
  const [totalOrdenes, setTotalOrdenes] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("porcentaje");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filtroCumplimiento, setFiltroCumplimiento] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = dateRange?.to?.toISOString() || new Date().toISOString();
        
        // No incluimos el límite para obtener todas las órdenes
        const response = await fetch(
          `/api/analytics/real-vs-planned-time?from=${from}&to=${to}&includeIncomplete=${!filtroCumplimiento}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: RealVsPlannedTimeResponse = await response.json();
        
        if (result.data.length === 0) {
          setError("No se encontraron datos para el período seleccionado");
        } else {
          // Convertir fechaProduccion a Date para cada orden
          const dataWithDates = result.data.map(orden => ({
            ...orden,
            fechaProduccion: new Date(orden.fechaProduccion)
          }));
          
          setData(dataWithDates);
          setFilteredData(dataWithDates);
          setPromedioDesviacionPositiva(result.promedioDesviacionPositiva);
          setPromedioDesviacionNegativa(result.promedioDesviacionNegativa);
          setTotalOrdenes(result.totalOrdenes);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error al cargar los datos. Por favor intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, filtroCumplimiento]);

  // Filtrar datos cuando cambia el término de búsqueda o la ordenación
  useEffect(() => {
    if (data.length === 0) return;
    
    let filtered = [...data];
    
    // Aplicar filtro de búsqueda
    if (searchTerm.trim() !== "") {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        orden => 
          orden.numeroOrden.toString().includes(lowercaseSearch) ||
          orden.producto.toLowerCase().includes(lowercaseSearch) ||
          orden.lineaProduccion.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "orden":
          comparison = a.numeroOrden - b.numeroOrden;
          break;
        case "producto":
          comparison = a.producto.localeCompare(b.producto);
          break;
        case "linea":
          comparison = a.lineaProduccion.localeCompare(b.lineaProduccion);
          break;
        case "fecha":
          comparison = a.fechaProduccion.getTime() - b.fechaProduccion.getTime();
          break;
        case "plan":
          comparison = a.tiempoPlan - b.tiempoPlan;
          break;
        case "real":
          comparison = a.tiempoReal - b.tiempoReal;
          break;
        case "diferencia":
          comparison = a.diferencia - b.diferencia;
          break;
        case "porcentaje":
          comparison = Math.abs(a.diferenciaPorcentaje) - Math.abs(b.diferenciaPorcentaje);
          break;
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });
    
    setFilteredData(filtered);
  }, [data, searchTerm, sortField, sortDirection]);

  function getEfficiencyColorClass(value: number): string {
    if (value <= -10) return "text-green-500 font-semibold";
    if (value >= 10) return "text-red-500 font-semibold";
    return "text-amber-500 font-semibold";
  }

  const handleBackClick = () => {
    router.back();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSortField("porcentaje");
    setSortDirection("desc");
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;

    // Crear el contenido CSV
    const headers = ["Número de Orden", "Producto", "Línea de Producción", "Fecha de Producción", 
                     "Tiempo Plan (hrs)", "Tiempo Real (hrs)", "Diferencia (hrs)", "Diferencia (%)"];
    
    const csvContent = [
      headers.join(","),
      ...filteredData.map(orden => [
        orden.numeroOrden,
        `"${orden.producto}"`, // Comillas para evitar problemas con comas
        `"${orden.lineaProduccion}"`,
        format(new Date(orden.fechaProduccion), "dd/MM/yyyy"),
        orden.tiempoPlan.toFixed(2),
        orden.tiempoReal.toFixed(2),
        orden.diferencia.toFixed(2),
        orden.diferenciaPorcentaje.toFixed(2)
      ].join(","))
    ].join("\n");

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tiempo-real-vs-plan_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFiltroCumplimientoChange = () => {
    setFiltroCumplimiento(!filtroCumplimiento);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              disabled
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">Tiempo Real vs Planificado de Producción</h1>
          </div>
          <Skeleton className="h-10 w-[300px]" />
        </div>

        <div className="space-y-6 mt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Tiempo Real vs Planificado de Producción</h1>
        </div>
        <DateRangeFilter
          date={dateRange}
          selectedPeriod={dateRange ? "custom" : "30d"}
          onPeriodChange={() => {}}
          onDateChange={(newDate) => {}}
        />
      </div>

      <div className="space-y-6 mt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : filteredData.length === 0 ? (
          <Alert>
            <AlertDescription>
              No hay datos disponibles para el período seleccionado
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Cards de métricas e indicadores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <p className="text-sm text-muted-foreground">Órdenes Analizadas</p>
                  </div>
                  <p className="text-xl font-semibold text-center">
                    {totalOrdenes}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <p className="text-sm text-muted-foreground">Eficiencia Promedio</p>
                  </div>
                  <p className={`text-xl font-semibold text-center ${getEfficiencyColorClass(promedioDesviacionNegativa)}`}>
                    {promedioDesviacionNegativa < 0 ? (promedioDesviacionNegativa * -1).toFixed(1) : promedioDesviacionNegativa.toFixed(1)}%
                    {promedioDesviacionNegativa < 0 && (
                      <span className="ml-2 inline-flex">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-muted-foreground">Ineficiencia Promedio</p>
                  </div>
                  <p className={`text-xl font-semibold text-center ${getEfficiencyColorClass(promedioDesviacionPositiva)}`}>
                    {promedioDesviacionPositiva.toFixed(1)}%
                    {promedioDesviacionPositiva > 0 && (
                      <span className="ml-2 inline-flex">
                        <XCircle className="h-4 w-4 text-red-500" />
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filtros y botones */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                <Input
                  placeholder="Buscar por orden, producto o línea..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-[450px]"
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    id="filtro-cumplimiento"
                    checked={filtroCumplimiento}
                    onCheckedChange={handleFiltroCumplimientoChange}
                  />
                  <Label htmlFor="filtro-cumplimiento" className="text-sm">
                    Solo órdenes con ≥95% completadas
                  </Label>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="destructive" onClick={resetFilters} className="w-full md:w-auto">
                  Limpiar filtros
                </Button>
                <Button
                  variant="default"
                  onClick={handleExportCSV}
                  className="gap-2 w-full md:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </div>
            </div>

            {/* Tabla con todas las órdenes */}
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("orden")}
                        className="h-8 px-2 hover:bg-transparent"
                      >
                        Orden #
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("producto")}
                        className="h-8 px-2 hover:bg-transparent"
                      >
                        Producto
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("linea")}
                        className="h-8 px-2 hover:bg-transparent"
                      >
                        Línea
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("fecha")}
                        className="h-8 px-2 hover:bg-transparent"
                      >
                        Fecha
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("plan")}
                        className="h-8 px-2 hover:bg-transparent"
                      >
                        Tiempo Plan
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("real")}
                        className="h-8 px-2 hover:bg-transparent"
                      >
                        Tiempo Real
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("diferencia")}
                        className="h-8 px-2 hover:bg-transparent"
                      >
                        Diferencia
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("porcentaje")}
                        className="h-8 px-2 hover:bg-transparent"
                      >
                        %
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((orden) => (
                    <TableRow key={orden.id} className="hover:bg-slate-50 border-b border-slate-100">
                      <TableCell className="font-medium">{orden.numeroOrden}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={orden.producto}>{orden.producto}</TableCell>
                      <TableCell>{orden.lineaProduccion}</TableCell>
                      <TableCell>{format(new Date(orden.fechaProduccion), "dd/MM/yyyy", { locale: es })}</TableCell>
                      <TableCell className="text-right font-medium">{orden.tiempoPlan.toFixed(1)} hrs</TableCell>
                      <TableCell className="text-right font-medium">{orden.tiempoReal.toFixed(1)} hrs</TableCell>
                      <TableCell className="text-right font-medium">{orden.diferencia.toFixed(1)} hrs</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <span className={getEfficiencyColorClass(orden.diferenciaPorcentaje)}>
                          {orden.diferenciaPorcentaje.toFixed(1)}%
                          {orden.diferenciaPorcentaje < 0 ? (
                            <CheckCircle className="inline-block ml-1 w-3 h-3" />
                          ) : (
                            <XCircle className="inline-block ml-1 w-3 h-3" />
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Wrapper component that provides DateRangeProvider context
export default function RealVsPlannedTimeDetailPage() {
  return (
    <DateRangeProvider>
      <RealVsPlannedTimeDetail />
    </DateRangeProvider>
  );
} 