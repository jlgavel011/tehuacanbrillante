"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/dashboard/report-card";
import { useDateRange } from "@/context/DateRangeContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PieChart } from "../charts/PieChart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/utils/formatters";

interface ModelBoxesData {
  id?: string;
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

interface ModelLitersData {
  id?: string;
  nombre: string;
  litros: number;
  porcentaje: number;
}

export function MostProducedModels() {
  const router = useRouter();
  const { date } = useDateRange();
  const [boxesData, setBoxesData] = useState<ModelBoxesData[]>([]);
  const [litersData, setLitersData] = useState<ModelLitersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"boxes" | "liters">("boxes");

  useEffect(() => {
    const fetchData = async () => {
      if (!date?.from || !date?.to) return;

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          from: date.from.toISOString(),
          to: date.to.toISOString(),
        });

        // Fetch boxes data
        const boxesResponse = await fetch(`/api/analytics/most-produced-models?${params}`);
        if (!boxesResponse.ok) throw new Error("Error al cargar los datos de cajas");
        const boxesResult = await boxesResponse.json();
        setBoxesData(boxesResult);

        // Fetch liters data
        const litersResponse = await fetch(`/api/analytics/most-produced-models-liters?${params}`);
        if (!litersResponse.ok) throw new Error("Error al cargar los datos de litros");
        const litersResult = await litersResponse.json();
        setLitersData(litersResult);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date]);

  // Si no hay datos para la métrica seleccionada pero sí para la otra, cambiar la métrica seleccionada
  useEffect(() => {
    if (selectedMetric === "boxes" && (!boxesData || boxesData.length === 0) && litersData.length > 0) {
      setSelectedMetric("liters");
    } else if (selectedMetric === "liters" && (!litersData || litersData.length === 0) && boxesData.length > 0) {
      setSelectedMetric("boxes");
    }
  }, [boxesData, litersData, selectedMetric]);

  const handleViewMore = () => {
    router.push("/reports/models");
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload) return null;
    const data = payload[0];
    if (!data) return null;

    return (
      <div className="rounded-lg border bg-white p-2 shadow-md">
        <div className="font-medium">{data.name}</div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="text-sm text-muted-foreground">
            {selectedMetric === "boxes" ? "Cajas:" : "Litros:"}
          </span>
          <span className="text-sm font-medium">
            {selectedMetric === "boxes" 
              ? formatNumber(data.value)
              : `${formatNumber(data.value)} L`
          }
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="h-3 w-3 rounded-full opacity-0"
          />
          <span className="text-sm text-muted-foreground">
            Porcentaje:
          </span>
          <span className="text-sm font-medium">
            {data.payload.porcentaje.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  // Preparar datos para el gráfico basado en la métrica seleccionada
  const chartData = selectedMetric === "boxes" 
    ? boxesData.map(item => ({
        name: item.nombre,
        value: item.cantidad,
        porcentaje: item.porcentaje
      }))
    : litersData.map(item => ({
        name: item.nombre,
        value: item.litros,
        porcentaje: item.porcentaje
      }));

  const hasNoData = (!boxesData || boxesData.length === 0) && (!litersData || litersData.length === 0);

  return (
    <ReportCard
      title="Modelos Más Producidos"
      subtitle="Distribución de la producción por modelo"
      headerExtra={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleViewMore}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      }
      className="p-0"
      headerClassName="bg-[#e2f1f8]"
    >
      <div className="border-b border-border/50" />
      <div className="flex flex-col gap-2">
        <div className="px-6 pt-4">
          <Tabs
            defaultValue="boxes"
            value={selectedMetric}
            onValueChange={(value) => setSelectedMetric(value as "boxes" | "liters")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="boxes">Cajas Producidas</TabsTrigger>
              <TabsTrigger value="liters">Litros Producidos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center justify-center py-6 px-6">
          <div className="h-[350px] w-full">
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : hasNoData ? (
              <Alert>
                <AlertDescription>No hay datos disponibles para el período seleccionado</AlertDescription>
              </Alert>
            ) : (
              <PieChart
                data={chartData}
                customTooltip={CustomTooltip}
                className="h-full"
                valueFormatter={(value: number) => 
                  selectedMetric === "boxes"
                    ? formatNumber(value)
                    : `${formatNumber(value)} L`
                }
              />
            )}
          </div>
        </div>
        {/* Mostrar el total */}
        {!loading && !error && !hasNoData && (
          <div className="p-3 border-t border-border/50 bg-slate-50/50 text-center text-sm text-muted-foreground">
            {selectedMetric === "boxes" 
              ? `Total: ${formatNumber(boxesData.reduce((acc, item) => acc + item.cantidad, 0))} cajas` 
              : `Total: ${formatNumber(litersData.reduce((acc, item) => acc + item.litros, 0))} litros`}
          </div>
        )}
      </div>
    </ReportCard>
  );
} 