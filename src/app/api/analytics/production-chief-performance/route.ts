import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculatePercentage } from "@/components/analytics/utils/dataTransform";

export async function GET() {
  try {
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

    // Get production data for each chief
    const chiefPerformance = await Promise.all(
      productionChiefs.map(async (chief) => {
        const productions = await prisma.produccion.aggregate({
          where: {
            estado: "completada",
            // Add date filter if needed
            // fechaProduccion: {
            //   gte: startDate,
            //   lte: endDate,
            // },
          },
          _sum: {
            cajasProducidas: true,
            cajasPlanificadas: true,
          },
        });

        const cajasProducidas = productions._sum.cajasProducidas || 0;
        const cajasPlanificadas = productions._sum.cajasPlanificadas || 0;

        return {
          name: chief.name,
          cajas_producidas: cajasProducidas,
          cajas_planificadas: cajasPlanificadas,
          cumplimiento: calculatePercentage(cajasProducidas, cajasPlanificadas),
        };
      })
    );

    // Sort by compliance percentage
    chiefPerformance.sort((a, b) => b.cumplimiento - a.cumplimiento);

    return NextResponse.json(chiefPerformance);
  } catch (error) {
    console.error("Error fetching production chief performance:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de rendimiento" },
      { status: 500 }
    );
  }
} 