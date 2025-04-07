"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Calendar, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/date-range-picker";
import { useDateRange } from "@/context/DateRangeContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCSV } from "@/lib/utils/csv";

interface HourProductionData {
  hour: string;
  hourIndex: number;
  cajasProducidas: number;
  litrosProducidos: number;
  totalRegistros: number;
}

interface HeatmapResponse {
  data: HourProductionData[];
  totalCajas: number;
  totalLitros: number;
  maxCajasHora: number;
  maxLitrosHora: number;
}

// Función para generar clases de color basadas en el valor relativo
function getHeatmapColor(value: number, max: number, metric: "cajas" | "litros") {
  if (max === 0) return "bg-blue-50";
  
  const intensity = Math.min(Math.round((value / max) * 100), 100);
  
  // Para cajas: escala de azules
  if (metric === "cajas") {
    if (intensity <= 20) return "bg-blue-50";
    if (intensity <= 40) return "bg-blue-100";
    if (intensity <= 60) return "bg-blue-200";
    if (intensity <= 80) return "bg-blue-300";
    return "bg-blue-400";
  }
  
  // Para litros: escala de verdes
  if (intensity <= 20) return "bg-green-50";
  if (intensity <= 40) return "bg-green-100";
  if (intensity <= 60) return "bg-green-200";
  if (intensity <= 80) return "bg-green-300";
  return "bg-green-400";
}

export default function ProductionHeatmapByHourDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { date, setDate } = useDateRange();
  
  const [data, setData] = useState<HourProductionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<"cajas" | "litros">("cajas");
  const [maxCajas, setMaxCajas] = useState(0);
  const [maxLitros, setMaxLitros] = useState(0);
  const [totalCajas, setTotalCajas] = useState(0);
  const [totalLitros, setTotalLitros] = useState(0);

  useEffect(() => {
    // Inicializar fecha de los parámetros de URL
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    if (fromParam && toParam) {
      setDate({
        from: parseISO(fromParam),
        to: parseISO(toParam),
      });
    }
  }, [searchParams, setDate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = date?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = date?.to?.toISOString() || new Date().toISOString();

        const response = await fetch(
          `/api/analytics/production-heatmap-by-hour?from=${from}&to=${to}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: HeatmapResponse = await response.json();

        if (result.data.length === 0) {
          setError("No se encontraron datos para el período seleccionado");
        } else {
          setData(result.data);
          setMaxCajas(result.maxCajasHora);
          setMaxLitros(result.maxLitrosHora);
          setTotalCajas(result.totalCajas);
          setTotalLitros(result.totalLitros);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error al cargar los datos. Por favor intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

  const goBack = () => {
    router.back();
  };

  const formatHour = (hour: string) => {
    const [h] = hour.split(':');
    const hourNum = parseInt(h, 10);
    if (hourNum === 0) return '12 AM';
    if (hourNum === 12) return '12 PM';
    return hourNum < 12 ? `${hourNum} AM` : `${hourNum - 12} PM`;
  };

  const getTopHours = () => {
    if (!data || data.length === 0) return [];
    
    return [...data]
      .sort((a, b) => 
        metric === "cajas" 
          ? b.cajasProducidas - a.cajasProducidas 
          : b.litrosProducidos - a.litrosProducidos
      )
      .slice(0, 3);
  };

  const handleDownloadCSV = () => {
    if (data.length === 0) return;

    const sortedData = [...data].sort((a, b) => a.hourIndex - b.hourIndex);
    const csvData = sortedData.map(hour => ({
      "Hora": formatHour(hour.hour),
      "Cajas Producidas": hour.cajasProducidas,
      "Litros Producidos": hour.litrosProducidos,
      "Registros": hour.totalRegistros,
      "% del Total (Cajas)": totalCajas > 0 ? ((hour.cajasProducidas / totalCajas) * 100).toFixed(2) + '%' : '0%',
      "% del Total (Litros)": totalLitros > 0 ? ((hour.litrosProducidos / totalLitros) * 100).toFixed(2) + '%' : '0%'
    }));
    
    downloadCSV(csvData, "produccion_por_hora");
  };

  const topHours = getTopHours();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Horas con Mayor Producción</h1>
        </div>
        <DateRangePicker />
      </div>

      <div className="space-y-6 mt-6">
        {loading ? (
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
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <CardTitle>Resumen de Producción por Hora</CardTitle>
                  <Tabs value={metric} onValueChange={(v) => setMetric(v as "cajas" | "litros")} className="w-full md:w-auto mt-2 md:mt-0">
                    <TabsList className="grid w-full md:w-auto grid-cols-2">
                      <TabsTrigger value="cajas">Cajas Producidas</TabsTrigger>
                      <TabsTrigger value="litros">Litros Producidos</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <Calendar className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="text-xl font-semibold">
                      {metric === "cajas" 
                        ? `${totalCajas.toLocaleString()} cajas` 
                        : `${totalLitros.toLocaleString()} litros`}
                    </div>
                  </div>
                  
                  {topHours.map((hour, index) => (
                    <div key={hour.hourIndex} className={`rounded-lg ${index === 0 ? "bg-blue-50" : "bg-slate-50"} p-4`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-muted-foreground">
                          {index === 0 ? "Mejor Hora" : `Top ${index + 1}`}
                        </div>
                        <span className="text-sm font-medium">{formatHour(hour.hour)}</span>
                      </div>
                      <div className="text-xl font-semibold">
                        {metric === "cajas" 
                          ? `${hour.cajasProducidas.toLocaleString()} cajas` 
                          : `${hour.litrosProducidos.toLocaleString()} litros`}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end mb-4">
              <Button onClick={handleDownloadCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Descargar
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detalle por Hora</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead className="text-right">Cajas</TableHead>
                      <TableHead className="text-right">Litros</TableHead>
                      <TableHead className="text-right">Registros</TableHead>
                      <TableHead className="text-right">% del Total (Cajas)</TableHead>
                      <TableHead className="text-right">% del Total (Litros)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data
                      .sort((a, b) => a.hourIndex - b.hourIndex)
                      .map((hour) => (
                        <TableRow key={hour.hourIndex}>
                          <TableCell className="font-medium">{formatHour(hour.hour)}</TableCell>
                          <TableCell className="text-right">{hour.cajasProducidas.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{hour.litrosProducidos.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{hour.totalRegistros.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {totalCajas > 0 
                              ? ((hour.cajasProducidas / totalCajas) * 100).toFixed(2) + '%' 
                              : '0%'}
                          </TableCell>
                          <TableCell className="text-right">
                            {totalLitros > 0
                              ? ((hour.litrosProducidos / totalLitros) * 100).toFixed(2) + '%'
                              : '0%'}
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