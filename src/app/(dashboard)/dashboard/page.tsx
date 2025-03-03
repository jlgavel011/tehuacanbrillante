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
  ClipboardList
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

export default function DashboardPage() {
  const { data: session } = useSession();

  // Datos de ejemplo para las órdenes de producción recientes
  const recentOrders = [
    {
      id: "ORD-001",
      product: "Agua Tehuacán 600ml",
      quantity: 5000,
      status: "completed",
      date: "2023-06-15",
    },
    {
      id: "ORD-002",
      product: "Agua Tehuacán 1L",
      quantity: 3000,
      status: "in-progress",
      date: "2023-06-16",
    },
    {
      id: "ORD-003",
      product: "Agua Mineral 600ml",
      quantity: 2500,
      status: "pending",
      date: "2023-06-17",
    },
    {
      id: "ORD-004",
      product: "Agua Tehuacán 2L",
      quantity: 1500,
      status: "completed",
      date: "2023-06-14",
    },
  ];

  // Datos de ejemplo para los eventos de paro recientes
  const recentDowntimeEvents = [
    {
      id: "DT-001",
      line: "Línea 1",
      reason: "Mantenimiento preventivo",
      duration: 45,
      date: "2023-06-15",
    },
    {
      id: "DT-002",
      line: "Línea 2",
      reason: "Fallo eléctrico",
      duration: 120,
      date: "2023-06-14",
    },
    {
      id: "DT-003",
      line: "Línea 3",
      reason: "Cambio de formato",
      duration: 60,
      date: "2023-06-16",
    },
  ];

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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-black">Dashboard</h1>
        <p className="text-black">
          Bienvenido, {session?.user?.name}. Aquí tienes un resumen de la actividad de producción.
        </p>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
          <div className="absolute top-0 left-0 h-1 w-full bg-primary"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-secondary">Órdenes de Producción</p>
                <h3 className="text-3xl font-bold text-text-primary">24</h3>
                <div className="flex items-center text-sm font-medium text-success">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  <span>8% vs. mes anterior</span>
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
                <p className="text-sm font-medium text-text-secondary">Líneas de Producción</p>
                <h3 className="text-3xl font-bold text-text-primary">4</h3>
                <div className="flex items-center text-sm font-medium text-success">
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  <span>Todas operativas</span>
                </div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info/10 text-info transition-transform duration-300 group-hover:scale-110">
                <Factory className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
          <div className="absolute top-0 left-0 h-1 w-full bg-warning"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-secondary">Tiempo de Paro</p>
                <h3 className="text-3xl font-bold text-text-primary">3.5 hrs</h3>
                <div className="flex items-center text-sm font-medium text-error">
                  <AlertTriangle className="mr-1 h-4 w-4" />
                  <span>12% vs. mes anterior</span>
                </div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning transition-transform duration-300 group-hover:scale-110">
                <Clock className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
          <div className="absolute top-0 left-0 h-1 w-full bg-success"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-secondary">Producción Total</p>
                <h3 className="text-3xl font-bold text-text-primary">48,500</h3>
                <div className="flex items-center text-sm font-medium text-success">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  <span>5% vs. mes anterior</span>
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
                  <TableHead className="font-medium text-text-primary">ID</TableHead>
                  <TableHead className="font-medium text-text-primary">Producto</TableHead>
                  <TableHead className="font-medium text-text-primary text-right">Cantidad</TableHead>
                  <TableHead className="font-medium text-text-primary">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-surface/50">
                    <TableCell className="font-medium text-text-primary">{order.id}</TableCell>
                    <TableCell className="text-text-primary">{order.product}</TableCell>
                    <TableCell className="text-text-primary text-right">{order.quantity.toLocaleString()}</TableCell>
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
              <Button variant="outline" className="text-text-primary hover:bg-primary/5 hover:text-primary hover:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200">
                Ver todas las órdenes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader className="border-b border-border/50 bg-surface/50 pb-2">
            <CardTitle className="text-lg font-bold text-text-primary">Eventos de Paro Recientes</CardTitle>
            <CardDescription className="text-text-secondary">
              Paros de producción en las últimas 24 horas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface/70 hover:bg-surface">
                  <TableHead className="font-medium text-text-primary">ID</TableHead>
                  <TableHead className="font-medium text-text-primary">Línea</TableHead>
                  <TableHead className="font-medium text-text-primary">Razón</TableHead>
                  <TableHead className="font-medium text-text-primary text-right">Duración (min)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDowntimeEvents.map((event) => (
                  <TableRow key={event.id} className="hover:bg-surface/50">
                    <TableCell className="font-medium text-text-primary">{event.id}</TableCell>
                    <TableCell className="text-text-primary">{event.line}</TableCell>
                    <TableCell className="text-text-primary">{event.reason}</TableCell>
                    <TableCell className="text-text-primary text-right">{event.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" className="text-text-primary hover:bg-primary/5 hover:text-primary hover:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200">
                Ver todos los paros
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Summary Section */}
      <div className="mt-4">
        <Card className="overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader className="border-b border-border/50 bg-surface/50 pb-2">
            <CardTitle className="text-lg font-bold text-text-primary">Resumen de Producción</CardTitle>
            <CardDescription className="text-text-secondary">
              Rendimiento general de la planta
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-border bg-surface/30 p-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BarChart2 className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-text-primary">Eficiencia</h4>
                <div className="text-2xl font-bold text-primary">92%</div>
                <p className="text-sm text-text-secondary">Promedio mensual</p>
              </div>
              
              <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-border bg-surface/30 p-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <h4 className="text-lg font-semibold text-text-primary">Cumplimiento</h4>
                <div className="text-2xl font-bold text-success">95%</div>
                <p className="text-sm text-text-secondary">De órdenes planificadas</p>
              </div>
              
              <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-border bg-surface/30 p-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <h4 className="text-lg font-semibold text-text-primary">Tiempo Activo</h4>
                <div className="text-2xl font-bold text-warning">87%</div>
                <p className="text-sm text-text-secondary">Disponibilidad</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 