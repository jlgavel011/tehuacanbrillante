import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseISO, format, addDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

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

    // Get all production data within the date range
    const productions = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: startOfDay(fromDate),
          lte: endOfDay(toDate),
        },
        cajasPlanificadas: {
          gt: 0  // Solo considerar producciones con planificación mayor a 0
        }
      },
      select: {
        fechaProduccion: true,
        cajasProducidas: true,
        cajasPlanificadas: true,
      },
      orderBy: {
        fechaProduccion: 'asc',
      },
    });

    // Agrupar por fecha y calcular la eficiencia diaria
    const efficiencyByDay = new Map();
    
    productions.forEach(production => {
      const dateStr = format(production.fechaProduccion, 'yyyy-MM-dd');
      
      if (!efficiencyByDay.has(dateStr)) {
        efficiencyByDay.set(dateStr, {
          totalProduced: 0,
          totalPlanned: 0,
        });
      }
      
      const dayData = efficiencyByDay.get(dateStr);
      dayData.totalProduced += production.cajasProducidas;
      dayData.totalPlanned += production.cajasPlanificadas;
    });

    // Calcular el promedio total de eficiencia
    let totalEfficiency = 0;
    let totalDays = 0;

    // Convertir a array de puntos de datos
    const efficiencyData = Array.from(efficiencyByDay.entries()).map(([date, data]) => {
      const efficiency = data.totalPlanned > 0 ? data.totalProduced / data.totalPlanned : 0;
      totalEfficiency += efficiency;
      totalDays++;
      
      // Formatear la fecha para mostrar en el gráfico
      const displayDate = format(parseISO(date), 'dd MMM', { locale: es });
      
      return {
        date: displayDate,
        efficiency: efficiency,
        totalProduced: data.totalProduced,
        totalPlanned: data.totalPlanned
      };
    });

    const averageEfficiency = totalDays > 0 ? totalEfficiency / totalDays : 0;

    // Devolver los datos para el gráfico
    return NextResponse.json({
      data: efficiencyData,
      averageEfficiency: averageEfficiency,
    });
  } catch (error) {
    console.error('Error calculating production efficiency:', error);
    return NextResponse.json(
      { error: 'Error al calcular la eficiencia de producción' },
      { status: 500 }
    );
  }
} 