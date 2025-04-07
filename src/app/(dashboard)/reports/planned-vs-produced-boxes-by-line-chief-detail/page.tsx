"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpDown, CheckCircle, Search, XCircle, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { DateRangeProvider, useDateRange } from "@/context/DateRangeContext";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadCSV } from "@/lib/utils/csv";

interface LineChiefWithBoxesData {
  id: string;
  nombre: string;
  cajasPlanificadas: number;
  cajasProducidas: number;
  diferencia: number;
  diferenciaPorcentaje: number;
  totalOrdenes: number;
}

interface PlannedVsProducedBoxesByLineChiefResponse {
  data: LineChiefWithBoxesData[];
  totalJefes: number;
  promedioDesviacionPositiva: number;
  promedioDesviacionNegativa: number;
}

type SortField = "nombre" | "cajasPlanificadas" | "cajasProducidas" | "diferencia" | "diferenciaPorcentaje" | "totalOrdenes";

function PlannedVsProducedBoxesByLineChiefDetail() {
  const router = useRouter();
  const { date: dateRange } = useDateRange();
  const [data, setData] = useState<LineChiefWithBoxesData[]>([]);
  const [filteredData, setFilteredData] = useState<LineChiefWithBoxesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("totalOrdenes");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = dateRange?.to?.toISOString() || new Date().toISOString();
        
        const response = await fetch(
          `/api/analytics/planned-vs-produced-boxes-by-line-chief?from=${from}&to=${to}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: PlannedVsProducedBoxesByLineChiefResponse = await response.json();
        
        if (result.data.length === 0) {
          setError("No se encontraron datos para el período seleccionado");
        } else {
          setData(result.data);
          setFilteredData(result.data);
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

  useEffect(() => {
    // Filter data based on search term
    if (searchTerm.trim() === "") {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item => 
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, data]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection("desc");
    }

    // Sort the data
    const sorted = [...filteredData].sort((a, b) => {
      let comparison = 0;
      
      if (field === "nombre") {
        comparison = a.nombre.localeCompare(b.nombre);
      } else {
        comparison = (a[field] as number) - (b[field] as number);
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    setFilteredData(sorted);
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleDownloadCSV = () => {
    const csvData = filteredData.map(item => ({
      "Jefe de Línea": item.nombre,
      "Órdenes": item.totalOrdenes,
      "Cajas Planificadas": item.cajasPlanificadas,
      "Cajas Producidas": item.cajasProducidas,
      "Diferencia": item.diferencia,
      "Diferencia (%)": `${item.diferenciaPorcentaje.toFixed(1)}%`
    }));
    
    downloadCSV(csvData, "cajas_plan_vs_producidas_por_jefe");
  };

  // Calcular totales para las tarjetas de resumen
  const totalCajasPlanificadas = data.reduce((sum, item) => sum + item.cajasPlanificadas, 0);
  const totalCajasProducidas = data.reduce((sum, item) => sum + item.cajasProducidas, 0);
  const totalPromedio = totalCajasPlanificadas > 0 
    ? ((totalCajasProducidas - totalCajasPlanificadas) / totalCajasPlanificadas) * 100 
    : 0;

  function getEfficiencyColorClass(value: number): string {
    if (value >= 10) return "text-green-600"; // Sobrecumplimiento
    if (value <= -10) return "text-red-600"; // Incumplimiento
    return "text-amber-500"; // Cerca del objetivo
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
          <h1 className="text-2xl font-semibold">Cajas Planificadas vs Producidas por Jefe de Línea</h1>
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
        ) : loading ? (
          <>
            <Card className="p-4">
              <Skeleton className="h-[120px] w-full" />
            </Card>
            <div className="h-10 w-full flex items-center justify-between gap-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-20" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Resumen General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Cajas Planificadas</div>
                    <div className="text-2xl font-bold">{totalCajasPlanificadas.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Cajas Producidas</div>
                    <div className="text-2xl font-bold">{totalCajasProducidas.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Cumplimiento General</div>
                    <div className={`text-2xl font-bold ${getEfficiencyColorClass(totalPromedio)}`}>
                      {totalPromedio.toFixed(1)}%
                      {totalPromedio >= 0 ? (
                        <CheckCircle className="inline-block ml-2 w-5 h-5" />
                      ) : (
                        <XCircle className="inline-block ml-2 w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between mb-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <div className="text-sm text-muted-foreground self-center">
                  {filteredData.length} {filteredData.length === 1 ? "jefe" : "jefes"} encontrados
                </div>
                <Button onClick={handleDownloadCSV} className="ml-2 gap-1">
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("nombre")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Jefe de Línea
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("totalOrdenes")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Órdenes
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("cajasPlanificadas")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Cajas Plan
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("cajasProducidas")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Cajas Reales
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
                          onClick={() => handleSort("diferenciaPorcentaje")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          % Diferencia
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((chief) => (
                      <TableRow key={chief.id} className="hover:bg-slate-50 border-b border-slate-100">
                        <TableCell className="font-medium">{chief.nombre}</TableCell>
                        <TableCell className="text-right">{chief.totalOrdenes}</TableCell>
                        <TableCell className="text-right font-medium">{chief.cajasPlanificadas.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">{chief.cajasProducidas.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">{chief.diferencia.toLocaleString()}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <span className={getEfficiencyColorClass(chief.diferenciaPorcentaje)}>
                            {chief.diferenciaPorcentaje.toFixed(1)}%
                            {chief.diferenciaPorcentaje >= 0 ? (
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
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// Wrapper component that provides DateRangeProvider context
export default function PlannedVsProducedBoxesByLineChiefDetailPage() {
  return (
    <DateRangeProvider>
      <PlannedVsProducedBoxesByLineChiefDetail />
    </DateRangeProvider>
  );
} 