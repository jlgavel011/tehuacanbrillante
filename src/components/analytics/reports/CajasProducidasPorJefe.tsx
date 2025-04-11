"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ChevronRight, Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/dashboard/report-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDateRange } from "@/context/DateRangeContext";
import { BarChart } from "../charts/BarChart";
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

export function CajasProducidasPorJefe() {
  const router = useRouter();
  const { date: dateRange } = useDateRange();
  const [data, setData] = useState<JefeLineaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJefes, setTotalJefes] = useState(0);
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
          `/api/analytics/cajas-producidas-por-jefe?from=${from}&to=${to}&limit=10`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: CajasProducidasPorJefeResponse = await response.json();
        
        if (result.data.length === 0) {
          setError("No se encontraron datos para el período seleccionado");
        } else {
          setData(result.data);
          setTotalJefes(result.totalJefes);
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

  const handleViewDetails = () => {
    router.push(`/reports/cajas-producidas-por-jefe-detail`);
  };

  // Preparar datos para el gráfico de barras
  const chartData = data.map(item => ({
    lineChief: item.nombre,
    [metrica === "cajas" ? "Cajas Producidas" : "Litros Producidos"]: 
      metrica === "cajas" ? item.cajasProducidas : item.litrosProducidos,
    porcentaje: metrica === "cajas" ? item.porcentajeCajas : item.porcentajeLitros
  }));

  const formatValue = (value: number): string => {
    return value.toLocaleString("es-MX");
  };

  return (
    <ReportCard
      title="Producción por Jefe de Línea"
      subtitle="Distribución real de producción por jefe de línea"
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
                <p className="text-sm text-muted-foreground">Jefes de Línea</p>
              </div>
              <p className="text-xl font-semibold">
                {loading ? '-' : totalJefes}
              </p>
            </div>
            
            <div className="rounded-lg bg-[#fdf4ff] p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <p className="text-sm text-muted-foreground">{metrica === "cajas" ? "Total Cajas" : "Total Litros"}</p>
              </div>
              <p className="text-xl font-semibold">
                {loading ? '-' : metrica === "cajas" 
                  ? formatValue(totalCajasProducidas)
                  : formatValue(totalLitrosProducidos) + " L"}
                {!loading && (
                  <span className="ml-2 inline-flex">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </span>
                )}
              </p>
            </div>
            
            <div className="rounded-lg bg-[#fdf4ff] p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <p className="text-sm text-muted-foreground">Promedio por Jefe</p>
              </div>
              <p className="text-xl font-semibold">
                {loading ? '-' : totalJefes > 0 
                  ? (metrica === "cajas" 
                    ? formatValue(Math.round(totalCajasProducidas / totalJefes))
                    : formatValue(Math.round(totalLitrosProducidos / totalJefes)) + " L")
                  : '0'}
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
              <Tabs value={metrica} onValueChange={(value) => setMetrica(value as "cajas" | "litros")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cajas">Cajas Producidas</TabsTrigger>
                  <TabsTrigger value="litros">Litros Producidos</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="h-[350px]">
              <BarChart
                data={chartData}
                index="lineChief"
                categories={[metrica === "cajas" ? "Cajas Producidas" : "Litros Producidos"]}
                colors={["#c084fc"]}
                valueFormatter={(value) => 
                  metrica === "cajas" 
                    ? formatValue(value)
                    : `${formatValue(value)} L`
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