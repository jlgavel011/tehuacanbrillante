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
        return "border border-green-600 bg-green-100 text-black font-medium";
      case "in-progress":
        return "border border-blue-600 bg-blue-100 text-black font-medium";
      case "pending":
        return "border border-yellow-600 bg-yellow-100 text-black font-medium";
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
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black mb-1">Órdenes de Producción</p>
                <h3 className="text-2xl font-bold text-black">24</h3>
                <p className="text-sm font-medium text-black flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-700" />
                  <span>8% vs. mes anterior</span>
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/15 rounded-full flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black mb-1">Líneas de Producción</p>
                <h3 className="text-2xl font-bold text-black">4</h3>
                <p className="text-sm font-medium text-black flex items-center mt-1">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-700" />
                  <span>Todas operativas</span>
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Factory className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black mb-1">Tiempo de Paro</p>
                <h3 className="text-2xl font-bold text-black">3.5 hrs</h3>
                <p className="text-sm font-medium text-black flex items-center mt-1">
                  <AlertTriangle className="h-4 w-4 mr-1 text-red-700" />
                  <span>12% vs. mes anterior</span>
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black mb-1">Producción Total</p>
                <h3 className="text-2xl font-bold text-black">48,500</h3>
                <p className="text-sm font-medium text-black flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-700" />
                  <span>5% vs. mes anterior</span>
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Downtime Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-black text-lg font-bold">Órdenes de Producción Recientes</CardTitle>
            <CardDescription className="text-black">
              Últimas órdenes creadas o actualizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium text-black">ID</TableHead>
                  <TableHead className="font-medium text-black">Producto</TableHead>
                  <TableHead className="font-medium text-black text-right">Cantidad</TableHead>
                  <TableHead className="font-medium text-black">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-primary/5">
                    <TableCell className="font-medium text-black">{order.id}</TableCell>
                    <TableCell className="text-black">{order.product}</TableCell>
                    <TableCell className="text-black text-right">{order.quantity.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center justify-center ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" className="text-black hover:text-primary hover:border-primary focus:ring-2 focus:ring-primary/50">
                Ver todas las órdenes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-black text-lg font-bold">Eventos de Paro Recientes</CardTitle>
            <CardDescription className="text-black">
              Paros de producción en las últimas 24 horas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium text-black">ID</TableHead>
                  <TableHead className="font-medium text-black">Línea</TableHead>
                  <TableHead className="font-medium text-black">Razón</TableHead>
                  <TableHead className="font-medium text-black text-right">Duración (min)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDowntimeEvents.map((event) => (
                  <TableRow key={event.id} className="hover:bg-primary/5">
                    <TableCell className="font-medium text-black">{event.id}</TableCell>
                    <TableCell className="text-black">{event.line}</TableCell>
                    <TableCell className="text-black">{event.reason}</TableCell>
                    <TableCell className="text-black text-right">{event.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" className="text-black hover:text-primary hover:border-primary focus:ring-2 focus:ring-primary/50">
                Ver todos los paros
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Overview */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-black text-lg font-bold">Visión General de Producción</CardTitle>
          <CardDescription className="text-black">
            Desempeño de las líneas de producción en tiempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full flex items-center justify-center bg-gray-50 rounded-md border border-gray-200">
            <div className="flex flex-col items-center justify-center text-black">
              <BarChart2 className="h-16 w-16 text-primary mb-3" />
              <p className="text-center text-sm font-medium">Gráficos de producción en desarrollo</p>
              <p className="text-center text-xs">Próximamente: visualización de datos en tiempo real</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button className="bg-primary text-white hover:bg-primary/90 focus:ring-2 focus:ring-primary/50">
              Ver detalles de líneas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 