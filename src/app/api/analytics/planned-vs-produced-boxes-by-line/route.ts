import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addDays, parseISO } from "date-fns";

interface LineWithBoxesData {
  id: string;
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

    // Get all production lines
    const productionLines = await prisma.lineaProduccion.findMany({
      select: {
        id: true,
        nombre: true,
      },
    });

    // Map to store aggregated data by line
    const linesMap = new Map<string, {
      id: string;
      nombre: string;
      cajasPlanificadas: number;
      cajasProducidas: number;
      totalOrdenes: number;
    }>();

    // Initialize the map with all lines
    productionLines.forEach(line => {
      linesMap.set(line.id, {
        id: line.id,
        nombre: line.nombre,
        cajasPlanificadas: 0,
        cajasProducidas: 0,
        totalOrdenes: 0
      });
    });

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
      include: {
        lineaProduccion: true,
      },
    });

    // Aggregate data by line
    completedProductions.forEach(production => {
      const lineId = production.lineaProduccionId;
      const line = linesMap.get(lineId);
      
      if (line) {
        line.cajasPlanificadas += production.cajasPlanificadas;
        line.cajasProducidas += production.cajasProducidas;
        line.totalOrdenes += 1;
      }
    });

    // Calculate percentages and format data
    let countPositive = 0;
    let countNegative = 0;
    let totalPromedioDesviacionPositiva = 0;
    let totalPromedioDesviacionNegativa = 0;

    const linesData: LineWithBoxesData[] = Array.from(linesMap.values())
      .filter(line => line.totalOrdenes > 0) // Only include lines with orders
      .map(line => {
        const diferencia = line.cajasProducidas - line.cajasPlanificadas;
        const diferenciaPorcentaje = line.cajasPlanificadas > 0 
          ? ((line.cajasProducidas - line.cajasPlanificadas) / line.cajasPlanificadas) * 100 
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
          id: line.id,
          nombre: line.nombre,
          cajasPlanificadas: line.cajasPlanificadas,
          cajasProducidas: line.cajasProducidas,
          diferencia,
          diferenciaPorcentaje: Math.round(diferenciaPorcentaje * 10) / 10,
          totalOrdenes: line.totalOrdenes
        };
      });

    // Sort by total boxes produced (most productive lines first)
    linesData.sort((a, b) => b.cajasProducidas - a.cajasProducidas);

    // Apply limit if specified
    const limitedData = limit ? linesData.slice(0, limit) : linesData;

    // Calculate averages
    const promedioDesviacionPositiva = countPositive > 0 ? totalPromedioDesviacionPositiva / countPositive : 0;
    const promedioDesviacionNegativa = countNegative > 0 ? totalPromedioDesviacionNegativa / countNegative : 0;

    return NextResponse.json({
      data: limitedData,
      totalLineas: linesData.length,
      promedioDesviacionPositiva: Math.round(promedioDesviacionPositiva * 10) / 10,
      promedioDesviacionNegativa: Math.round(promedioDesviacionNegativa * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching planned vs produced boxes by line:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 