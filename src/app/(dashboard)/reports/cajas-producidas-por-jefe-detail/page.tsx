"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpDown, CheckCircle, Search, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { DateRangeProvider, useDateRange } from "@/context/DateRangeContext";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface JefeLineaData {
  id: string;
  nombre: string;
  cajasProducidas: number;
  litrosProducidos: number;
  totalOrdenes: number;
  porcentajeCajas: number;
  porcentajeLitros: number;
}

interface CajasProducidasPorJefeResponse {
  data: JefeLineaData[];
  totalJefes: number;
  totalCajasProducidas: number;
  totalLitrosProducidos: number;
}

type SortField = "nombre" | "cajasProducidas" | "litrosProducidos" | "totalOrdenes" | "porcentajeCajas" | "porcentajeLitros";

function CajasProducidasPorJefeDetail() {
  const router = useRouter();
  const { date: dateRange } = useDateRange();
  const [data, setData] = useState<JefeLineaData[]>([]);
  const [filteredData, setFilteredData] = useState<JefeLineaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("cajasProducidas");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCajasProducidas, setTotalCajasProducidas] = useState(0);
  const [totalLitrosProducidos, setTotalLitrosProducidos] = useState(0);
  const [metrica, setMetrica] = useState<"cajas" | "litros">("cajas");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = dateRange?.to?.toISOString() || new Date().toISOString();
        
        const response = await fetch(
          `/api/analytics/cajas-producidas-por-jefe?from=${from}&to=${to}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: CajasProducidasPorJefeResponse = await response.json();
        
        if (result.data.length === 0) {
          setError("No se encontraron datos para el período seleccionado");
        } else {
          setData(result.data);
          setFilteredData(result.data);
          setTotalCajasProducidas(result.totalCajasProducidas);
          setTotalLitrosProducidos(result.totalLitrosProducidos);
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
      "Cajas Producidas": item.cajasProducidas,
      "% de Cajas": `${item.porcentajeCajas.toFixed(1)}%`,
      "Litros Producidos": item.litrosProducidos,
      "% de Litros": `${item.porcentajeLitros.toFixed(1)}%`
    }));
    
    downloadCSV(csvData, "produccion_por_jefe");
  };

  const formatValue = (value: number): string => {
    return value.toLocaleString("es-MX");
  };

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
          <h1 className="text-2xl font-semibold">Producción por Jefe de Línea</h1>
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
                    <div className="text-sm text-muted-foreground mb-1">Total {metrica === "cajas" ? "Cajas" : "Litros"} Producidos</div>
                    <div className="text-2xl font-bold">
                      {metrica === "cajas" 
                        ? formatValue(totalCajasProducidas) 
                        : formatValue(totalLitrosProducidos) + " L"}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Jefes de Línea</div>
                    <div className="text-2xl font-bold">{filteredData.length}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Promedio por Jefe</div>
                    <div className="text-2xl font-bold">
                      {filteredData.length > 0 
                        ? (metrica === "cajas"
                            ? formatValue(Math.round(totalCajasProducidas / filteredData.length))
                            : formatValue(Math.round(totalLitrosProducidos / filteredData.length)) + " L")
                        : '0'}
                      <CheckCircle className="inline-block ml-2 w-5 h-5 text-purple-500" />
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

            <Tabs value={metrica} onValueChange={(v) => setMetrica(v as "cajas" | "litros")} className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cajas">Cajas Producidas</TabsTrigger>
                  <TabsTrigger value="litros">Litros Producidos</TabsTrigger>
                </TabsList>
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
                            onClick={() => handleSort(metrica === "cajas" ? "cajasProducidas" : "litrosProducidos")}
                            className="h-8 px-2 hover:bg-transparent"
                          >
                            {metrica === "cajas" ? "Cajas Producidas" : "Litros Producidos"}
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort(metrica === "cajas" ? "porcentajeCajas" : "porcentajeLitros")}
                            className="h-8 px-2 hover:bg-transparent"
                          >
                            % del Total
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData
                        .sort((a, b) => b[metrica === "cajas" ? "cajasProducidas" : "litrosProducidos"] - 
                                        a[metrica === "cajas" ? "cajasProducidas" : "litrosProducidos"])
                        .map((chief) => (
                          <TableRow key={chief.id} className="hover:bg-slate-50 border-b border-slate-100">
                            <TableCell className="font-medium">{chief.nombre}</TableCell>
                            <TableCell className="text-right">{chief.totalOrdenes}</TableCell>
                            <TableCell className="text-right font-medium">
                              {metrica === "cajas" 
                                ? formatValue(chief.cajasProducidas)
                                : formatValue(chief.litrosProducidos) + " L"}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <span className="text-purple-600">
                                {(metrica === "cajas" 
                                  ? chief.porcentajeCajas 
                                  : chief.porcentajeLitros).toFixed(1)}%
                                <CheckCircle className="inline-block ml-1 w-3 h-3" />
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

// Wrapper component that provides DateRangeProvider context
export default function CajasProducidasPorJefeDetailPage() {
  return (
    <DateRangeProvider>
      <CajasProducidasPorJefeDetail />
    </DateRangeProvider>
  );
} 