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

    // Get all production data within the date range, grouped by shift
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
        turno: true,
        cajasProducidas: true,
        cajasPlanificadas: true,
      },
    });

    // Agrupar por turno y calcular la eficiencia
    const shiftData = new Map<number, { produced: number; planned: number }>();
    
    productions.forEach(production => {
      if (!shiftData.has(production.turno)) {
        shiftData.set(production.turno, {
          produced: 0,
          planned: 0,
        });
      }
      
      const data = shiftData.get(production.turno);
      if (data) {
        data.produced += production.cajasProducidas;
        data.planned += production.cajasPlanificadas;
      }
    });

    // Convertir a array de datos formateados para el frontend
    const efficiencyData = Array.from(shiftData.entries()).map(([shift, data]) => {
      const efficiency = data.planned > 0 ? data.produced / data.planned : 0;
      
      return {
        name: `Turno ${shift}`,
        efficiency: efficiency,
        producedCases: data.produced,
        plannedCases: data.planned
      };
    });

    // Ordenar por eficiencia descendente
    efficiencyData.sort((a, b) => b.efficiency - a.efficiency);

    // Calcular eficiencia promedio global
    const totalProduced = efficiencyData.reduce((sum, item) => sum + item.producedCases, 0);
    const totalPlanned = efficiencyData.reduce((sum, item) => sum + item.plannedCases, 0);
    const averageEfficiency = totalPlanned > 0 ? totalProduced / totalPlanned : 0;

    // Devolver los datos para el gráfico
    return NextResponse.json({
      data: efficiencyData,
      averageEfficiency: averageEfficiency,
      totalProduced: totalProduced,
      totalPlanned: totalPlanned
    });
  } catch (error) {
    console.error('Error calculating shift efficiency:', error);
    return NextResponse.json(
      { error: 'Error al calcular la eficiencia por turno' },
      { status: 500 }
    );
  }
} 