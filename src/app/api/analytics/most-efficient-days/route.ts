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

    // Group productions by date and calculate totals
    const dailyProduction = productions.reduce((acc, prod) => {
      const date = prod.fechaProduccion.toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          cajas_producidas: 0,
          cajas_planificadas: 0,
          cumplimiento: 0,
        };
      }

      acc[date].cajas_producidas += prod.cajasProducidas;
      acc[date].cajas_planificadas += prod.cajasPlanificadas;
      acc[date].cumplimiento = acc[date].cajas_planificadas > 0
        ? (acc[date].cajas_producidas / acc[date].cajas_planificadas) * 100
        : 0;

      return acc;
    }, {} as Record<string, {
      date: string;
      cajas_producidas: number;
      cajas_planificadas: number;
      cumplimiento: number;
    }>);

    // Convert to array and sort by compliance percentage
    const result = Object.values(dailyProduction).sort((a, b) => 
      b.cumplimiento - a.cumplimiento
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in most-efficient-days:", error);
    return NextResponse.json(
      { error: "Error al obtener los días más eficientes" },
      { status: 500 }
    );
  }
} 