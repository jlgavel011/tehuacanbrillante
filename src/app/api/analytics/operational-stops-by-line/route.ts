import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    // Buscar el tipo de paro "Operación"
    const tipoParo = await prisma.tipoParo.findFirst({
      where: {
        nombre: "Operación"
      }
    });

    if (!tipoParo) {
      console.log('No se encontró el tipo de paro Operación');
      return NextResponse.json(
        { error: 'No se encontró el tipo de paro Operación' },
        { status: 404 }
      );
    }

    // Buscar paros por línea
    const paros = await prisma.paro.groupBy({
      by: ['lineaProduccionId'],
      where: {
        AND: [
          { tipoParoId: tipoParo.id },
          {
            createdAt: {
              gte: new Date(fromDate),
              lte: new Date(toDate)
            }
          }
        ]
      },
      _count: {
        _all: true,
      },
      _sum: {
        tiempoMinutos: true,
      }
    });

    // Obtener los nombres de las líneas
    const lineas = await prisma.lineaProduccion.findMany({
      where: {
        id: {
          in: paros.map(p => p.lineaProduccionId)
        }
      },
      select: {
        id: true,
        nombre: true
      }
    });

    // Mapear los resultados
    const result = paros.map(paro => {
      const linea = lineas.find(l => l.id === paro.lineaProduccionId);
      return {
        name: linea?.nombre || 'Desconocida',
        paros: paro._count._all,
        tiempo_total: paro._sum.tiempoMinutos || 0
      };
    });

    // Ordenar por tiempo total
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