"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpDown, Search, Download } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface JefeParosData {
  id: string;
  nombre: string;
  cantidadParos: number;
  tiempoParos: number;
  porcentajeCantidad: number;
  porcentajeTiempo: number;
}

interface JefesConMasParosResponse {
  data: JefeParosData[];
  totalJefes: number;
  totalParos: number;
  totalTiempoParos: number;
}

type SortField = "nombre" | "cantidadParos" | "tiempoParos" | "porcentajeCantidad" | "porcentajeTiempo";

function JefesConMasParosDetail() {
  const router = useRouter();
  const { date: dateRange } = useDateRange();
  const [data, setData] = useState<JefeParosData[]>([]);
  const [filteredData, setFilteredData] = useState<JefeParosData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("cantidadParos");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [totalParos, setTotalParos] = useState(0);
  const [totalTiempoParos, setTotalTiempoParos] = useState(0);
  const [tabView, setTabView] = useState<"cantidad" | "tiempo">("cantidad");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = dateRange?.to?.toISOString() || new Date().toISOString();
        
        const response = await fetch(
          `/api/analytics/jefes-con-mas-paros?from=${from}&to=${to}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: JefesConMasParosResponse = await response.json();
        
        if (result.data.length === 0) {
          setError("No se encontraron datos para el período seleccionado");
        } else {
          setData(result.data);
          setFilteredData(result.data);
          setTotalParos(result.totalParos);
          setTotalTiempoParos(result.totalTiempoParos);
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
      "Cantidad de Paros": item.cantidadParos,
      "% de Cantidad": `${item.porcentajeCantidad.toFixed(1)}%`,
      "Tiempo de Paros (min)": item.tiempoParos,
      "% de Tiempo": `${item.porcentajeTiempo.toFixed(1)}%`,
      "Tiempo Formateado": formatTiempo(item.tiempoParos)
    }));
    
    downloadCSV(csvData, "jefes_con_mas_paros");
  };

  // Formatear tiempo en horas y minutos
  const formatTiempo = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
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
          <h1 className="text-2xl font-semibold">Jefes de Línea con Más Paros</h1>
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
                    <div className="text-sm text-muted-foreground mb-1">Total de Jefes con Paros</div>
                    <div className="text-2xl font-bold">{filteredData.length}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total de Paros</div>
                    <div className="text-2xl font-bold">{totalParos.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Tiempo Total de Paros</div>
                    <div className="text-2xl font-bold">
                      {formatTiempo(totalTiempoParos)}
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

            <Tabs value={tabView} onValueChange={(v) => setTabView(v as "cantidad" | "tiempo")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="cantidad">Por Cantidad</TabsTrigger>
                <TabsTrigger value="tiempo">Por Tiempo</TabsTrigger>
              </TabsList>

              <TabsContent value="cantidad" className="mt-0">
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
                              onClick={() => handleSort("cantidadParos")}
                              className="h-8 px-2 hover:bg-transparent"
                            >
                              Cantidad de Paros
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button 
                              variant="ghost" 
                              onClick={() => handleSort("porcentajeCantidad")}
                              className="h-8 px-2 hover:bg-transparent"
                            >
                              % del Total
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button 
                              variant="ghost" 
                              onClick={() => handleSort("tiempoParos")}
                              className="h-8 px-2 hover:bg-transparent"
                            >
                              Tiempo Total
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData
                          .sort((a, b) => b.cantidadParos - a.cantidadParos)
                          .map((jefe) => (
                            <TableRow key={jefe.id} className="hover:bg-slate-50 border-b border-slate-100">
                              <TableCell className="font-medium">{jefe.nombre}</TableCell>
                              <TableCell className="text-right">{jefe.cantidadParos.toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                <span className="text-purple-600">
                                  {jefe.porcentajeCantidad.toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {formatTiempo(jefe.tiempoParos)}
                              </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tiempo" className="mt-0">
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
                              onClick={() => handleSort("tiempoParos")}
                              className="h-8 px-2 hover:bg-transparent"
                            >
                              Tiempo de Paros
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button 
                              variant="ghost" 
                              onClick={() => handleSort("porcentajeTiempo")}
                              className="h-8 px-2 hover:bg-transparent"
                            >
                              % del Total
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button 
                              variant="ghost" 
                              onClick={() => handleSort("cantidadParos")}
                              className="h-8 px-2 hover:bg-transparent"
                            >
                              Cantidad
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData
                          .sort((a, b) => b.tiempoParos - a.tiempoParos)
                          .map((jefe) => (
                            <TableRow key={jefe.id} className="hover:bg-slate-50 border-b border-slate-100">
                              <TableCell className="font-medium">{jefe.nombre}</TableCell>
                              <TableCell className="text-right font-medium">{formatTiempo(jefe.tiempoParos)}</TableCell>
                              <TableCell className="text-right">
                                <span className="text-purple-600">
                                  {jefe.porcentajeTiempo.toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {jefe.cantidadParos.toLocaleString()}
                              </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

// Wrapper component that provides DateRangeProvider context
export default function JefesConMasParosDetailPage() {
  return (
    <DateRangeProvider>
      <JefesConMasParosDetail />
    </DateRangeProvider>
  );
} 