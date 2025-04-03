import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { TipoParo } from "@prisma/client";

interface StopAggregation {
  tipoParoId: string;
  _count: {
    _all: number;
  };
  _sum: {
    tiempoMinutos: number | null;
  };
}

export async function GET() {
  try {
    // Get the last 30 days for analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all stop types first to ensure we have their names
    const tiposParos = await prisma.tipoParo.findMany();
    const tiposMap = new Map(tiposParos.map((tipo: TipoParo) => [tipo.id, tipo.nombre]));

    // Fetch and aggregate stops data
    const paros = await prisma.paro.groupBy({
      by: ['tipoParoId'],
      where: {
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

    // Transform the data into the expected format
    const result = paros.map(paro => ({
      name: tiposMap.get(paro.tipoParoId) || 'Desconocido',
      paros: paro._count._all,
      tiempo_total: paro._sum.tiempoMinutos || 0
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching stops by type:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de paros por tipo' },
      { status: 500 }
    );
  }
} 