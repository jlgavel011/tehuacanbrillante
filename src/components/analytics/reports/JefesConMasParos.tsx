"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/dashboard/report-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDateRange } from "@/context/DateRangeContext";
import { BarChart } from "../charts/BarChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface JefeParosData {
  id: string;
  nombre: string;
  cantidadParos: number;
  tiempoParos: number; // En minutos
  porcentajeCantidad: number;
  porcentajeTiempo: number;
}

interface JefesConMasParosResponse {
  data: JefeParosData[];
  totalJefes: number;
  totalParos: number;
  totalTiempoParos: number;
}

export function JefesConMasParos() {
  const router = useRouter();
  const { date: dateRange } = useDateRange();
  const [data, setData] = useState<JefeParosData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJefes, setTotalJefes] = useState(0);
  const [totalParos, setTotalParos] = useState(0);
  const [totalTiempoParos, setTotalTiempoParos] = useState(0);
  const [metrica, setMetrica] = useState<"cantidad" | "tiempo">("cantidad");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = dateRange?.to?.toISOString() || new Date().toISOString();
        
        const response = await fetch(
          `/api/analytics/jefes-con-mas-paros?from=${from}&to=${to}&limit=10`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: JefesConMasParosResponse = await response.json();
        
        if (result.data.length === 0) {
          setError("No se encontraron datos para el período seleccionado");
        } else {
          setData(result.data);
          setTotalJefes(result.totalJefes);
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

  const handleViewDetails = () => {
    router.push(`/reports/jefes-con-mas-paros-detail`);
  };

  const toggleMetrica = () => {
    setMetrica(metrica === "cantidad" ? "tiempo" : "cantidad");
  };

  // Preparar datos para el gráfico de barras según la métrica seleccionada
  const chartData = data.map(item => ({
    jefe: item.nombre,
    [metrica === "cantidad" ? "Cantidad de Paros" : "Tiempo de Paros (min)"]: 
      metrica === "cantidad" ? item.cantidadParos : item.tiempoParos,
    porcentaje: metrica === "cantidad" ? item.porcentajeCantidad : item.porcentajeTiempo
  }));

  // Formatear tiempo en horas y minutos
  const formatTiempo = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
  };

  return (
    <ReportCard
      title="Jefes de Línea con Más Paros"
      subtitle="Distribución de paros por jefe de línea"
      headerExtra={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleViewDetails}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      }
      className="p-0 relative"
      headerClassName="bg-[#f9e8f7]"
    >
      <div className="border-b border-border/50" />
      <div className="flex flex-col gap-2">
        <div className="px-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-[#fdf4ff] p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-purple-500" />
                <p className="text-sm text-muted-foreground">Jefes con Paros</p>
              </div>
              <p className="text-xl font-semibold">
                {loading ? '-' : totalJefes}
              </p>
            </div>
            
            <div className="rounded-lg bg-[#fdf4ff] p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-purple-500" />
                <p className="text-sm text-muted-foreground">Total Paros</p>
              </div>
              <p className="text-xl font-semibold">
                {loading ? '-' : totalParos.toLocaleString()}
              </p>
            </div>
            
            <div className="rounded-lg bg-[#fdf4ff] p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-purple-500" />
                <p className="text-sm text-muted-foreground">Tiempo Total</p>
              </div>
              <p className="text-xl font-semibold">
                {loading ? '-' : formatTiempo(totalTiempoParos)}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="p-6">
            <div className="px-6 pt-0 pb-4">
              <Tabs value={metrica} onValueChange={(value) => setMetrica(value as "cantidad" | "tiempo")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cantidad">Por Cantidad</TabsTrigger>
                  <TabsTrigger value="tiempo">Por Tiempo</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="h-[350px]">
              <BarChart
                data={chartData}
                index="jefe"
                categories={[metrica === "cantidad" ? "Cantidad de Paros" : "Tiempo de Paros (min)"]}
                colors={["#c084fc"]}
                valueFormatter={(value) => 
                  metrica === "tiempo" 
                    ? formatTiempo(value) 
                    : value.toLocaleString("es-MX")
                }
                layout="vertical"
                className="h-full"
              />
            </div>
          </div>
        )}
      </div>
    </ReportCard>
  );
} 