"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { BarChart } from "@/components/analytics/charts/BarChart";
import { formatNumber } from "@/lib/utils/formatters";
import { useDateRange } from "@/context/DateRangeContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ProductLineEfficiency {
  productoId: string;
  productoNombre: string;
  lineaProduccionId: string;
  lineaProduccionNombre: string;
  promedioCajasHora: number;
  velocidadPlan: number;
  eficiencia: number;
  desviacion: number;
  totalRegistros: number;
}

export default function HourlyProductionEfficiencyReport() {
  const router = useRouter();
  const { date } = useDateRange();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProductLineEfficiency[]>([]);
  const [topDeviated, setTopDeviated] = useState<ProductLineEfficiency[]>([]);
  const [averageEfficiency, setAverageEfficiency] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!date?.from || !date?.to) return;

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          from: date.from.toISOString(),
          to: date.to.toISOString(),
          limit: "10", // Get the top 10 most deviated products for the chart
        });

        const response = await fetch(`/api/analytics/hourly-production-efficiency?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos");
        
        const result = await response.json();
        
        setTopDeviated(result.topDeviated);
        setData(result.allData);
        setAverageEfficiency(result.averageEfficiency);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date?.from?.getTime(), date?.to?.getTime()]);

  // Format data for the bar chart
  const chartData = topDeviated.map(item => ({
    product: `${item.productoNombre} (${item.lineaProduccionNombre})`.length > 30 
      ? `${item.productoNombre} (${item.lineaProduccionNombre})`.substring(0, 30) + '...' 
      : `${item.productoNombre} (${item.lineaProduccionNombre})`,
    "Real (cajas/hr)": item.promedioCajasHora,
    "Plan (cajas/hr)": item.velocidadPlan,
    "Desviación (%)": item.desviacion,
  }));

  const colors = ["#5EEAD4", "#E57373", "#FFD166"];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reporte de Eficiencia de Producción por Hora</h1>
          <p className="text-muted-foreground">Análisis detallado de la comparación entre producción real y velocidad planificada</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => router.push('/analytics')}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Analytics
        </Button>
      </div>
      
      <Card>
        <CardHeader className="bg-emerald-100 dark:bg-emerald-900/20 border-b">
          <CardTitle>Eficiencia de Producción por Hora</CardTitle>
          <CardDescription>
            Comparación de velocidad de producción real vs planificada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Eficiencia Promedio</p>
                <p className="text-2xl font-semibold">
                  {loading ? '-' : `${(averageEfficiency * 100).toFixed(1)}%`}
                </p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Productos Analizados</p>
                <p className="text-2xl font-semibold">
                  {loading ? '-' : data.length}
                </p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Mayor Desviación</p>
                <p className="text-2xl font-semibold">
                  {loading || topDeviated.length === 0 ? '-' : `${topDeviated[0].desviacion.toFixed(1)}%`}
                </p>
              </Card>
            </div>

            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : topDeviated.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No hay datos disponibles para el período seleccionado
                </AlertDescription>
              </Alert>
            ) : (
              <div className="h-[400px] w-full">
                <h3 className="text-base font-medium mb-2">Top {topDeviated.length} Productos con Mayor Desviación</h3>
                <BarChart
                  data={chartData}
                  index="product"
                  categories={["Real (cajas/hr)", "Plan (cajas/hr)"]}
                  colors={colors}
                  valueFormatter={(value) => formatNumber(value)}
                  className="h-full"
                />
              </div>
            )}

            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : error ? null : data.length === 0 ? null : (
              <div>
                <h3 className="text-base font-medium mb-2">Detalle de Eficiencia por Producto y Línea</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Línea de Producción</TableHead>
                        <TableHead className="text-right">Cajas/Hora Real</TableHead>
                        <TableHead className="text-right">Velocidad Plan</TableHead>
                        <TableHead className="text-right">Eficiencia</TableHead>
                        <TableHead className="text-right">Desviación</TableHead>
                        <TableHead className="text-right">Registros</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((item) => (
                        <TableRow key={`${item.productoId}-${item.lineaProduccionId}`}>
                          <TableCell className="font-medium">{item.productoNombre}</TableCell>
                          <TableCell>{item.lineaProduccionNombre}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.promedioCajasHora)}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.velocidadPlan)}</TableCell>
                          <TableCell className="text-right">{`${(item.eficiencia * 100).toFixed(1)}%`}</TableCell>
                          <TableCell 
                            className={`text-right ${item.desviacion >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {`${item.desviacion.toFixed(1)}%`}
                          </TableCell>
                          <TableCell className="text-right">{item.totalRegistros}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 