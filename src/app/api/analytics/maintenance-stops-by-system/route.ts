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

    // Get all systems with their maintenance stops
    const sistemas = await prisma.sistema.findMany({
      include: {
        subsistemas: {
          include: {
            paros: {
              where: {
                createdAt: {
                  gte: new Date(fromDate),
                  lte: new Date(toDate)
                },
                tipoParo: {
                  nombre: "Mantenimiento"
                }
              },
              select: {
                tiempoMinutos: true
              }
            }
          }
        },
        lineaProduccion: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Calculate totals for each system
    const result = sistemas.map(sistema => {
      const paros = sistema.subsistemas.flatMap(subsistema => subsistema.paros);
      return {
        name: sistema.nombre,
        linea: sistema.lineaProduccion.nombre,
        paros: paros.length,
        tiempo_total: paros.reduce((acc, paro) => acc + (paro.tiempoMinutos || 0), 0)
      };
    });

    // Sort by total time in descending order
    result.sort((a, b) => b.tiempo_total - a.tiempo_total);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching maintenance stops by system:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de paros por sistema' },
      { status: 500 }
    );
  }
} 