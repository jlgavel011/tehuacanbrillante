import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay, parseISO, format } from "date-fns";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const tipoParoId = searchParams.get("tipoParoId");
    const lineaId = searchParams.get("lineaId");
    const skip = (page - 1) * limit;

    const date = parseISO(dateStr);
    const start = startOfDay(date);
    const end = endOfDay(date);

    // Build where clause based on filters
    const where: Prisma.ParoWhereInput = {
      fechaInicio: {
        gte: start,
        lte: end,
      },
      ...(tipoParoId && { tipoParoId }),
      ...(lineaId && { lineaProduccionId: lineaId }),
    };

    // Get total count for pagination
    const total = await prisma.paro.count({ where });

    // Get stops data with relations
    const stops = await prisma.paro.findMany({
      where,
      select: {
        id: true,
        fechaInicio: true,
        fechaFin: true,
        tiempoMinutos: true,
        descripcion: true,
        lineaProduccion: {
          select: {
            nombre: true,
          },
        },
        tipoParo: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaInicio: "desc",
      },
      skip,
      take: limit,
    });

    // Calculate summary statistics
    const summary = await prisma.paro.aggregate({
      where,
      _count: {
        _all: true,
      },
      _sum: {
        tiempoMinutos: true,
      },
      _avg: {
        tiempoMinutos: true,
      },
      _max: {
        tiempoMinutos: true,
      },
      _min: {
        tiempoMinutos: true,
      },
    });

    // Get distribution by type
    const typeDistribution = await prisma.paro.groupBy({
      where,
      by: ["tipoParoId"],
      _count: true,
      _sum: {
        tiempoMinutos: true,
      },
    });

    // Get tipo paro names for the distribution
    const tiposParoMap = new Map(
      (await prisma.tipoParo.findMany()).map(tipo => [tipo.id, tipo.nombre])
    );

    return NextResponse.json({
      data: stops.map(stop => ({
        id: stop.id,
        fechaInicio: stop.fechaInicio,
        fechaFin: stop.fechaFin,
        tiempoMinutos: stop.tiempoMinutos,
        tipo: stop.tipoParo.nombre,
        descripcion: stop.descripcion,
        linea: stop.lineaProduccion.nombre,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      date: dateStr,
      summary: {
        totalStops: summary._count._all,
        totalTime: summary._sum.tiempoMinutos || 0,
        averageTime: summary._avg.tiempoMinutos || 0,
        maxTime: summary._max.tiempoMinutos || 0,
        minTime: summary._min.tiempoMinutos || 0,
      },
      distribution: typeDistribution.map(type => ({
        tipo: tiposParoMap.get(type.tipoParoId) || "Desconocido",
        count: type._count,
        totalTime: type._sum.tiempoMinutos || 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching stops registry:", error);
    return NextResponse.json(
      { error: "Error al obtener el registro de paros" },
      { status: 500 }
    );
  }
} 