import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

interface StopStats {
  name: string;
  paros: number;
  tiempo_total: number;
}

interface ParoWithMateriaPrima {
  tiempoMinutos: number;
  materiaPrima: {
    nombre: string;
  } | null;
}

export async function GET(request: Request) {
  try {
    // Get date range from query parameters
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'Se requieren los parámetros from y to' },
        { status: 400 }
      );
    }

    // Buscar el tipo de paro "Calidad"
    const tipoParo = await prisma.tipoParo.findFirst({
      where: {
        nombre: "Calidad"
      }
    });

    if (!tipoParo) {
      console.log('No se encontró el tipo de paro Calidad');
      return NextResponse.json(
        { error: 'No se encontró el tipo de paro Calidad' },
        { status: 404 }
      );
    }

    // Buscar paros de calidad que tengan materia prima asociada
    const paros = await (prisma as any).paro.findMany({
      where: {
        AND: [
          { tipoParoId: tipoParo.id },
          { materiaPrimaId: { not: null } },
          { desviacionCalidadId: { not: null } },
          {
            createdAt: {
              gte: new Date(fromDate),
              lte: new Date(toDate)
            }
          }
        ]
      },
      include: {
        materiaPrima: {
          select: {
            nombre: true
          }
        }
      }
    }) as ParoWithMateriaPrima[];

    // Agrupar por materia prima
    const materiasPrimasMap = new Map<string, StopStats>();

    paros.forEach((paro: ParoWithMateriaPrima) => {
      if (paro.materiaPrima?.nombre) {
        const nombre = paro.materiaPrima.nombre;
        const stats = materiasPrimasMap.get(nombre) || { name: nombre, paros: 0, tiempo_total: 0 };
        stats.paros += 1;
        stats.tiempo_total += paro.tiempoMinutos || 0;
        materiasPrimasMap.set(nombre, stats);
      }
    });

    // Convertir a array y ordenar por tiempo total
    const result = Array.from(materiasPrimasMap.values());
    result.sort((a, b) => b.tiempo_total - a.tiempo_total);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching raw material quality deviation stops:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de paros por materias primas' },
      { status: 500 }
    );
  }
} 