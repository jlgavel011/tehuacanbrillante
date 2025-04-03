import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the last 30 days for analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get the ID of the "Mantenimiento" tipo paro
    const tipoMantenimiento = await prisma.tipoParo.findFirst({
      where: {
        nombre: "Mantenimiento"
      }
    });

    if (!tipoMantenimiento) {
      throw new Error("Tipo de paro 'Mantenimiento' no encontrado");
    }

    // Fetch and aggregate stops data by line
    const paros = await prisma.paro.groupBy({
      by: ['lineaProduccionId'],
      where: {
        tipoParoId: tipoMantenimiento.id,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: {
        _all: true
      },
      _sum: {
        tiempoMinutos: true
      }
    });

    // Get all production lines to ensure we have their names
    const lineas = await prisma.lineaProduccion.findMany();
    const lineasMap = new Map(lineas.map(linea => [linea.id, linea.nombre]));

    // Transform the data into the expected format
    const result = paros.map(paro => ({
      name: lineasMap.get(paro.lineaProduccionId) || 'Línea Desconocida',
      paros: paro._count._all,
      tiempo_total: paro._sum.tiempoMinutos || 0
    }));

    // Sort by total time in descending order
    result.sort((a, b) => b.tiempo_total - a.tiempo_total);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching maintenance stops by line:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de paros por mantenimiento' },
      { status: 500 }
    );
  }
} 