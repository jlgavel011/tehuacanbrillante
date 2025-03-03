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

    // Check if the order exists
    const order = await prisma.produccion.findUnique({
      where: {
        id: params.id,
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

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Update the order to mark it as started (set cajasProducidas to 1 if it's 0)
    const updatedOrder = await prisma.produccion.update({
      where: {
        id: params.id,
      },
      data: {
        cajasProducidas: order.cajasProducidas === 0 ? 1 : order.cajasProducidas,
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

    // Determine the order status
    let estado = "pendiente";
    if (updatedOrder.cajasProducidas >= updatedOrder.cajasPlanificadas) {
      estado = "completada";
    } else if (updatedOrder.cajasProducidas > 0) {
      estado = "en_progreso";
    }

    // Return the updated order with the enhanced product and status
    return NextResponse.json({
      ...updatedOrder,
      producto,
      estado,
    });
  } catch (error) {
    console.error("[ORDER_START_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 