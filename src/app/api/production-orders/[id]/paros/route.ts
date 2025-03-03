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
    const { 
      tiempoMinutos, 
      tipoParoId, 
      lineaProduccionId, 
      subsistemaId, 
      subsubsistemaId, 
      sistemaId,
      descripcion 
    } = body;

    // Validate required fields
    if (!tiempoMinutos || !tipoParoId || !lineaProduccionId) {
      return new NextResponse("Missing required fields", { status: 400 });
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

    // Create the paro record
    const paro = await prisma.paro.create({
      data: {
        tiempoMinutos,
        tipoParoId,
        produccionId: params.id,
        lineaProduccionId,
        subsistemaId: subsistemaId || null,
        subsubsistemaId: subsubsistemaId || null,
        descripcion: descripcion || null,
        fechaInicio: new Date(),
        fechaFin: new Date(), // Since we're recording past paros, set fechaFin to now
      },
      include: {
        tipoParo: true,
        subsistema: true,
        subsubsistema: true,
      },
    });

    return NextResponse.json(paro);
  } catch (error) {
    console.error("[PARO_CREATE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all paros for the production order
    const paros = await prisma.paro.findMany({
      where: {
        produccionId: params.id,
      },
      include: {
        tipoParo: true,
        subsistema: true,
        subsubsistema: true,
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });

    return NextResponse.json(paros);
  } catch (error) {
    console.error("[PAROS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 