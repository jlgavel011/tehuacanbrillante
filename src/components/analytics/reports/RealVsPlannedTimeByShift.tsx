import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { BarChart } from "@/components/analytics/charts/BarChart";
import { useDateRange } from "@/context/DateRangeContext";
import { ReportCard } from "@/components/dashboard/report-card";

// Interfaces para los datos
interface TurnoConTiempoReal {
  id: string;
  nombre: string;
  tiempoPlan: number;
  tiempoReal: number;
  diferencia: number;
  diferenciaPorcentaje: number;
  totalOrdenes: number;
  porcentajePromedioCumplimiento?: number;
}

interface RealVsPlannedTimeByShiftResponse {
  data: TurnoConTiempoReal[];
  totalTurnos: number;
  promedioDesviacionPositiva: number;
  promedioDesviacionNegativa: number;
  filtroCompletadas?: boolean;
}

export default function RealVsPlannedTimeByShift() {
  const router = useRouter();
  const { date: dateRange } = useDateRange();
  const [data, setData] = useState<TurnoConTiempoReal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promedioDesviacionPositiva, setPromedioDesviacionPositiva] = useState(0);
  const [promedioDesviacionNegativa, setPromedioDesviacionNegativa] = useState(0);
  const [totalTurnos, setTotalTurnos] = useState(0);
  const [filtroCompletadas, setFiltroCompletadas] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = dateRange?.to?.toISOString() || new Date().toISOString();
        
        const response = await fetch(
          `/api/analytics/real-vs-planned-time-by-shift?from=${from}&to=${to}&limit=10&includeIncomplete=false`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result: RealVsPlannedTimeByShiftResponse = await response.json();
        
        if (result.data.length === 0) {
          setError("No se encontraron datos para el período seleccionado");
        } else {
          setData(result.data);
          setPromedioDesviacionPositiva(result.promedioDesviacionPositiva);
          setPromedioDesviacionNegativa(result.promedioDesviacionNegativa);
          setTotalTurnos(result.totalTurnos);
          setFiltroCompletadas(result.filtroCompletadas !== false);
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
    router.push(`/reports/real-vs-planned-time-by-shift-detail`);
  };

  // Preparar datos para el gráfico de barras
  const chartData = data.map(item => ({
    turno: item.nombre,
    "Tiempo Plan": item.tiempoPlan,
    "Tiempo Real": item.tiempoReal,
    diferenciaPorcentaje: item.diferenciaPorcentaje
  }));

  function getEfficiencyColorClass(value: number): string {
    if (value <= -10) return "text-green-600";
    if (value >= 10) return "text-red-600";
    return "text-amber-500";
  }

  return (
    <ReportCard
      title="Tiempo Real vs Planificado por Turno"
      subtitle="Comparación de tiempos de producción real vs planificado por turno de trabajo"
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
      headerClassName="bg-[#e8f6e9]"
    >
      <div className="border-b border-border/50" />
      <div className="flex flex-col gap-2">
        <div className="px-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-[#e2f1f8]/20 p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-slate-500" />
                <p className="text-sm text-muted-foreground">Turnos Analizados</p>
              </div>
              <p className="text-xl font-semibold">
                {loading ? '-' : totalTurnos}
              </p>
            </div>
            
            <div className="rounded-lg bg-[#e2f1f8]/20 p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Eficiencia Promedio</p>
              </div>
              <p className={`text-xl font-semibold ${loading ? '' : getEfficiencyColorClass(promedioDesviacionNegativa)}`}>
                {loading ? '-' : `${promedioDesviacionNegativa < 0 ? (promedioDesviacionNegativa * -1).toFixed(1) : promedioDesviacionNegativa.toFixed(1)}%`}
                {!loading && promedioDesviacionNegativa < 0 && (
                  <span className="ml-2 inline-flex">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </span>
                )}
              </p>
            </div>
            
            <div className="rounded-lg bg-[#e2f1f8]/20 p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <p className="text-sm text-muted-foreground">Ineficiencia Promedio</p>
              </div>
              <p className={`text-xl font-semibold ${loading ? '' : getEfficiencyColorClass(promedioDesviacionPositiva)}`}>
                {loading ? '-' : `${promedioDesviacionPositiva.toFixed(1)}%`}
                {!loading && promedioDesviacionPositiva > 0 && (
                  <span className="ml-2 inline-flex">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </span>
                )}
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
        ) : data.length === 0 ? (
          <div className="p-6">
            <Alert>
              <AlertDescription>
                No hay datos disponibles para el período seleccionado
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-center pt-4 px-6 pb-6 min-h-[350px]">
              <div className="h-[350px] w-full">
                <BarChart 
                  data={chartData} 
                  categories={["Tiempo Plan", "Tiempo Real"]} 
                  index="turno"
                  colors={["#16a34a", "#4ade80"]}
                  className="h-full"
                />
              </div>
            </div>
            {filtroCompletadas && (
              <div className="px-6 pb-4 text-xs text-center text-muted-foreground">
                * Solo se muestran órdenes con ≥95% de cajas completadas
              </div>
            )}
          </div>
        )}
      </div>
    </ReportCard>
  );
} 