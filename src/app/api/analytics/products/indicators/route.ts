import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { startDate, endDate } = await req.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Se requieren fechas de inicio y fin" },
        { status: 400 }
      );
    }

    // Convertir las fechas de string a Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Obtener totales de producción
    const produccion = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: start,
          lte: end,
        },
      },
      include: {
        producto: {
          include: {
            modelo: true,
            sabor: true,
            caja: true,
          },
        },
      },
    });

    // Calcular totales
    const uniqueProducts = new Set<string>();
    const uniqueFlavors = new Set<string>();
    const uniqueModels = new Set<string>();
    const uniqueBoxTypes = new Set<string>();

    type ProduccionWithRelations = Prisma.ProduccionGetPayload<{
      include: {
        producto: {
          include: {
            modelo: true;
            sabor: true;
            caja: true;
          };
        };
      };
    }>;

    produccion.forEach((p: ProduccionWithRelations) => {
      uniqueProducts.add(p.productoId);
      uniqueFlavors.add(p.producto.saborId);
      uniqueModels.add(p.producto.modeloId);
      uniqueBoxTypes.add(p.producto.cajaId);
    });

    return NextResponse.json({
      totalProducts: uniqueProducts.size,
      totalFlavors: uniqueFlavors.size,
      totalModels: uniqueModels.size,
      totalBoxes: uniqueBoxTypes.size,
    });
  } catch (error) {
    console.error("Error en el endpoint de indicadores:", error);
    return NextResponse.json(
      { error: "Error al obtener los indicadores" },
      { status: 500 }
    );
  }
} 