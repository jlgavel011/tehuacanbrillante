import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { cajasProducidas } = body;

    if (typeof cajasProducidas !== "number" || cajasProducidas < 0) {
      return new NextResponse("Invalid cajasProducidas value", { status: 400 });
    }

    // Check if the order exists
    const order = await prisma.produccion.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Determine the order status
    let estado = "pendiente";
    if (cajasProducidas >= order.cajasPlanificadas) {
      estado = "completada";
    } else if (cajasProducidas > 0) {
      estado = "en_progreso";
    }

    // Update the order with the new cajasProducidas value and lastUpdateTime
    const updatedOrder = await prisma.produccion.update({
      where: {
        id: params.id,
      },
      data: {
        cajasProducidas,
        lastUpdateTime: new Date(),
        estado
      },
      include: {
        lineaProduccion: true,
        producto: {
          include: {
            lineasProduccion: {
              where: {
                lineaProduccionId: { not: undefined },
              },
            },
          },
        },
      },
    });

    // Find the velocidadProduccion for this product on this production line
    const productoEnLinea = updatedOrder.producto.lineasProduccion.find(
      (pl: any) => pl.lineaProduccionId === updatedOrder.lineaProduccionId
    );

    // Add the velocidadProduccion to the product
    const producto = {
      ...updatedOrder.producto,
      velocidadProduccion: productoEnLinea?.velocidadProduccion || null,
    };

    // Return the updated order with the enhanced product
    return NextResponse.json({
      ...updatedOrder,
      producto
    });
  } catch (error) {
    console.error("[ORDER_UPDATE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 