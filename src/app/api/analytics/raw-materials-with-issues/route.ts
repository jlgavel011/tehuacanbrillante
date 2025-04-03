import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RawMaterialStats {
  nombre: string;
  cantidad_paros: number;
  tiempo_total: number;
  impacto_porcentaje: number;
}

interface AggregationResult {
  nombre: string;
  cantidad_paros: number;
  tiempo_total: number;
}

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const paros = await prisma.paro.aggregateRaw({
      pipeline: [
        {
          $match: {
            fechaInicio: { $gte: thirtyDaysAgo },
            materiaPrimaId: { $ne: null }
          }
        },
        {
          $lookup: {
            from: "materias_primas",
            localField: "materiaPrimaId",
            foreignField: "_id",
            as: "materiaPrima"
          }
        },
        {
          $unwind: "$materiaPrima"
        },
        {
          $group: {
            _id: "$materiaPrima.nombre",
            cantidad_paros: { $sum: 1 },
            tiempo_total: { $sum: "$tiempoMinutos" }
          }
        },
        {
          $project: {
            _id: 0,
            nombre: "$_id",
            cantidad_paros: 1,
            tiempo_total: 1
          }
        }
      ]
    });

    const stats = (paros as unknown) as AggregationResult[];
    const totalTime = stats.reduce((sum, stat) => sum + stat.tiempo_total, 0);

    const result = stats
      .map(stat => ({
        ...stat,
        impacto_porcentaje: totalTime > 0
          ? (stat.tiempo_total / totalTime) * 100
          : 0,
      }))
      .sort((a, b) => b.tiempo_total - a.tiempo_total)
      .slice(0, 10);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in raw-materials-with-issues:", error);
    return NextResponse.json(
      { error: "Error al obtener las materias primas con problemas" },
      { status: 500 }
    );
  }
} 