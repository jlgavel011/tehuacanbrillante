import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay, parseISO, format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const date = parseISO(dateStr);
    const start = startOfDay(date);
    const end = endOfDay(date);

    // Get all production lines first
    const lines = await prisma.lineaProduccion.findMany({
      select: {
        id: true,
        nombre: true,
      },
    });

    // Get production data for each line
    const productionByLine = await Promise.all(
      lines.map(async (line) => {
        const productions = await prisma.produccion.findMany({
          where: {
            lineaProduccionId: line.id,
            fechaProduccion: {
              gte: start,
              lte: end,
            },
          },
          include: {
            producto: {
              include: {
                sabor: true,
                modelo: true,
                tamaño: true,
              },
            },
          },
          orderBy: {
            fechaProduccion: "asc",
          },
        });

        const totalCajas = productions.reduce(
          (sum, prod) => sum + prod.cajasProducidas,
          0
        );
        const cajasPlanificadas = productions.reduce(
          (sum, prod) => sum + prod.cajasPlanificadas,
          0
        );
        const cumplimiento = cajasPlanificadas > 0
          ? (totalCajas / cajasPlanificadas) * 100
          : 0;

        return {
          id: line.id,
          nombre: line.nombre,
          totalCajas,
          cajasPlanificadas,
          cumplimiento,
          producciones: productions.map((prod) => ({
            id: prod.id,
            fechaProduccion: prod.fechaProduccion,
            producto: `${prod.producto.sabor.nombre} ${prod.producto.modelo.nombre} ${prod.producto.tamaño.nombre}`,
            cajasProducidas: prod.cajasProducidas,
            cajasPlanificadas: prod.cajasPlanificadas,
            cumplimiento: prod.cajasPlanificadas > 0
              ? (prod.cajasProducidas / prod.cajasPlanificadas) * 100
              : 0,
          })),
        };
      })
    );

    // Sort lines by total boxes produced
    const sortedData = productionByLine.sort((a, b) => b.totalCajas - a.totalCajas);

    // Calculate totals for summary
    const totalProducido = sortedData.reduce((sum, line) => sum + line.totalCajas, 0);
    const totalPlanificado = sortedData.reduce((sum, line) => sum + line.cajasPlanificadas, 0);
    const cumplimientoPromedio = totalPlanificado > 0
      ? (totalProducido / totalPlanificado) * 100
      : 0;

    return NextResponse.json({
      data: sortedData,
      total: lines.length,
      page,
      totalPages: Math.ceil(lines.length / limit),
      date: dateStr,
      summary: {
        totalProducido,
        totalPlanificado,
        cumplimientoPromedio,
      },
    });
  } catch (error) {
    console.error("Error fetching production by line:", error);
    return NextResponse.json(
      { error: "Error al obtener la producción por línea" },
      { status: 500 }
    );
  }
} 