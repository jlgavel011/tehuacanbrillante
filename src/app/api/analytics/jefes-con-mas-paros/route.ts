import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addDays, parseISO } from "date-fns";

interface JefeParosData {
  id: string;
  nombre: string;
  cantidadParos: number;
  tiempoParos: number;
  porcentajeCantidad: number;
  porcentajeTiempo: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    if (!from || !to) {
      return NextResponse.json(
        { error: "Los parámetros 'from' y 'to' son requeridos" },
        { status: 400 }
      );
    }

    const fromDate = parseISO(from);
    const toDate = addDays(parseISO(to), 1); // Include the end date

    // Obtener los datos reales de ProduccionHistorial agrupados por jefe de línea
    const parosPorJefe = await prisma.produccionHistorial.groupBy({
      by: ["userId"],
      _sum: {
        cantidadParosTotal: true,
        tiempoParosTotal: true,
        cantidadParosMantenimiento: true,
        cantidadParosCalidad: true,
        cantidadParosOperacion: true,
        tiempoParosMantenimiento: true,
        tiempoParosCalidad: true,
        tiempoParosOperacion: true,
      },
      where: {
        fechaInicio: {
          gte: fromDate,
          lt: toDate,
        },
      },
    });

    // Crear un mapa para juntar los datos
    const jefeMap = new Map();

    // Calcular totales
    let totalParos = 0;
    let totalTiempoParos = 0;

    // Agregar datos de paros
    for (const paro of parosPorJefe) {
      const cantidadParos = paro._sum.cantidadParosTotal || 0;
      const tiempoParos = paro._sum.tiempoParosTotal || 0;
      
      totalParos += cantidadParos;
      totalTiempoParos += tiempoParos;

      jefeMap.set(paro.userId, {
        id: paro.userId,
        cantidadParos,
        tiempoParos,
        // Desglose por tipo (para posible uso futuro)
        cantidadParosMantenimiento: paro._sum.cantidadParosMantenimiento || 0,
        cantidadParosCalidad: paro._sum.cantidadParosCalidad || 0,
        cantidadParosOperacion: paro._sum.cantidadParosOperacion || 0,
        tiempoParosMantenimiento: paro._sum.tiempoParosMantenimiento || 0,
        tiempoParosCalidad: paro._sum.tiempoParosCalidad || 0,
        tiempoParosOperacion: paro._sum.tiempoParosOperacion || 0,
      });
    }

    // Obtener información de los jefes (nombres)
    const jefesIds = Array.from(jefeMap.keys());
    const jefesInfo = await prisma.user.findMany({
      where: {
        id: {
          in: jefesIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Juntar toda la información y calcular porcentajes
    const jefesData: JefeParosData[] = [];
    for (const jefe of jefesInfo) {
      const jefeData = jefeMap.get(jefe.id);
      if (jefeData) {
        jefesData.push({
          id: jefe.id,
          nombre: jefe.name,
          cantidadParos: jefeData.cantidadParos,
          tiempoParos: jefeData.tiempoParos,
          porcentajeCantidad: totalParos > 0 
            ? (jefeData.cantidadParos / totalParos) * 100 
            : 0,
          porcentajeTiempo: totalTiempoParos > 0 
            ? (jefeData.tiempoParos / totalTiempoParos) * 100 
            : 0,
        });
      }
    }

    // Ordenar por cantidadParos (mayor a menor)
    jefesData.sort((a, b) => b.cantidadParos - a.cantidadParos);

    // Aplicar límite si se especificó
    const limitedData = limit ? jefesData.slice(0, limit) : jefesData;

    return NextResponse.json({
      data: limitedData,
      totalJefes: jefesData.length,
      totalParos,
      totalTiempoParos,
    });
  } catch (error) {
    console.error("Error fetching jefes con mas paros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 