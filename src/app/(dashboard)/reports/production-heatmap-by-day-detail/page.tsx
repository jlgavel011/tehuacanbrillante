"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays, format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCSV } from "@/lib/utils/csv";

interface DayProductionData {
  day: string;
  dayIndex: number;
  cajasProducidas: number;
  litrosProducidos: number;
  totalRegistros: number;
}

interface HeatmapResponse {
  data: DayProductionData[];
  totalCajas: number;
  totalLitros: number;
  maxCajasDia: number;
  maxLitrosDia: number;
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

export default function ProductionHeatmapByDayDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<DayProductionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<"cajas" | "litros">("cajas");
  const [maxCajas, setMaxCajas] = useState(0);
  const [maxLitros, setMaxLitros] = useState(0);
  const [totalCajas, setTotalCajas] = useState(0);
  const [totalLitros, setTotalLitros] = useState(0);
  
  // Date picker state
  const [date, setDate] = useState<DateRange | undefined>({
    from: searchParams.get("from")
      ? new Date(searchParams.get("from") as string)
      : subDays(new Date(), 30),
    to: searchParams.get("to")
      ? new Date(searchParams.get("to") as string)
      : new Date(),
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = date?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = date?.to?.toISOString() || new Date().toISOString();

        const response = await fetch(
          `/api/analytics/production-heatmap-by-day?from=${from}&to=${to}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: HeatmapResponse = await response.json();

        if (result.data.length === 0) {
          setError("No se encontraron datos para el período seleccionado");
        } else {
          setData(result.data);
          setMaxCajas(result.maxCajasDia);
          setMaxLitros(result.maxLitrosDia);
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

  const handleDownloadCSV = () => {
    if (data.length === 0) return;

    const sortedData = [...data].sort((a, b) => a.dayIndex - b.dayIndex);
    const csvData = sortedData.map(day => ({
      "Día": day.day,
      "Cajas Producidas": day.cajasProducidas,
      "Litros Producidos": day.litrosProducidos,
      "Registros": day.totalRegistros,
      "% del Total (Cajas)": totalCajas > 0 ? ((day.cajasProducidas / totalCajas) * 100).toFixed(2) + '%' : '0%',
      "% del Total (Litros)": totalLitros > 0 ? ((day.litrosProducidos / totalLitros) * 100).toFixed(2) + '%' : '0%'
    }));
    
    downloadCSV(csvData, "produccion_por_dia");
  };

  // Encuentra el día con mayor producción según la métrica seleccionada
  const topProductionDay = data.length > 0 
    ? [...data].sort((a, b) => 
        metric === "cajas" 
          ? b.cajasProducidas - a.cajasProducidas 
          : b.litrosProducidos - a.litrosProducidos
      )[0].day 
    : "N/A";

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
          <h1 className="text-2xl font-semibold">Producción por Día de la Semana</h1>
        </div>
        <DatePickerWithRange date={date} onDateChange={setDate} />
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <CardTitle>Resumen de Producción</CardTitle>
                  <Tabs value={metric} onValueChange={(v) => setMetric(v as "cajas" | "litros")} className="w-[200px] mt-2 sm:mt-0">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="cajas">Cajas</TabsTrigger>
                      <TabsTrigger value="litros">Litros</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total {metric === "cajas" ? "Cajas" : "Litros"}</div>
                    <div className="text-2xl font-bold">
                      {metric === "cajas" 
                        ? totalCajas.toLocaleString() 
                        : totalLitros.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Promedio por Día</div>
                    <div className="text-2xl font-bold">
                      {metric === "cajas" 
                        ? (totalCajas / Math.max(data.length, 1)).toLocaleString(undefined, {maximumFractionDigits: 0}) 
                        : (totalLitros / Math.max(data.length, 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-muted-foreground mb-1">Día con Mayor Producción</div>
                    <div className="text-2xl font-bold">
                      {topProductionDay}
                    </div>
                  </div>
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
                <CardTitle>Detalle por Día</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Día</TableHead>
                      <TableHead className="text-right">Cajas</TableHead>
                      <TableHead className="text-right">Litros</TableHead>
                      <TableHead className="text-right">Registros</TableHead>
                      <TableHead className="text-right">% del Total (Cajas)</TableHead>
                      <TableHead className="text-right">% del Total (Litros)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data
                      .sort((a, b) => a.dayIndex - b.dayIndex)
                      .map((day) => (
                        <TableRow key={day.dayIndex}>
                          <TableCell className="font-medium">{day.day}</TableCell>
                          <TableCell className="text-right">{day.cajasProducidas.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{day.litrosProducidos.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{day.totalRegistros.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {totalCajas > 0 
                              ? ((day.cajasProducidas / totalCajas) * 100).toFixed(2) + '%' 
                              : '0%'}
                          </TableCell>
                          <TableCell className="text-right">
                            {totalLitros > 0
                              ? ((day.litrosProducidos / totalLitros) * 100).toFixed(2) + '%'
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