import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addDays, parseISO } from "date-fns";

interface LineChiefWithBoxesData {
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

    // Get all production chiefs
    const productionChiefs = await prisma.user.findMany({
      where: {
        role: "PRODUCTION_CHIEF",
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Map to store aggregated data by chief
    const chiefsMap = new Map<string, {
      id: string;
      nombre: string;
      cajasPlanificadas: number;
      cajasProducidas: number;
      totalOrdenes: number;
    }>();

    // Initialize the map with all chiefs
    productionChiefs.forEach(chief => {
      chiefsMap.set(chief.id, {
        id: chief.id,
        nombre: chief.name,
        cajasPlanificadas: 0,
        cajasProducidas: 0,
        totalOrdenes: 0
      });
    });

    // Find completed production orders in the date range
    // In a real scenario, you would associate orders with chiefs
    // This is a simplified example
    const completedProductions = await prisma.produccion.findMany({
      where: {
        // Assuming we want to include orders that are completed or in progress
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
        cajasPlanificadas: true,
        cajasProducidas: true,
      },
    });

    // Since we don't have a direct association between chiefs and orders in this example,
    // we'll distribute the orders among chiefs for demonstration
    // In a real application, you would use the actual relationship between chiefs and orders
    const chiefIds = Array.from(chiefsMap.keys());
    
    if (chiefIds.length > 0) {
      completedProductions.forEach((production, index) => {
        const chiefId = chiefIds[index % chiefIds.length];
        const chief = chiefsMap.get(chiefId);
        
        if (chief) {
          chief.cajasPlanificadas += production.cajasPlanificadas;
          chief.cajasProducidas += production.cajasProducidas;
          chief.totalOrdenes += 1;
        }
      });
    }

    // Calculate percentages and format data
    let countPositive = 0;
    let countNegative = 0;
    let totalPromedioDesviacionPositiva = 0;
    let totalPromedioDesviacionNegativa = 0;

    const chiefsData: LineChiefWithBoxesData[] = Array.from(chiefsMap.values())
      .filter(chief => chief.totalOrdenes > 0) // Only include chiefs with orders
      .map(chief => {
        const diferencia = chief.cajasProducidas - chief.cajasPlanificadas;
        const diferenciaPorcentaje = chief.cajasPlanificadas > 0 
          ? ((chief.cajasProducidas - chief.cajasPlanificadas) / chief.cajasPlanificadas) * 100 
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
          id: chief.id,
          nombre: chief.nombre,
          cajasPlanificadas: chief.cajasPlanificadas,
          cajasProducidas: chief.cajasProducidas,
          diferencia,
          diferenciaPorcentaje: Math.round(diferenciaPorcentaje * 10) / 10,
          totalOrdenes: chief.totalOrdenes
        };
      });

    // Sort by total orders (most productive chiefs first)
    chiefsData.sort((a, b) => b.totalOrdenes - a.totalOrdenes);

    // Apply limit if specified
    const limitedData = limit ? chiefsData.slice(0, limit) : chiefsData;

    // Calculate averages
    const promedioDesviacionPositiva = countPositive > 0 ? totalPromedioDesviacionPositiva / countPositive : 0;
    const promedioDesviacionNegativa = countNegative > 0 ? totalPromedioDesviacionNegativa / countNegative : 0;

    return NextResponse.json({
      data: limitedData,
      totalJefes: chiefsData.length,
      promedioDesviacionPositiva: Math.round(promedioDesviacionPositiva * 10) / 10,
      promedioDesviacionNegativa: Math.round(promedioDesviacionNegativa * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching planned vs produced boxes by line chief:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 