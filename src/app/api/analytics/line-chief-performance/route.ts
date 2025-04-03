import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { User, Produccion } from "@prisma/client";

interface ChiefData {
  id: string;
  name: string;
}

interface ProductionData {
  cajasPlanificadas: number | null;
  cajasProducidas: number | null;
}

interface ChiefPerformance {
  name: string;
  cajas_producidas: number;
  cajas_planificadas: number;
  cumplimiento: number;
}

export async function GET() {
  try {
    // Get production chiefs (users with PRODUCTION_CHIEF role)
    const chiefs = await prisma.user.findMany({
      where: {
        role: "PRODUCTION_CHIEF",
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Get production data from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get production data for each chief
    const chiefPerformance = await Promise.all(
      chiefs.map(async (chief: ChiefData) => {
        const productions = await prisma.produccion.findMany({
          where: {
            fechaProduccion: {
              gte: thirtyDaysAgo,
            },
          },
          select: {
            cajasPlanificadas: true,
            cajasProducidas: true,
          },
        });

        const totalPlanned = productions.reduce(
          (sum: number, prod: ProductionData) => sum + (prod.cajasPlanificadas || 0),
          0
        );
        const totalProduced = productions.reduce(
          (sum: number, prod: ProductionData) => sum + (prod.cajasProducidas || 0),
          0
        );

        return {
          name: chief.name,
          cajas_producidas: totalProduced,
          cajas_planificadas: totalPlanned,
          cumplimiento: totalPlanned > 0 
            ? (totalProduced / totalPlanned) * 100 
            : 0,
        };
      })
    );

    // Sort by compliance percentage in descending order
    chiefPerformance.sort((a: ChiefPerformance, b: ChiefPerformance) => 
      b.cumplimiento - a.cumplimiento
    );

    return NextResponse.json(chiefPerformance);
  } catch (error) {
    console.error("Error in line-chief-performance:", error);
    return NextResponse.json(
      { error: "Error al obtener el rendimiento de los jefes de línea" },
      { status: 500 }
    );
  }
} 