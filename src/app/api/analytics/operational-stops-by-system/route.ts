import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDateRangeFromSearchParams } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    // 1. Obtener el rango de fechas
    const { searchParams } = new URL(request.url);
    const { from, to } = getDateRangeFromSearchParams(searchParams);

    if (!from || !to) {
      return NextResponse.json(
        { error: "Rango de fechas no proporcionado" },
        { status: 400 }
      );
    }

    // Ajustar las fechas para incluir el día completo
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // 2. Obtener el tipo de paro "Operación"
    const tipoOperacion = await prisma.tipoParo.findFirst({
      where: {
        nombre: "Operación"
      }
    });

    if (!tipoOperacion) {
      return NextResponse.json(
        { error: "No se encontró el tipo de paro Operación" },
        { status: 404 }
      );
    }

    // 3. Obtener todos los sistemas
    const sistemas = await prisma.sistema.findMany();
    const resultado = [];

    // 4. Para cada sistema, obtener sus paros operacionales
    for (const sistema of sistemas) {
      const paros = await prisma.paro.findMany({
        where: {
          AND: [
            {
              fechaInicio: {
                gte: fromDate,
                lte: toDate
              }
            },
            {
              tipoParoId: tipoOperacion.id
            },
            {
              sistemaId: sistema.id
            }
          ]
        }
      });

      if (paros.length > 0) {
        const tiempoTotal = paros.reduce((total, paro) => total + paro.tiempoMinutos, 0);
        resultado.push({
          name: sistema.nombre,
          paros: paros.length,
          tiempo_total: tiempoTotal
        });
      }
    }

    // 5. Ordenar por tiempo total descendente
    resultado.sort((a, b) => b.tiempo_total - a.tiempo_total);

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error al obtener paros por sistema:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
} 