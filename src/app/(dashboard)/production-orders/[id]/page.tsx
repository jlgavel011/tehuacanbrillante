import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";

interface ProductionOrderPageProps {
  params: {
    id: string;
  };
}

// Define interfaces for the data
interface Paro {
  id: string;
  tiempoMinutos: number;
  tipoParo: {
    nombre: string;
  };
  subsistema?: {
    nombre: string;
  } | null;
  subsubsistema?: {
    nombre: string;
  } | null;
  descripcion?: string | null;
  fechaInicio: Date | string;
}

// Generate dynamic metadata
export async function generateMetadata({ params }: ProductionOrderPageProps): Promise<Metadata> {
  // Fetch the production order
  const orden = await prisma.produccion.findUnique({
    where: {
      id: params.id,
    },
    include: {
      producto: true,
    },
  });

  if (!orden) {
    return {
      title: "Orden no encontrada | Tehuacán Brillante",
      description: "La orden de producción solicitada no existe",
    };
  }

  return {
    title: `Orden #${orden.numeroOrden} | Tehuacán Brillante`,
    description: `Detalles de la orden de producción #${orden.numeroOrden} para ${orden.producto.nombre}`,
  };
}

export default async function ProductionOrderPage({ params }: ProductionOrderPageProps) {
  // Fetch the production order
  const orden = await prisma.produccion.findUnique({
    where: {
      id: params.id,
    },
    include: {
      lineaProduccion: true,
      producto: {
        include: {
          modelo: true,
          sabor: true,
          tamaño: true,
          caja: true,
        },
      },
      paros: {
        include: {
          tipoParo: true,
          subsistema: true,
          subsubsistema: true,
        },
        orderBy: {
          fechaInicio: "desc",
        },
      },
    },
  });

  // If the order doesn't exist, return a 404
  if (!orden) {
    notFound();
  }

  // Calculate progress percentage
  const progressPercentage = Math.min(
    (orden.cajasProducidas / orden.cajasPlanificadas) * 100,
    100
  ).toFixed(0);

  // Calculate total pause time
  const totalPauseTime = orden.paros.reduce(
    (total, paro) => total + paro.tiempoMinutos, 
    0
  );

  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center mb-2">
        <Link href="/production-orders">
          <Button variant="ghost" size="sm" className="flex items-center h-8 px-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Order Information */}
        <Card className="md:col-span-2 border shadow-sm">
          <CardHeader className="px-4 sm:px-6 py-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Orden de Producción</p>
                <CardTitle className="text-xl sm:text-2xl text-black">#{orden.numeroOrden}</CardTitle>
              </div>
              <Badge className={progressPercentage === "100" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}>
                {progressPercentage}% Completado
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Producto</h3>
                <p className="text-lg font-semibold">{orden.producto.nombre}</p>
                <p className="text-sm">
                  {orden.producto.sabor.nombre} • {orden.producto.tamaño.litros}L • {orden.producto.modelo.nombre}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Línea de Producción</h3>
                <p className="text-lg font-semibold">{orden.lineaProduccion.nombre}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Fecha de Producción</h3>
                <p className="text-lg font-semibold">
                  {format(new Date(orden.fechaProduccion), "PPP", { locale: es })}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Turno</h3>
                <p className="text-lg font-semibold">Turno {orden.turno}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Cajas Producidas</h3>
                <p className="text-lg font-semibold">
                  {orden.cajasProducidas} / {orden.cajasPlanificadas}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Fecha de Creación</h3>
                <p className="text-lg font-semibold">
                  {format(new Date(orden.createdAt), "PPP", { locale: es })}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Progreso</h3>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    progressPercentage === "100" ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Stats */}
        <Card className="border shadow-sm">
          <CardHeader className="px-4 sm:px-6 py-4">
            <CardTitle className="text-lg sm:text-xl text-black">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Eficiencia</h3>
                <p className="text-2xl font-bold">
                  {orden.cajasProducidas > 0
                    ? Math.min(
                        Math.round((orden.cajasProducidas / orden.cajasPlanificadas) * 100),
                        100
                      )
                    : 0}
                  %
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Paros Registrados</h3>
                <p className="text-2xl font-bold">{orden.paros.length}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tiempo Total de Paros</h3>
                <p className="text-2xl font-bold">
                  {totalPauseTime} minutos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paros List */}
        {orden.paros.length > 0 && (
          <Card className="md:col-span-3 border shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-4">
              <CardTitle className="text-lg sm:text-xl text-black">Paros Registrados</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              <div className="rounded-md border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duración
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subsistema
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orden.paros.map((paro) => (
                        <tr key={paro.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline">{paro.tipoParo.nombre}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {paro.tiempoMinutos} minutos
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {paro.subsistema ? paro.subsistema.nombre : "-"}
                            {paro.subsubsistema && ` > ${paro.subsubsistema.nombre}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {format(new Date(paro.fechaInicio), "dd/MM/yyyy HH:mm")}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900 max-w-xs truncate">
                              {paro.descripcion || "-"}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 