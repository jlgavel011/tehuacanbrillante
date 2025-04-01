import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MateriaPrima, ProductoMateriaPrima } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productoId = params.id;

    // Obtener las materias primas asociadas al producto
    const productoMateriasPrimas = await prisma.productoMateriaPrima.findMany({
      where: {
        productoId: productoId,
      },
      include: {
        materiaPrima: true,
      },
    });

    // Extraer solo las materias primas del resultado
    const materiasPrimas = productoMateriasPrimas.map((pm: ProductoMateriaPrima & { materiaPrima: MateriaPrima }) => pm.materiaPrima);

    return NextResponse.json(materiasPrimas);
  } catch (error) {
    console.error("Error fetching materias primas:", error);
    return NextResponse.json(
      { error: "Error al obtener las materias primas" },
      { status: 500 }
    );
  }
} 