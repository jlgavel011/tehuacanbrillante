import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { startDate, endDate } = await req.json();

    // Validar fechas
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Se requieren fechas de inicio y fin" },
        { status: 400 }
      );
    }

    // Obtener total de paros y tiempo total desde la tabla de producción
    const stopsData = await prisma.produccion.aggregate({
      where: {
        fechaProduccion: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        paros: {
          some: {} // Asegura que solo contemos producciones con paros
        }
      },
      _count: {
        _all: true, // Cuenta todas las producciones que tienen paros
      },
    });

    // Obtener el tiempo total de paros
    const stopTimeData = await prisma.paro.aggregate({
      where: {
        produccion: {
          fechaProduccion: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          }
        }
      },
      _sum: {
        tiempoMinutos: true,
      },
    });

    // Obtener el conteo total de paros
    const totalStopsCount = await prisma.paro.count({
      where: {
        produccion: {
          fechaProduccion: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          }
        }
      }
    });

    return NextResponse.json({
      totalStops: totalStopsCount,
      totalStopTime: stopTimeData._sum?.tiempoMinutos || 0,
    });
  } catch (error) {
    console.error("Error al obtener indicadores de paros:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos" },
      { status: 500 }
    );
  }
} 