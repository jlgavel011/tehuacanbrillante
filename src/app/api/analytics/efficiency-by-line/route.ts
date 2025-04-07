import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseISO, startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  try {
    // Get date range from query parameters
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: 'Se requieren los parámetros from y to' },
        { status: 400 }
      );
    }

    const fromDate = parseISO(fromParam);
    const toDate = parseISO(toParam);

    // Obtener todas las líneas de producción
    const lines = await prisma.lineaProduccion.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    // Para cada línea, calcular la eficiencia
    const efficiencyData = await Promise.all(
      lines.map(async (line) => {
        // Obtener producciones de esta línea en el rango de fechas
        const productions = await prisma.produccion.findMany({
          where: {
            lineaProduccionId: line.id,
            fechaProduccion: {
              gte: startOfDay(fromDate),
              lte: endOfDay(toDate),
            },
            cajasPlanificadas: {
              gt: 0 // Solo considerar producciones con planificación mayor a 0
            }
          },
          select: {
            cajasProducidas: true,
            cajasPlanificadas: true,
          },
        });

        // Calcular totales
        const totalProduced = productions.reduce((sum, prod) => sum + prod.cajasProducidas, 0);
        const totalPlanned = productions.reduce((sum, prod) => sum + prod.cajasPlanificadas, 0);
        
        // Calcular eficiencia
        const efficiency = totalPlanned > 0 ? totalProduced / totalPlanned : 0;

        return {
          name: line.nombre,
          efficiency,
          totalProduced,
          totalPlanned,
        };
      })
    );

    // Filtrar solo las líneas que tienen producción en el período
    const filteredData = efficiencyData.filter(item => item.totalPlanned > 0);

    // Calcular el promedio de eficiencia general
    const totalEfficiency = filteredData.reduce((sum, item) => sum + item.efficiency, 0);
    const averageEfficiency = filteredData.length > 0 ? totalEfficiency / filteredData.length : 0;

    // Ordenar por eficiencia descendente
    filteredData.sort((a, b) => b.efficiency - a.efficiency);

    return NextResponse.json({
      data: filteredData,
      averageEfficiency,
      totalLines: filteredData.length
    });
  } catch (error) {
    console.error('Error calculating efficiency by line:', error);
    return NextResponse.json(
      { error: 'Error al calcular la eficiencia por línea de producción' },
      { status: 500 }
    );
  }
} 