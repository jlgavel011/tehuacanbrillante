"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart2, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Factory,
  ClipboardList,
  Package,
  Droplet,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { DateRangeProvider, useDateRange } from "@/context/DateRangeContext";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { CompareWithFilter } from "@/components/reports/CompareWithFilter";
import { useDashboardIndicators } from "@/hooks/useDashboardIndicators";
import RealVsPlannedTimeByLine from "@/components/analytics/reports/RealVsPlannedTimeByLine";

// Define types for the data
interface ProductionStats {
  totalBoxes: number;
  totalLiters: number;
  previousMonthChange: number;
}

interface ProductionLine {
  id: number;
  name: string;
  status: string;
}

interface StopData {
  tipo: string;
  cantidad: number;
  tiempo_total: number;
  porcentaje: number;
}

interface DowntimeStats {
  totalHours: string | number;
  previousMonthChange: number;
  stops: StopData[];
}

interface ProductionOrder {
  id: string;
  product: string;
  quantity: number;
  status: string;
  date: string;
}

function DashboardContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const { 
    date, 
    setDate, 
    selectedPeriod, 
    setSelectedPeriod,
    comparisonPeriod,
    setComparisonPeriod,
  } = useDateRange();
  
  // Usar el hook de indicadores de dashboard para obtener datos reales
  const {
    totalOrders,
    ordersPercentChange,
    totalBoxes,
    boxesPercentChange,
    planCompliance,
    totalLiters,
    litersPercentChange,
    boxesPerHourEfficiency,
    efficiencyPercentChange,
    recentOrders,
    isLoading,
    error
  } = useDashboardIndicators(date, selectedPeriod, comparisonPeriod);

  // Redirect production chiefs to their portal
  useEffect(() => {
    if (session?.user?.role === "PRODUCTION_CHIEF") {
      router.push("/production-chief");
    }
  }, [session, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border border-success bg-success-light text-success-dark font-medium";
      case "in-progress":
        return "border border-info bg-info-light text-info-dark font-medium";
      case "pending":
        return "border border-warning bg-warning-light text-warning-dark font-medium";
      default:
        return "border border-gray-600 bg-gray-100 text-black font-medium";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada";
      case "in-progress":
        return "En Progreso";
      case "pending":
        return "Pendiente";
      default:
        return status;
    }
  };

  // Función para determinar el color y el icono del cambio porcentual
  const getChangeDisplay = (percentChange: number) => {
    if (percentChange === 0) return { color: "text-gray-500", icon: null };
    
    if (percentChange > 0) {
      return { 
        color: "text-success", 
        icon: <TrendingUp className="h-3 w-3 mr-1" /> 
      };
    } else {
      return { 
        color: "text-warning", 
        icon: <Activity className="h-3 w-3 mr-1" /> 
      };
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <DateRangeFilter
            date={date}
            onDateChange={setDate}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
          <CompareWithFilter
            selectedComparison={comparisonPeriod}
            onComparisonChange={setComparisonPeriod}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="absolute top-0 left-0 h-1 w-full bg-primary"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-secondary">Órdenes de Producción</p>
                    <h3 className="text-3xl font-bold text-text-primary">{totalOrders}</h3>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-sm font-medium text-success">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        <span>Período seleccionado</span>
                      </div>
                      <div className={`text-xs flex items-center font-medium ${getChangeDisplay(ordersPercentChange).color}`}>
                        {getChangeDisplay(ordersPercentChange).icon}
                        <span>{ordersPercentChange > 0 ? '+' : ''}{ordersPercentChange.toFixed(1)}% vs período anterior</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <ClipboardList className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="absolute top-0 left-0 h-1 w-full bg-info"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-secondary">Cajas Producidas</p>
                    <h3 className="text-3xl font-bold text-text-primary">{totalBoxes.toLocaleString()}</h3>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-sm font-medium text-success">
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        <span>{planCompliance.toFixed(1)}% del plan</span>
                      </div>
                      <div className={`text-xs flex items-center font-medium ${getChangeDisplay(boxesPercentChange).color}`}>
                        {getChangeDisplay(boxesPercentChange).icon}
                        <span>{boxesPercentChange > 0 ? '+' : ''}{boxesPercentChange.toFixed(1)}% vs período anterior</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info/10 text-info transition-transform duration-300 group-hover:scale-110">
                    <Package className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="absolute top-0 left-0 h-1 w-full bg-warning"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-secondary">Litros Producidos</p>
                    <h3 className="text-3xl font-bold text-text-primary">{totalLiters.toLocaleString()}</h3>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-sm font-medium text-warning">
                        <Activity className="mr-1 h-4 w-4" />
                        <span>Total en el período</span>
                      </div>
                      <div className={`text-xs flex items-center font-medium ${getChangeDisplay(litersPercentChange).color}`}>
                        {getChangeDisplay(litersPercentChange).icon}
                        <span>{litersPercentChange > 0 ? '+' : ''}{litersPercentChange.toFixed(1)}% vs período anterior</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning transition-transform duration-300 group-hover:scale-110">
                    <Droplet className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="absolute top-0 left-0 h-1 w-full bg-success"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-secondary">Eficiencia</p>
                    <h3 className="text-3xl font-bold text-text-primary">{boxesPerHourEfficiency.toFixed(1)}%</h3>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-sm font-medium text-success">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        <span>Cajas por hora</span>
                      </div>
                      <div className={`text-xs flex items-center font-medium ${getChangeDisplay(efficiencyPercentChange).color}`}>
                        {getChangeDisplay(efficiencyPercentChange).icon}
                        <span>{efficiencyPercentChange > 0 ? '+' : ''}{efficiencyPercentChange.toFixed(1)}% vs período anterior</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success transition-transform duration-300 group-hover:scale-110">
                    <Activity className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders and Downtime Events */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader className="border-b border-border/50 bg-surface/50 pb-2">
                <CardTitle className="text-lg font-bold text-text-primary">Órdenes de Producción Recientes</CardTitle>
                <CardDescription className="text-text-secondary">
                  Últimas órdenes creadas o actualizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface/70 hover:bg-surface">
                      <TableHead className="font-medium text-text-primary">Número de Orden</TableHead>
                      <TableHead className="font-medium text-text-primary">Línea</TableHead>
                      <TableHead className="font-medium text-text-primary">Producto</TableHead>
                      <TableHead className="font-medium text-text-primary text-right">Producidas</TableHead>
                      <TableHead className="font-medium text-text-primary text-right">Planeadas</TableHead>
                      <TableHead className="font-medium text-text-primary">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-surface/50">
                        <TableCell className="font-medium text-text-primary">{order.id}</TableCell>
                        <TableCell className="text-text-primary">{order.line}</TableCell>
                        <TableCell className="text-text-primary">{order.product}</TableCell>
                        <TableCell className="text-text-primary text-right">{order.producedBoxes.toLocaleString()}</TableCell>
                        <TableCell className="text-text-primary text-right">{order.plannedBoxes.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className={`px-2 py-1 rounded-full text-xs inline-flex items-center justify-center ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="outline" 
                    className="text-text-primary hover:bg-primary/5 hover:text-primary hover:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                    onClick={() => router.push('/production-orders')}
                  >
                    Ver todas las órdenes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <RealVsPlannedTimeByLine />
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DateRangeProvider>
      <DashboardContent />
    </DateRangeProvider>
  );
} 