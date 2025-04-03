import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Obtener los parámetros de fecha del request
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Se requieren los parámetros 'from' y 'to'" },
        { status: 400 }
      );
    }

    // Obtener la producción por modelo
    const produccionPorModelo = await prisma.produccion.groupBy({
      by: ["productoId"],
      _sum: {
        cajasProducidas: true,
      },
      where: {
        fechaProduccion: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
    });

    // Obtener los productos y sus modelos
    const productosIds = produccionPorModelo.map((item) => item.productoId);
    const productos = await prisma.producto.findMany({
      where: {
        id: {
          in: productosIds,
        },
      },
      include: {
        modelo: true,
      },
    });

    // Agrupar por modelo
    const produccionPorModeloMap = new Map<string, number>();
    produccionPorModelo.forEach((item) => {
      const producto = productos.find((p) => p.id === item.productoId);
      if (producto && item._sum.cajasProducidas) {
        const modeloNombre = producto.modelo.nombre;
        const cantidadActual = produccionPorModeloMap.get(modeloNombre) || 0;
        produccionPorModeloMap.set(
          modeloNombre,
          cantidadActual + item._sum.cajasProducidas
        );
      }
    });

    // Convertir a array y ordenar
    const resultado = Array.from(produccionPorModeloMap.entries()).map(
      ([nombre, cantidad]) => ({
        nombre,
        cantidad,
      })
    );

    // Ordenar por cantidad descendente
    resultado.sort((a, b) => b.cantidad - a.cantidad);

    // Calcular el total y los porcentajes
    const total = resultado.reduce((sum, item) => sum + item.cantidad, 0);
    const resultadoConPorcentaje = resultado.map((item) => ({
      ...item,
      porcentaje: (item.cantidad / total) * 100,
    }));

    return NextResponse.json(resultadoConPorcentaje);
  } catch (error) {
    console.error("Error al obtener los modelos más producidos:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos" },
      { status: 500 }
    );
  }
} 