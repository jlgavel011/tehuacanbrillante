import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get production data from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all production records for the last 30 days
    const productions = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        fechaProduccion: true,
        cajasProducidas: true,
        cajasPlanificadas: true,
      },
    });

    // Initialize hourly totals
    const hourlyTotals: Record<number, {
      hour: number;
      cajas_producidas: number;
      cajas_planificadas: number;
      cumplimiento: number;
    }> = {};

    // Initialize all hours with zero values
    for (let i = 0; i < 24; i++) {
      hourlyTotals[i] = {
        hour: i,
        cajas_producidas: 0,
        cajas_planificadas: 0,
        cumplimiento: 0,
      };
    }

    // Group productions by hour and calculate totals
    productions.forEach((prod) => {
      const hour = prod.fechaProduccion.getHours();
      
      hourlyTotals[hour].cajas_producidas += prod.cajasProducidas;
      hourlyTotals[hour].cajas_planificadas += prod.cajasPlanificadas;
      hourlyTotals[hour].cumplimiento = hourlyTotals[hour].cajas_planificadas > 0
        ? (hourlyTotals[hour].cajas_producidas / hourlyTotals[hour].cajas_planificadas) * 100
        : 0;
    });

    // Convert to array and sort by compliance percentage
    const result = Object.values(hourlyTotals).sort((a, b) => 
      b.cumplimiento - a.cumplimiento
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in most-efficient-hours:", error);
    return NextResponse.json(
      { error: "Error al obtener las horas más eficientes" },
      { status: 500 }
    );
  }
} 