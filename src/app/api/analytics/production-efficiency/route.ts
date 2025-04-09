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
    const comparisonPeriod = searchParams.get('comparisonPeriod') || 'previous_period';

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: 'Se requieren los parámetros from y to' },
        { status: 400 }
      );
    }

    const fromDate = parseISO(fromParam);
    const toDate = parseISO(toParam);

    // Calculate comparison date range
    let comparisonFromDate, comparisonToDate;
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

    if (comparisonPeriod === "previous_period") {
      // Período anterior del mismo tamaño
      comparisonToDate = new Date(fromDate);
      comparisonToDate.setDate(comparisonToDate.getDate() - 1);
      comparisonFromDate = new Date(comparisonToDate);
      comparisonFromDate.setDate(comparisonFromDate.getDate() - daysDiff + 1);
    } else {
      // Mismo período del año anterior
      comparisonFromDate = new Date(fromDate);
      comparisonFromDate.setFullYear(comparisonFromDate.getFullYear() - 1);
      comparisonToDate = new Date(toDate);
      comparisonToDate.setFullYear(comparisonToDate.getFullYear() - 1);
    }

    // Get all production data within the current date range
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

    // Get all production data within the comparison date range
    const comparisonProductions = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: startOfDay(comparisonFromDate),
          lte: endOfDay(comparisonToDate),
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

    // Agrupar por fecha y calcular la eficiencia diaria (período actual)
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

    // Calcular el promedio total de eficiencia (período actual)
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

    // Calcular la eficiencia para el período de comparación
    const comparisonEfficiencyByDay = new Map();
    
    comparisonProductions.forEach(production => {
      const dateStr = format(production.fechaProduccion, 'yyyy-MM-dd');
      
      if (!comparisonEfficiencyByDay.has(dateStr)) {
        comparisonEfficiencyByDay.set(dateStr, {
          totalProduced: 0,
          totalPlanned: 0,
        });
      }
      
      const dayData = comparisonEfficiencyByDay.get(dateStr);
      dayData.totalProduced += production.cajasProducidas;
      dayData.totalPlanned += production.cajasPlanificadas;
    });

    // Calcular el promedio total de eficiencia (período de comparación)
    let comparisonTotalEfficiency = 0;
    let comparisonTotalDays = 0;

    // Convertir a array de puntos de datos
    Array.from(comparisonEfficiencyByDay.entries()).forEach(([date, data]) => {
      const efficiency = data.totalPlanned > 0 ? data.totalProduced / data.totalPlanned : 0;
      comparisonTotalEfficiency += efficiency;
      comparisonTotalDays++;
    });

    const comparisonAverageEfficiency = comparisonTotalDays > 0 ? comparisonTotalEfficiency / comparisonTotalDays : 0;

    // Calcular el porcentaje de cambio
    const percentChange = comparisonAverageEfficiency > 0 
      ? ((averageEfficiency - comparisonAverageEfficiency) / comparisonAverageEfficiency) * 100 
      : 0;

    // Devolver los datos para el gráfico
    return NextResponse.json({
      data: efficiencyData,
      averageEfficiency: averageEfficiency,
      comparisonAverageEfficiency: comparisonAverageEfficiency,
      percentChange: Math.round(percentChange * 10) / 10, // Redondear a 1 decimal
      comparisonPeriod,
    });
  } catch (error) {
    console.error('Error calculating production efficiency:', error);
    return NextResponse.json(
      { error: 'Error al calcular la eficiencia de producción' },
      { status: 500 }
    );
  }
} 