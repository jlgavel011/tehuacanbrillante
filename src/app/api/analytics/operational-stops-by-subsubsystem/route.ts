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

    // Fetch paros and group by subsubsistema
    const paros = await prisma.paro.groupBy({
      by: ['subsubsistemaId'],
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

    // Fetch subsubsistema names
    const subsubsistemaIds = paros
      .map(p => p.subsubsistemaId)
      .filter((id): id is string => id !== null);

    const subsubsistemas = await prisma.subsubsistema.findMany({
      where: {
        id: {
          in: subsubsistemaIds
        }
      }
    });

    // Combine data
    const result: OperationalStopData[] = paros.map(paro => {
      const subsubsistema = subsubsistemas.find(s => s.id === paro.subsubsistemaId);
      return {
        name: subsubsistema?.nombre || 'Subsubsistema Desconocido',
        paros: paro._count,
        tiempo_total: paro._sum?.tiempoMinutos || 0
      };
    });

    // Sort by tiempo_total
    result.sort((a, b) => b.tiempo_total - a.tiempo_total);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching operational stops by subsubsystem:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de paros por subsubsistema' },
      { status: 500 }
    );
  }
} 