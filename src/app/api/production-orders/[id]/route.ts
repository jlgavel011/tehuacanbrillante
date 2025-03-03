import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("[ORDER_GET] Request for order ID:", params.id);
    
    // Temporarily skip authentication check for debugging
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   console.log("[ORDER_GET] Unauthorized - No session");
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }
    // console.log("[ORDER_GET] Session user:", session.user);
    
    const { searchParams } = new URL(request.url);
    const includeParos = searchParams.get("include") === "paros";
    
    console.log("[ORDER_GET] Include paros:", includeParos);

    const order = await prisma.produccion.findUnique({
      where: {
        id: params.id,
      },
      include: {
        lineaProduccion: {
          include: {
            sistemas: {
              include: {
                subsistemas: {
                  include: {
                    subsubsistemas: true,
                  },
                },
              },
            },
          },
        },
        producto: {
          include: {
            lineasProduccion: {
              where: {
                lineaProduccionId: { not: undefined },
              },
            },
          },
        },
        ...(includeParos && {
          paros: {
            include: {
              tipoParo: true,
              subsistema: true,
              subsubsistema: true,
            },
          },
        }),
      },
    });

    if (!order) {
      console.log("[ORDER_GET] Order not found for ID:", params.id);
      return new NextResponse("Order not found", { status: 404 });
    }

    console.log("[ORDER_GET] Order found:", order.id, order.numeroOrden);
    
    // Find the velocidadProduccion for this product on this production line
    const productoEnLinea = order.producto.lineasProduccion.find(
      (pl: any) => pl.lineaProduccionId === order.lineaProduccionId
    );

    // Add the velocidadProduccion to the product
    const producto = {
      ...order.producto,
      velocidadProduccion: productoEnLinea?.velocidadProduccion || null,
    };

    // Determine the order status
    let estado = "pendiente";
    if (order.cajasProducidas >= order.cajasPlanificadas) {
      estado = "completada";
    } else if (order.cajasProducidas > 0) {
      estado = "en_progreso";
    }

    console.log("[ORDER_GET] Returning order with status:", estado);
    
    // Return the order with the enhanced product and status
    return NextResponse.json({
      ...order,
      producto,
      estado,
    });
  } catch (error) {
    console.error("[ORDER_GET] Error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 