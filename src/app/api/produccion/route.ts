import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const producciones = await prisma.produccion.findMany({
      include: {
        lineaProduccion: true,
        producto: {
          include: {
            modelo: true,
            sabor: true,
            tamaño: true,
          },
        },
      },
      orderBy: {
        fechaProduccion: 'desc',
      },
    });

    return NextResponse.json(producciones);
  } catch (error) {
    console.error("Error al obtener producciones:", error);
    return NextResponse.json(
      { error: "Error al obtener las producciones" },
      { status: 500 }
    );
  }
} 