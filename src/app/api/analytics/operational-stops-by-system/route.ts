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

    // Fetch paros and group by subsistema
    const paros = await prisma.paro.groupBy({
      by: ['subsistemaId'],
      where: {
        tipoParoId: tipoOperativo.id,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: true,
      _sum: {
        tiempoMinutos: true
      }
    });

    // Fetch subsistema names
    const subsistemaIds = paros
      .map(p => p.subsistemaId)
      .filter((id): id is string => id !== null);

    const subsistemas = await prisma.subsistema.findMany({
      where: {
        id: {
          in: subsistemaIds
        }
      }
    });

    // Combine data
    const result: OperationalStopData[] = paros.map(paro => {
      const subsistema = subsistemas.find(s => s.id === paro.subsistemaId);
      return {
        name: subsistema?.nombre || 'Subsistema Desconocido',
        paros: paro._count,
        tiempo_total: paro._sum?.tiempoMinutos || 0
      };
    });

    // Sort by tiempo_total
    result.sort((a, b) => b.tiempo_total - a.tiempo_total);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching operational stops by subsystem:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de paros por subsistema' },
      { status: 500 }
    );
  }
} 