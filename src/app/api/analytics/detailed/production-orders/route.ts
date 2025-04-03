import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Produccion, Producto, Sabor, Modelo, Tamaño, LineaProduccion } from "@prisma/client";

interface ProductionOrderWithRelations extends Produccion {
  producto: Producto & {
    sabor: Sabor;
    modelo: Modelo;
    tamaño: Tamaño;
  };
  lineaProduccion: LineaProduccion;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.produccion.count();

    // Get paginated production orders with related data
    const orders = await prisma.produccion.findMany({
      skip,
      take: limit,
      orderBy: {
        fechaProduccion: "desc",
      },
      include: {
        producto: {
          include: {
            sabor: true,
            modelo: true,
            tamaño: true,
          },
        },
        lineaProduccion: true,
      },
    }) as unknown as ProductionOrderWithRelations[];

    // Transform data to include compliance percentage
    const data = orders.map((order) => ({
      id: order.id,
      fechaProduccion: order.fechaProduccion,
      turno: order.turno,
      producto: {
        nombre: order.producto.nombre,
        sabor: {
          nombre: order.producto.sabor.nombre,
        },
        modelo: {
          nombre: order.producto.modelo.nombre,
        },
        tamaño: {
          nombre: order.producto.tamaño.nombre,
        },
      },
      linea: {
        nombre: order.lineaProduccion.nombre,
      },
      cajasProducidas: order.cajasProducidas,
      cajasPlanificadas: order.cajasPlanificadas,
      cumplimiento: order.cajasPlanificadas > 0 
        ? (order.cajasProducidas / order.cajasPlanificadas) * 100 
        : 0,
      estado: order.estado || "pendiente",
    }));

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching production orders:", error);
    return NextResponse.json(
      { error: "Error al obtener el historial de órdenes de producción" },
      { status: 500 }
    );
  }
} 