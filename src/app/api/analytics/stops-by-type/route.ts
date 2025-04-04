import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Se requieren los parámetros 'from' y 'to'" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Obtener los datos de paros agrupados por tipo
    const parosPorTipo = await prisma.paro.groupBy({
      by: ["tipoParoId"],
      _count: {
        _all: true,
      },
      _sum: {
        tiempoMinutos: true,
      },
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    // Obtener los tipos de paro para mapear los IDs a nombres
    const tiposParos = await prisma.tipoParo.findMany();
    const tiposMap = new Map(tiposParos.map(tipo => [tipo.id, tipo.nombre]));

    // Calcular totales para porcentajes
    const totalParos = parosPorTipo.reduce((acc, item) => acc + (item._count?._all || 0), 0);
    const totalTiempo = parosPorTipo.reduce((acc, item) => acc + (item._sum?.tiempoMinutos || 0), 0);

    // Mapear los resultados al formato requerido
    const resultados = parosPorTipo.map((item) => {
      const tipoNombre = tiposMap.get(item.tipoParoId) || "Desconocido";
      return {
        name: tipoNombre,
        cantidad: item._count?._all || 0,
        tiempo_total: item._sum?.tiempoMinutos || 0,
        porcentaje: totalParos > 0 
          ? ((item._count?._all || 0) / totalParos) * 100 
          : 0,
      };
    });

    return NextResponse.json(resultados);
  } catch (error) {
    console.error("Error al obtener datos de paros por tipo:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
} 