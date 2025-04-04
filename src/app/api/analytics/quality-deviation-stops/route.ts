import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface StopStats {
  name: string;
  paros: number;
  tiempo_total: number;
}

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

    // 1. Verificar tipos de paro
    const tiposParos = await prisma.tipoParo.findMany();
    console.log("Tipos de paro encontrados:", tiposParos.map(t => t.nombre));

    // 2. Buscar específicamente el tipo Calidad
    const tipoParo = await prisma.tipoParo.findFirst({
      where: {
        nombre: "Calidad"
      }
    });

    if (!tipoParo) {
      return NextResponse.json(
        { error: "No se encontró el tipo de paro Calidad" },
        { status: 404 }
      );
    }
    console.log("Tipo de paro Calidad encontrado:", tipoParo);

    // 3. Verificar desviaciones de calidad
    const todasDesviaciones = await (prisma as any).desviacionCalidad.findMany();
    console.log("Total de desviaciones de calidad:", todasDesviaciones.length);
    console.log("Nombres de desviaciones:", todasDesviaciones.map((d: any) => d.nombre));

    // 4. Verificar paros en el período
    const totalParos = await prisma.paro.count({
      where: {
        tipoParoId: tipoParo.id,
        fechaInicio: {
          gte: new Date(from),
          lte: new Date(to)
        }
      }
    });
    console.log("Total de paros por calidad en el período:", totalParos);

    // 5. Obtener desviaciones con sus paros
    const desviaciones = await (prisma as any).desviacionCalidad.findMany({
      include: {
        paros: {
          where: {
            tipoParoId: tipoParo.id,
            fechaInicio: {
              gte: new Date(from),
              lte: new Date(to)
            }
          }
        }
      }
    });

    // Verificar la estructura de los datos
    console.log("Ejemplo de desviación con paros:", 
      desviaciones.length > 0 ? {
        nombre: desviaciones[0].nombre,
        totalParos: desviaciones[0].paros.length,
        ejemploParo: desviaciones[0].paros[0]
      } : "No hay desviaciones con paros");

    // Calculamos las estadísticas para cada desviación
    const result = desviaciones
      .map((desviacion: any) => ({
        name: desviacion.nombre,
        paros: desviacion.paros.length,
        tiempo_total: desviacion.paros.reduce((acc: number, paro: any) => acc + paro.tiempoMinutos, 0)
      }))
      .filter((stats: StopStats) => stats.paros > 0)
      .sort((a: StopStats, b: StopStats) => b.tiempo_total - a.tiempo_total);

    if (result.length === 0) {
      console.log("No se encontraron resultados después de procesar los datos");
    } else {
      console.log("Resultados encontrados:", result.length);
      console.log("Primer resultado:", result[0]);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error detallado:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos" },
      { status: 500 }
    );
  }
} 