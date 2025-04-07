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

// Interfaces para los datos
interface OperadorConTiempoReal {
  id: string;
  nombre: string;
  tiempoPlan: number;
  tiempoReal: number;
  diferencia: number;
  diferenciaPorcentaje: number;
  totalOrdenes: number;
}

interface RealVsPlannedTimeByOperatorResponse {
  data: OperadorConTiempoReal[];
  totalOperadores: number;
  promedioDesviacionPositiva: number;
  promedioDesviacionNegativa: number;
}

type SortField = "operador" | "plan" | "real" | "diferencia" | "porcentaje" | "ordenes";
type SortDirection = "asc" | "desc";

function RealVsPlannedTimeByOperatorDetail() {
  const router = useRouter();
  const { date: dateRange } = useDateRange();
  const [data, setData] = useState<OperadorConTiempoReal[]>([]);
  const [filteredData, setFilteredData] = useState<OperadorConTiempoReal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("porcentaje");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [promedioDesviacionPositiva, setPromedioDesviacionPositiva] = useState(0);
  const [promedioDesviacionNegativa, setPromedioDesviacionNegativa] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = dateRange?.to?.toISOString() || new Date().toISOString();
        
        const response = await fetch(
          `/api/analytics/real-vs-planned-time-by-operator?from=${from}&to=${to}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: RealVsPlannedTimeByOperatorResponse = await response.json();
        
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
  }, [dateRange]);

  // Filtrar datos cuando cambia el término de búsqueda o la ordenación
  useEffect(() => {
    if (data.length === 0) return;
    
    let filtered = [...data];
    
    // Aplicar filtro de búsqueda
    if (searchTerm.trim() !== "") {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        operador => operador.nombre.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "operador":
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
      "Operador": item.nombre,
      "Tiempo Planificado (hrs)": item.tiempoPlan.toFixed(1),
      "Tiempo Real (hrs)": item.tiempoReal.toFixed(1),
      "Diferencia (hrs)": item.diferencia.toFixed(1),
      "Diferencia (%)": `${item.diferenciaPorcentaje.toFixed(1)}%`,
      "Órdenes Completadas": item.totalOrdenes
    }));
    
    downloadCSV(csvData, "tiempo_real_vs_plan_por_operador");
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
            <h1 className="text-2xl font-semibold">Tiempo Real vs Planificado por Operador</h1>
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
          <h1 className="text-2xl font-semibold">Tiempo Real vs Planificado por Operador</h1>
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
            {/* Filtros y botones */}
            <div className="flex items-center justify-between mb-6">
              <Input
                placeholder="Buscar por nombre de operador..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-[450px]"
              />
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={handleDownloadCSV}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </div>
            </div>

            {/* Tabla con todos los operadores */}
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("operador")}
                        className="h-8 px-2 hover:bg-transparent"
                      >
                        Operador
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
                  {filteredData.map((operador) => (
                    <TableRow key={operador.id} className="hover:bg-slate-50 border-b border-slate-100">
                      <TableCell className="font-medium">{operador.nombre}</TableCell>
                      <TableCell className="text-right">{operador.totalOrdenes}</TableCell>
                      <TableCell className="text-right font-medium">{operador.tiempoPlan.toFixed(1)} hrs</TableCell>
                      <TableCell className="text-right font-medium">{operador.tiempoReal.toFixed(1)} hrs</TableCell>
                      <TableCell className="text-right font-medium">{operador.diferencia.toFixed(1)} hrs</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <span className={getEfficiencyColorClass(operador.diferenciaPorcentaje)}>
                          {operador.diferenciaPorcentaje.toFixed(1)}%
                          {operador.diferenciaPorcentaje < 0 ? (
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
export default function RealVsPlannedTimeByOperatorDetailPage() {
  return (
    <DateRangeProvider>
      <RealVsPlannedTimeByOperatorDetail />
    </DateRangeProvider>
  );
} 