import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface BoxData {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
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

    // Obtener todos los productos con sus cajas
    const products = await prisma.producto.findMany({
      include: {
        caja: true,
      },
    });

    // Obtener datos de producción
    const productsData = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        productoId: true,
        cajasProducidas: true,
      },
    });

    // Agrupar por tipo de caja
    const boxMap = new Map<string, number>();

    productsData.forEach((prod) => {
      const product = products.find((p) => p.id === prod.productoId);
      if (!product?.caja?.nombre) return;

      const boxName = product.caja.nombre;
      const currentAmount = boxMap.get(boxName) || 0;
      boxMap.set(boxName, currentAmount + prod.cajasProducidas);
    });

    // Convertir a array y calcular porcentajes
    const totalProduction = Array.from(boxMap.values()).reduce((a, b) => a + b, 0);

    const result: BoxData[] = Array.from(boxMap.entries())
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: (cantidad / totalProduction) * 100,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in most-produced-boxes:", error);
    return NextResponse.json(
      { error: "Error al obtener las cajas más producidas" },
      { status: 500 }
    );
  }
} 