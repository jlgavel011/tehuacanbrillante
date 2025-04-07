"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/dashboard/report-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDateRange } from "@/context/DateRangeContext";
import { BarChart } from "../charts/BarChart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/utils/formatters";

interface FlavorData {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

interface FlavorLitersData {
  nombre: string;
  litros: number;
  porcentaje: number;
}

export function MostProducedFlavors() {
  const router = useRouter();
  const { date } = useDateRange();
  const [boxesData, setBoxesData] = useState<FlavorData[]>([]);
  const [litersData, setLitersData] = useState<FlavorLitersData[]>([]);
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

        // Fetch cajas data
        const boxesResponse = await fetch(`/api/analytics/most-produced-flavors?${params}`);
        if (!boxesResponse.ok) throw new Error("Error al cargar los datos de cajas");
        const boxesResult = await boxesResponse.json();
        setBoxesData(boxesResult.slice(0, 5)); // Top 5 por cajas

        // Fetch litros data
        const litersResponse = await fetch(`/api/analytics/most-produced-flavors-liters?${params}`);
        if (!litersResponse.ok) throw new Error("Error al cargar los datos de litros");
        const litersResult = await litersResponse.json();
        setLitersData(litersResult.slice(0, 5)); // Top 5 por litros
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date]);

  if (loading) {
    return (
      <ReportCard
        title="Sabores Más Producidos"
        subtitle="Top 5 sabores más producidos"
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      </ReportCard>
    );
  }

  if (error) {
    return (
      <ReportCard
        title="Sabores Más Producidos"
        subtitle="Top 5 sabores más producidos"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  // Check if both data sources are empty
  if ((!boxesData || boxesData.length === 0) && (!litersData || litersData.length === 0)) {
    return (
      <ReportCard
        title="Sabores Más Producidos"
        subtitle="Top 5 sabores más producidos"
      >
        <Alert>
          <AlertDescription>No hay datos disponibles para el período seleccionado</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  // Si no hay datos para la métrica seleccionada pero sí para la otra, cambiar la métrica seleccionada
  if (selectedMetric === "boxes" && (!boxesData || boxesData.length === 0) && litersData.length > 0) {
    setSelectedMetric("liters");
  } else if (selectedMetric === "liters" && (!litersData || litersData.length === 0) && boxesData.length > 0) {
    setSelectedMetric("boxes");
  }

  // Prepare chart data based on selected metric
  const chartData = selectedMetric === "boxes" 
    ? boxesData.map((item) => ({
        name: item.nombre,
        Cantidad: item.cantidad,
      }))
    : litersData.map((item) => ({
        name: item.nombre,
        Cantidad: item.litros,
      }));

  const handleViewDetails = () => {
    router.push("/reports/flavors");
  };

  // Get totals for context
  const totalBoxes = boxesData.reduce((acc, curr) => acc + curr.cantidad, 0);
  const totalLiters = litersData.reduce((acc, curr) => acc + curr.litros, 0);

  return (
    <ReportCard
      title="Sabores Más Producidos"
      subtitle="Top 5 sabores más producidos"
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
        <div className="flex items-center justify-center pt-4 px-6 pb-6 min-h-[350px]">
          <div className="h-[350px] w-full -ml-2">
            <BarChart
              data={chartData}
              index="name"
              categories={["Cantidad"]}
              colors={["#0284C7"]}
              valueFormatter={(value) =>
                selectedMetric === "boxes"
                  ? `${formatNumber(value)} cajas`
                  : `${formatNumber(value)} L`
              }
              showLegend={false}
              yAxisWidth={65}
              className="h-full"
              layout="vertical"
            />
          </div>
        </div>
        <div className="p-3 border-t border-border/50 bg-slate-50/50 text-center text-sm text-muted-foreground">
          {selectedMetric === "boxes" 
            ? `Total: ${formatNumber(totalBoxes)} cajas producidas` 
            : `Total: ${formatNumber(totalLiters)} litros producidos`}
        </div>
      </div>
    </ReportCard>
  );
} 