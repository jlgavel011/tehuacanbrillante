import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Obtener el total de productos únicos
    const totalProducts = await prisma.producto.count();

    // Obtener el total de sabores únicos
    const uniqueFlavors = await prisma.producto.findMany({
      select: {
        saborId: true,
      },
      distinct: ["saborId"],
    });
    const totalFlavors = uniqueFlavors.length;

    // Obtener el total de modelos únicos
    const uniqueModels = await prisma.producto.findMany({
      select: {
        modeloId: true,
      },
      distinct: ["modeloId"],
    });
    const totalModels = uniqueModels.length;

    // Obtener el total de tipos de cajas únicos
    const uniqueBoxes = await prisma.producto.findMany({
      select: {
        cajaId: true,
      },
      distinct: ["cajaId"],
    });
    const totalBoxes = uniqueBoxes.length;

    return NextResponse.json({
      totalProducts,
      totalFlavors,
      totalModels,
      totalBoxes,
    });
  } catch (error) {
    console.error("Error al obtener los indicadores:", error);
    return NextResponse.json(
      { error: "Error al obtener los indicadores" },
      { status: 500 }
    );
  }
} 