"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDateRange, DateRangeProvider } from "@/context/DateRangeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  CheckCircle,
  XCircle,
  Download,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { downloadCSV } from "@/lib/utils/csv";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Interfaces para los datos
interface LineaConTiempoReal {
  id: string;
  nombre: string;
  tiempoPlan: number;
  tiempoReal: number;
  diferencia: number;
  diferenciaPorcentaje: number;
  totalOrdenes: number;
  porcentajePromedioCumplimiento?: number;
}

interface RealVsPlannedTimeByLineResponse {
  data: LineaConTiempoReal[];
  totalLineas: number;
  promedioDesviacionPositiva: number;
  promedioDesviacionNegativa: number;
  filtroCompletadas?: boolean;
}

type SortField = "linea" | "plan" | "real" | "diferencia" | "porcentaje" | "ordenes";
type SortDirection = "asc" | "desc";

function RealVsPlannedTimeByLineDetail() {
  const router = useRouter();
  const { date: dateRange } = useDateRange();
  const [data, setData] = useState<LineaConTiempoReal[]>([]);
  const [filteredData, setFilteredData] = useState<LineaConTiempoReal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("porcentaje");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [promedioDesviacionPositiva, setPromedioDesviacionPositiva] = useState(0);
  const [promedioDesviacionNegativa, setPromedioDesviacionNegativa] = useState(0);
  const [filtroCumplimiento, setFiltroCumplimiento] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = dateRange?.to?.toISOString() || new Date().toISOString();
        
        const response = await fetch(
          `/api/analytics/real-vs-planned-time-by-line?from=${from}&to=${to}&includeIncomplete=${!filtroCumplimiento}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: RealVsPlannedTimeByLineResponse = await response.json();
        
        if (result.data.length === 0) {
          setError("No se encontraron datos para el período seleccionado");
        } else {
          setData(result.data);
          setFilteredData(result.data);
          setPromedioDesviacionPositiva(result.promedioDesviacionPositiva);
          setPromedioDesviacionNegativa(result.promedioDesviacionNegativa);
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
        linea => linea.nombre.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "linea":
          comparison = a.nombre.localeCompare(b.nombre);
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
        case "ordenes":
          comparison = a.totalOrdenes - b.totalOrdenes;
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDownloadCSV = () => {
    const csvData = filteredData.map(item => ({
      "Línea de Producción": item.nombre,
      "Tiempo Planificado (hrs)": item.tiempoPlan.toFixed(1),
      "Tiempo Real (hrs)": item.tiempoReal.toFixed(1),
      "Diferencia (hrs)": item.diferencia.toFixed(1),
      "Diferencia (%)": `${item.diferenciaPorcentaje.toFixed(1)}%`,
      "Órdenes Completadas": item.totalOrdenes
    }));
    
    downloadCSV(csvData, "tiempo_real_vs_plan_por_linea");
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
            <h1 className="text-2xl font-semibold">Tiempo Real vs Planificado por Línea</h1>
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
          <h1 className="text-2xl font-semibold">Tiempo Real vs Planificado por Línea</h1>
        </div>
        <DateRangeFilter
          date={dateRange}
          selectedPeriod={dateRange ? "custom" : "30d"}
          onPeriodChange={() => {}}
          onDateChange={() => {}}
        />
      </div>

      <div className="space-y-6 mt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Líneas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{data.length}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Eficiencia Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${getEfficiencyColorClass(promedioDesviacionNegativa)}`}>
                    {promedioDesviacionNegativa < 0 ? (promedioDesviacionNegativa * -1).toFixed(1) : promedioDesviacionNegativa.toFixed(1)}%
                    {promedioDesviacionNegativa < 0 && (
                      <span className="ml-2 inline-flex">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Ineficiencia Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${getEfficiencyColorClass(promedioDesviacionPositiva)}`}>
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

            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar línea..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="pl-8"
                    />
                  </div>
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
                <Button
                  variant="default"
                  onClick={handleDownloadCSV}
                  className="gap-2 w-full md:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Descargar CSV
                </Button>
              </div>

              <div className="rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("linea")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Línea de Producción
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("ordenes")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Órdenes
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
                    {filteredData.map((linea) => (
                      <TableRow key={linea.id} className="hover:bg-slate-50 border-b border-slate-100">
                        <TableCell className="font-medium">{linea.nombre}</TableCell>
                        <TableCell className="text-right">{linea.totalOrdenes}</TableCell>
                        <TableCell className="text-right font-medium">{linea.tiempoPlan.toFixed(1)} hrs</TableCell>
                        <TableCell className="text-right font-medium">{linea.tiempoReal.toFixed(1)} hrs</TableCell>
                        <TableCell className="text-right font-medium">{linea.diferencia.toFixed(1)} hrs</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <span className={getEfficiencyColorClass(linea.diferenciaPorcentaje)}>
                            {linea.diferenciaPorcentaje.toFixed(1)}%
                            {linea.diferenciaPorcentaje < 0 ? (
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Wrapper component that provides DateRangeProvider context
export default function RealVsPlannedTimeByLineDetailPage() {
  return (
    <DateRangeProvider>
      <RealVsPlannedTimeByLineDetail />
    </DateRangeProvider>
  );
} 