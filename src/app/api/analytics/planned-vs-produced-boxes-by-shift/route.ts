import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addDays, parseISO } from "date-fns";

interface ShiftWithBoxesData {
  id: number;
  nombre: string;
  cajasPlanificadas: number;
  cajasProducidas: number;
  diferencia: number;
  diferenciaPorcentaje: number;
  totalOrdenes: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    if (!from || !to) {
      return NextResponse.json(
        { error: "Los parámetros 'from' y 'to' son requeridos" },
        { status: 400 }
      );
    }

    const fromDate = parseISO(from);
    const toDate = addDays(parseISO(to), 1); // Include the end date

    // Inicializar datos para los tres turnos
    const shiftsMap = new Map<number, {
      id: number;
      nombre: string;
      cajasPlanificadas: number;
      cajasProducidas: number;
      totalOrdenes: number;
    }>();

    // Inicializar los tres turnos (1, 2, 3)
    for (let i = 1; i <= 3; i++) {
      shiftsMap.set(i, {
        id: i,
        nombre: `Turno ${i}`,
        cajasPlanificadas: 0,
        cajasProducidas: 0,
        totalOrdenes: 0
      });
    }

    // Find completed production orders in the date range
    const completedProductions = await prisma.produccion.findMany({
      where: {
        estado: {
          in: ["completada", "en_progreso", "FINALIZADO"] 
        },
        fechaProduccion: {
          gte: fromDate,
          lt: toDate,
        },
      },
      select: {
        id: true,
        turno: true,
        cajasPlanificadas: true,
        cajasProducidas: true,
      },
    });

    // Aggregate data by shift
    completedProductions.forEach(production => {
      const shiftId = production.turno;
      const shift = shiftsMap.get(shiftId);
      
      if (shift) {
        shift.cajasPlanificadas += production.cajasPlanificadas;
        shift.cajasProducidas += production.cajasProducidas;
        shift.totalOrdenes += 1;
      }
    });

    // Calculate percentages and format data
    let countPositive = 0;
    let countNegative = 0;
    let totalPromedioDesviacionPositiva = 0;
    let totalPromedioDesviacionNegativa = 0;

    const shiftsData: ShiftWithBoxesData[] = Array.from(shiftsMap.values())
      .filter(shift => shift.totalOrdenes > 0) // Only include shifts with orders
      .map(shift => {
        const diferencia = shift.cajasProducidas - shift.cajasPlanificadas;
        const diferenciaPorcentaje = shift.cajasPlanificadas > 0 
          ? ((shift.cajasProducidas - shift.cajasPlanificadas) / shift.cajasPlanificadas) * 100 
          : 0;
        
        // Track positive and negative deviations for average calculations
        if (diferenciaPorcentaje > 0) {
          countPositive++;
          totalPromedioDesviacionPositiva += diferenciaPorcentaje;
        } else {
          countNegative++;
          totalPromedioDesviacionNegativa += diferenciaPorcentaje;
        }
        
        return {
          id: shift.id,
          nombre: shift.nombre,
          cajasPlanificadas: shift.cajasPlanificadas,
          cajasProducidas: shift.cajasProducidas,
          diferencia,
          diferenciaPorcentaje: Math.round(diferenciaPorcentaje * 10) / 10,
          totalOrdenes: shift.totalOrdenes
        };
      });

    // Sort by total boxes produced (most productive shifts first)
    shiftsData.sort((a, b) => b.cajasProducidas - a.cajasProducidas);

    // Apply limit if specified
    const limitedData = limit ? shiftsData.slice(0, limit) : shiftsData;

    // Calculate averages
    const promedioDesviacionPositiva = countPositive > 0 ? totalPromedioDesviacionPositiva / countPositive : 0;
    const promedioDesviacionNegativa = countNegative > 0 ? totalPromedioDesviacionNegativa / countNegative : 0;

    return NextResponse.json({
      data: limitedData,
      totalTurnos: shiftsData.length,
      promedioDesviacionPositiva: Math.round(promedioDesviacionPositiva * 10) / 10,
      promedioDesviacionNegativa: Math.round(promedioDesviacionNegativa * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching planned vs produced boxes by shift:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 