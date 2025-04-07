"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Card } from "@tremor/react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/dashboard/report-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDateRange } from "@/context/DateRangeContext";
import { BarChart } from "../charts/BarChart";
import { CHART_PRESETS, getChartColors } from "@/config/chart-colors";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductData {
  nombre: string;
  cantidad: number;
  porcentaje: number;
  modelo?: string;
  sabor?: string;
  tamaño?: string;
}

interface ProductLitersData {
  id: string;
  nombre: string;
  modelo: string;
  sabor: string;
  tamaño: string;
  litros: number;
  porcentaje: number;
}

export function MostProducedProducts() {
  const router = useRouter();
  const { date } = useDateRange();
  const [data, setData] = useState<ProductData[]>([]);
  const [litersData, setLitersData] = useState<ProductLitersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLiters, setLoadingLiters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorLiters, setErrorLiters] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("boxes");

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

        const response = await fetch(`/api/analytics/most-produced-products?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos");
        const result = await response.json();
        console.log("Datos de cajas recibidos de la API:", result);
        setData(result.slice(0, 10)); // Mostrar top 10
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    const fetchLitersData = async () => {
      if (!date?.from || !date?.to) return;

      setLoadingLiters(true);
      setErrorLiters(null);
      try {
        const params = new URLSearchParams({
          from: date.from.toISOString(),
          to: date.to.toISOString(),
        });

        const response = await fetch(`/api/analytics/most-produced-products-liters?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos de litros");
        const result = await response.json();
        console.log("Datos de litros recibidos de la API:", result);
        setLitersData(result); // Ya viene limitado a top 10 desde el backend
      } catch (err) {
        console.error("Error fetching liters data:", err);
        setErrorLiters(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoadingLiters(false);
      }
    };

    fetchData();
    fetchLitersData();
  }, [date]);

  const handleViewDetails = () => {
    router.push("/reports/products");
  };

  const renderBoxesContent = () => {
    if (loading) {
      return (
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!data || data.length === 0) {
      return (
        <Alert>
          <AlertDescription>No hay datos disponibles para el período seleccionado</AlertDescription>
        </Alert>
      );
    }

    const chartData = data.map((item) => ({
      name: item.nombre,
      Cantidad: item.cantidad,
    }));

    return (
      <div className="flex items-center justify-center py-6 px-6 min-h-[400px]">
        <div className="h-[350px] w-full -ml-2">
          <BarChart
            data={chartData}
            index="name"
            categories={["Cantidad"]}
            colors={["#0284C7"]}
            valueFormatter={(value) =>
              value.toLocaleString("es-MX", {
                maximumFractionDigits: 0,
              })
            }
            showLegend={false}
            yAxisWidth={65}
            className="h-full"
            layout="vertical"
          />
        </div>
      </div>
    );
  };

  const renderLitersContent = () => {
    if (loadingLiters) {
      return (
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      );
    }

    if (errorLiters) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorLiters}</AlertDescription>
        </Alert>
      );
    }

    if (!litersData || litersData.length === 0) {
      return (
        <Alert>
          <AlertDescription>No hay datos disponibles para el período seleccionado</AlertDescription>
        </Alert>
      );
    }

    const chartData = litersData.map((item) => ({
      name: item.nombre,
      Litros: item.litros,
    }));

    return (
      <div className="flex items-center justify-center py-6 px-6 min-h-[400px]">
        <div className="h-[350px] w-full -ml-2">
          <BarChart
            data={chartData}
            index="name"
            categories={["Litros"]}
            colors={["#7C3AED"]}
            valueFormatter={(value) =>
              value.toLocaleString("es-MX", {
                maximumFractionDigits: 2,
              }) + " L"
            }
            showLegend={false}
            yAxisWidth={80}
            className="h-full"
            layout="vertical"
          />
        </div>
      </div>
    );
  };

  return (
    <ReportCard
      title="Productos Más Producidos"
      subtitle={activeTab === "boxes" 
        ? "Top 10 productos por cajas producidas"
        : "Top 10 productos por litros producidos"}
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
      <Tabs defaultValue="boxes" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border/50 px-6 pt-2">
          <TabsList className="mb-0">
            <TabsTrigger value="boxes">Cajas</TabsTrigger>
            <TabsTrigger value="liters">Litros</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="boxes" className="m-0">
          {renderBoxesContent()}
        </TabsContent>
        <TabsContent value="liters" className="m-0">
          {renderLitersContent()}
        </TabsContent>
      </Tabs>
    </ReportCard>
  );
} 