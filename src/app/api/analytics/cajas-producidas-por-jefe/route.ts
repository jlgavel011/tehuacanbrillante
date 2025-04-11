import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addDays, parseISO } from "date-fns";

interface JefeLineaData {
  id: string;
  nombre: string;
  cajasProducidas: number;
  litrosProducidos: number;
  totalOrdenes: number;
  porcentajeCajas: number;
  porcentajeLitros: number;
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
    const produccionPorJefe = await prisma.produccionHistorial.groupBy({
      by: ["userId"],
      _sum: {
        cajasProducidas: true,
      },
      where: {
        fechaInicio: {
          gte: fromDate,
          lt: toDate,
        },
      },
    });

    // Obtener el total de órdenes por jefe de línea
    const ordenesPorJefe = await prisma.produccionHistorial.groupBy({
      by: ["userId"],
      _count: {
        produccionId: true,
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

    // Agregar datos de producción
    for (const prod of produccionPorJefe) {
      jefeMap.set(prod.userId, {
        id: prod.userId,
        cajasProducidas: prod._sum.cajasProducidas || 0,
        litrosProducidos: 0, // Inicializamos en 0, se calculará después
        totalOrdenes: 0,
      });
    }

    // Agregar datos de órdenes
    for (const orden of ordenesPorJefe) {
      if (jefeMap.has(orden.userId)) {
        const jefeData = jefeMap.get(orden.userId);
        jefeData.totalOrdenes = orden._count.produccionId;
        jefeMap.set(orden.userId, jefeData);
      }
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

    // Obtener todas las historias de producción con detalles para calcular los litros
    const produccionHistoriales = await prisma.produccionHistorial.findMany({
      where: {
        userId: {
          in: jefesIds,
        },
        fechaInicio: {
          gte: fromDate,
          lt: toDate,
        },
      },
      include: {
        produccion: {
          include: {
            producto: {
              include: {
                tamaño: true,
                caja: true,
              },
            },
          },
        },
      },
    });

    // Calcular litros producidos
    for (const historial of produccionHistoriales) {
      const jefe = jefeMap.get(historial.userId);
      
      if (jefe && historial.produccion?.producto?.tamaño && historial.produccion?.producto?.caja) {
        const litrosPorUnidad = historial.produccion.producto.tamaño.litros || 0;
        const unidadesPorCaja = historial.produccion.producto.caja.numeroUnidades || 0;
        const cajas = historial.cajasProducidas || 0;
        
        // Litros = cajas * unidades por caja * litros por unidad
        const litros = cajas * unidadesPorCaja * litrosPorUnidad;
        jefe.litrosProducidos += litros;
        
        jefeMap.set(historial.userId, jefe);
      }
    }

    // Calcular el total de cajas y litros producidos
    let totalCajasProducidas = 0;
    let totalLitrosProducidos = 0;
    
    jefeMap.forEach((jefeData) => {
      totalCajasProducidas += jefeData.cajasProducidas;
      totalLitrosProducidos += jefeData.litrosProducidos;
    });

    // Juntar toda la información y calcular porcentajes
    const jefesData: JefeLineaData[] = [];
    for (const jefe of jefesInfo) {
      const jefeData = jefeMap.get(jefe.id);
      if (jefeData) {
        jefesData.push({
          id: jefe.id,
          nombre: jefe.name,
          cajasProducidas: jefeData.cajasProducidas,
          litrosProducidos: jefeData.litrosProducidos,
          totalOrdenes: jefeData.totalOrdenes,
          porcentajeCajas: totalCajasProducidas > 0 
            ? (jefeData.cajasProducidas / totalCajasProducidas) * 100 
            : 0,
          porcentajeLitros: totalLitrosProducidos > 0 
            ? (jefeData.litrosProducidos / totalLitrosProducidos) * 100 
            : 0,
        });
      }
    }

    // Ordenar por cajasProducidas (mayor a menor)
    jefesData.sort((a, b) => b.cajasProducidas - a.cajasProducidas);

    // Aplicar límite si se especificó
    const limitedData = limit ? jefesData.slice(0, limit) : jefesData;

    return NextResponse.json({
      data: limitedData,
      totalJefes: jefesData.length,
      totalCajasProducidas: totalCajasProducidas,
      totalLitrosProducidos: totalLitrosProducidos,
    });
  } catch (error) {
    console.error("Error fetching cajas producidas por jefe:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 