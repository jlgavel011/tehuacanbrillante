import { useState, useEffect } from "react";
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

interface ProductData {
  id: string;
  name: string;
  totalBoxes: number;
  totalLiters: number;
}

export function TopProductsProduction() {
  const router = useRouter();
  const { date } = useDateRange();
  const [data, setData] = useState<{
    byBoxes: ProductData[];
    byLiters: ProductData[];
  }>({ byBoxes: [], byLiters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"boxes" | "liters">("boxes");

  useEffect(() => {
    const fetchData = async () => {
      if (!date?.from || !date?.to) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/analytics/top-products-production", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: date.from.toISOString(),
            endDate: date.to.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error("Error al obtener los datos");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date?.from?.getTime(), date?.to?.getTime()]);

  if (loading) {
    return (
      <ReportCard
        title="Producción Total por Producto"
        subtitle="Top 5 productos más producidos"
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
        title="Producción Total por Producto"
        subtitle="Top 5 productos más producidos"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  if (!data || (!data.byBoxes.length && !data.byLiters.length)) {
    return (
      <ReportCard
        title="Producción Total por Producto"
        subtitle="Top 5 productos más producidos"
      >
        <Alert>
          <AlertDescription>No hay datos disponibles para el período seleccionado</AlertDescription>
        </Alert>
      </ReportCard>
    );
  }

  const chartData = selectedMetric === "boxes" 
    ? data.byBoxes.map(item => ({
        name: item.name,
        Cantidad: item.totalBoxes
      }))
    : data.byLiters.map(item => ({
        name: item.name,
        Cantidad: item.totalLiters
      }));

  const handleViewDetails = () => {
    router.push("/reports/production-by-product");
  };

  return (
    <ReportCard
      title="Producción Total por Producto"
      subtitle="Top 5 productos más producidos"
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
      headerClassName="bg-[#e8f6e9]"
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
        <div className="flex items-center justify-center py-6 px-6 min-h-[400px]">
          <div className="h-[320px] w-full -ml-2">
            <BarChart
              data={chartData}
              index="name"
              categories={["Cantidad"]}
              colors={["#4ade80"]}
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
      </div>
    </ReportCard>
  );
} 