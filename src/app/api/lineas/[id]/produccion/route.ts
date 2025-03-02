import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// Define the type for a paro with its relations
type ParoWithRelations = {
  tiempoMinutos: number;
  tipoParo: {
    nombre: string;
  };
  [key: string]: any;
};

// GET /api/lineas/[id]/produccion - Get real-time production data for a specific line
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401 }
      );
    }

    const lineaId = params.id;
    
    if (!lineaId) {
      return new NextResponse(
        JSON.stringify({ error: "ID de línea no proporcionado" }),
        { status: 400 }
      );
    }
    
    // Find the active production order for this line
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordenActiva = await prisma.produccion.findFirst({
      where: {
        lineaProduccionId: lineaId,
        fechaProduccion: {
          gte: today,
        },
      },
      include: {
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
      orderBy: {
        fechaProduccion: "desc",
      },
    });
    
    if (!ordenActiva) {
      return new NextResponse(
        JSON.stringify({ 
          error: "No hay órdenes activas para esta línea",
          lineaId
        }),
        { status: 404 }
      );
    }
    
    // Calculate total downtime for the order
    const totalDowntimeMinutes = ordenActiva.paros.reduce(
      (total: number, paro: ParoWithRelations) => total + paro.tiempoMinutos,
      0
    );
    
    // Calculate production efficiency
    const efficiency = ordenActiva.cajasPlanificadas > 0
      ? (ordenActiva.cajasProducidas / ordenActiva.cajasPlanificadas) * 100
      : 0;
    
    // Group downtime by type
    const downtimeByType = ordenActiva.paros.reduce((acc: Record<string, number>, paro: ParoWithRelations) => {
      const tipoNombre = paro.tipoParo.nombre;
      if (!acc[tipoNombre]) {
        acc[tipoNombre] = 0;
      }
      acc[tipoNombre] += paro.tiempoMinutos;
      return acc;
    }, {});
    
    return NextResponse.json({
      ordenActiva,
      statistics: {
        cajasProducidas: ordenActiva.cajasProducidas,
        cajasPlanificadas: ordenActiva.cajasPlanificadas,
        efficiency: Math.round(efficiency * 100) / 100,
        totalDowntimeMinutes,
        downtimeByType,
      },
    });
  } catch (error) {
    console.error("Error al obtener datos de producción:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener datos de producción" }),
      { status: 500 }
    );
  }
} 