import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

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
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Update the order status to "en_progreso" using Prisma client's update method
    const updatedOrder = await prisma.produccion.update({
      where: { id: params.id },
      data: {
        estado: "en_progreso",
        lastUpdateTime: new Date() // Also update the last update time
      },
    });

    return NextResponse.json({
      message: "Production order reopened successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("[ORDER_REOPEN_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 