import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface ProductionData {
  nombre: string;
  cantidad: number;
  modelo: string;
  sabor: string;
  tamaño: string;
  caja: number;
  porcentaje: number;
}

export async function GET(request: Request) {
  try {
    // Obtener los parámetros de fecha de la URL
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "Se requieren los parámetros 'from' y 'to'" },
        { status: 400 }
      );
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Validar que las fechas sean válidas
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { error: "Fechas inválidas" },
        { status: 400 }
      );
    }

    console.log("Buscando producciones desde:", from, "hasta:", to);

    // Primero verificar si hay producciones en el período
    const produccionesCount = await prisma.produccion.count({
      where: {
        fechaProduccion: {
          gte: from,
          lte: to
        },
        estado: {
          in: ["completada", "en_progreso"]
        }
      }
    });

    console.log("Número de producciones encontradas:", produccionesCount);

    if (produccionesCount === 0) {
      console.log("No se encontraron producciones en el período seleccionado");
      return NextResponse.json([]);
    }

    // Obtener los productos más producidos usando Prisma
    const productsData = await prisma.produccion.groupBy({
      by: ['productoId'],
      where: {
        fechaProduccion: {
          gte: from,
          lte: to
        },
        estado: {
          in: ["completada", "en_progreso"]
        }
      },
      _sum: {
        cajasProducidas: true
      },
      orderBy: {
        _sum: {
          cajasProducidas: 'desc'
        }
      },
      take: 100 // Tomamos más para luego filtrar por productos válidos
    });

    console.log("Datos agrupados:", productsData);

    // Obtener los detalles de los productos
    const productIds = productsData.map(p => p.productoId);
    const products = await prisma.producto.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      include: {
        modelo: true,
        sabor: true,
        tamaño: true,
        caja: true
      }
    });

    console.log("Detalles de productos:", products);

    // Combinar los datos
    const combinedData = productsData
      .map(prod => {
        const product = products.find(p => p.id === prod.productoId);
        if (!product) return null;

        return {
          nombre: product.nombre,
          modelo: product.modelo.nombre,
          sabor: product.sabor.nombre,
          tamaño: product.tamaño.nombre,
          caja: product.caja.numeroUnidades,
          cantidad: prod._sum.cajasProducidas || 0
        };
      })
      .filter((item): item is ProductionData => item !== null)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5); // Tomamos solo los top 5

    console.log("Datos combinados:", combinedData);

    if (combinedData.length === 0) {
      return NextResponse.json([]);
    }

    // Calcular el total para los porcentajes
    const totalProduction = combinedData.reduce(
      (sum, item) => sum + item.cantidad,
      0
    );

    // Agregar porcentajes al resultado
    const result = combinedData.map(item => ({
      ...item,
      porcentaje: (item.cantidad / totalProduction) * 100
    }));

    console.log("Resultado final:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in most-produced-products:", error);
    return NextResponse.json(
      { error: "Error al obtener los productos más producidos" },
      { status: 500 }
    );
  }
} 