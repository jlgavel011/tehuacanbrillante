import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay, parseISO, format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24"); // Default to 24 hours
    const dateStr = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
    const skip = (page - 1) * limit;

    const date = parseISO(dateStr);
    const start = startOfDay(date);
    const end = endOfDay(date);

    // Get total count for pagination
    const total = await prisma.produccion.count({
      where: {
        fechaProduccion: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get production data grouped by hour
    const productions = await prisma.produccion.findMany({
      where: {
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
        lineaProduccion: true,
      },
      orderBy: {
        fechaProduccion: "asc",
      },
    });

    // Group productions by hour
    const hourlyData = productions.reduce((acc, prod) => {
      const hour = format(prod.fechaProduccion, "HH:00");
      if (!acc[hour]) {
        acc[hour] = {
          hour,
          totalCajas: 0,
          cajasPlanificadas: 0,
          cumplimiento: 0,
          producciones: [],
        };
      }
      
      acc[hour].totalCajas += prod.cajasProducidas;
      acc[hour].cajasPlanificadas += prod.cajasPlanificadas;
      acc[hour].producciones.push({
        id: prod.id,
        producto: `${prod.producto.sabor.nombre} ${prod.producto.modelo.nombre} ${prod.producto.tamaño.nombre}`,
        linea: prod.lineaProduccion.nombre,
        cajasProducidas: prod.cajasProducidas,
        cajasPlanificadas: prod.cajasPlanificadas,
        cumplimiento: prod.cajasPlanificadas > 0 
          ? (prod.cajasProducidas / prod.cajasPlanificadas) * 100 
          : 0,
      });
      
      acc[hour].cumplimiento = acc[hour].cajasPlanificadas > 0
        ? (acc[hour].totalCajas / acc[hour].cajasPlanificadas) * 100
        : 0;

      return acc;
    }, {} as Record<string, any>);

    // Convert to array and sort by hour
    const data = Object.values(hourlyData);

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      date: dateStr,
    });
  } catch (error) {
    console.error("Error fetching hourly production:", error);
    return NextResponse.json(
      { error: "Error al obtener la producción por hora" },
      { status: 500 }
    );
  }
} 