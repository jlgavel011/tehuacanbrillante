import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface OperationalStopData {
  name: string;
  paros: number;
  tiempo_total: number;
}

export async function GET() {
  try {
    // Get the last 30 days for analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get the ID of the "Operativo" tipo paro
    const tipoOperativo = await prisma.tipoParo.findFirst({
      where: {
        nombre: "Operativo"
      }
    });

    if (!tipoOperativo) {
      throw new Error("Tipo de paro 'Operativo' no encontrado");
    }

    // Fetch paros and group by linea
    const paros = await prisma.paro.groupBy({
      by: ['lineaProduccionId'],
      where: {
        tipoParoId: tipoOperativo.id,
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

    // Fetch linea names
    const lineaIds = paros.map(p => p.lineaProduccionId);
    const lineas = await prisma.lineaProduccion.findMany({
      where: {
        id: {
          in: lineaIds
        }
      }
    });

    // Combine data
    const result: OperationalStopData[] = paros.map(paro => {
      const linea = lineas.find(l => l.id === paro.lineaProduccionId);
      return {
        name: linea?.nombre || 'Línea Desconocida',
        paros: paro._count._all,
        tiempo_total: paro._sum.tiempoMinutos || 0
      };
    });

    // Sort by tiempo_total
    result.sort((a, b) => b.tiempo_total - a.tiempo_total);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching operational stops by line:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de paros por operación' },
      { status: 500 }
    );
  }
} 