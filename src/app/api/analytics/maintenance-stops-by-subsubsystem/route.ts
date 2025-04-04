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

    // Get all subsubsystems with their maintenance stops
    const subsubsistemas = await prisma.subsubsistema.findMany({
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
        },
        subsistema: {
          select: {
            nombre: true,
            sistema: {
              select: {
                nombre: true,
                lineaProduccion: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Calculate totals for each subsubsystem
    const result = subsubsistemas.map(subsubsistema => ({
      name: subsubsistema.nombre,
      subsistema: subsubsistema.subsistema.nombre,
      sistema: subsubsistema.subsistema.sistema.nombre,
      linea: subsubsistema.subsistema.sistema.lineaProduccion.nombre,
      paros: subsubsistema.paros.length,
      tiempo_total: subsubsistema.paros.reduce((acc, paro) => acc + (paro.tiempoMinutos || 0), 0)
    }));

    // Sort by total time in descending order
    result.sort((a, b) => b.tiempo_total - a.tiempo_total);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching maintenance stops by subsubsystem:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos de paros por subsubsistema' },
      { status: 500 }
    );
  }
} 