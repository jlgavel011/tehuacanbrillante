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
      desviacionCalidadId,
      descripcion 
    } = body;

    // Validate required fields
    if (!tiempoMinutos || !tipoParoId || !lineaProduccionId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get the tipo de paro
    const tipoParo = await prisma.tipoParo.findUnique({
      where: { id: tipoParoId }
    });

    if (!tipoParo) {
      return new NextResponse("Tipo de paro not found", { status: 404 });
    }

    // For maintenance and operation stops, sistema is required
    if ((tipoParo.nombre === "Mantenimiento" || tipoParo.nombre === "Operación") && !sistemaId) {
      return new NextResponse(
        `Para paros de ${tipoParo.nombre.toLowerCase()}, se requiere especificar el sistema`,
        { status: 400 }
      );
    }

    // For maintenance stops, subsistema is also required
    if (tipoParo.nombre === "Mantenimiento" && !subsistemaId) {
      return new NextResponse("Para paros de mantenimiento, se requiere especificar el subsistema", { status: 400 });
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

    // Handle dates properly
    const now = new Date();
    const mexicoDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
    
    // Create UTC dates for the start and end of the day
    const fechaInicio = new Date(Date.UTC(
      mexicoDate.getFullYear(),
      mexicoDate.getMonth(),
      mexicoDate.getDate()
    ));
    
    const fechaFin = new Date(Date.UTC(
      mexicoDate.getFullYear(),
      mexicoDate.getMonth(),
      mexicoDate.getDate()
    ));
    fechaFin.setUTCHours(23, 59, 59, 999);

    // Create the paro record
    const paro = await prisma.paro.create({
      data: {
        tiempoMinutos,
        tipoParoId,
        produccionId: params.id,
        lineaProduccionId,
        sistemaId: sistemaId || null,
        subsistemaId: subsistemaId || null,
        subsubsistemaId: subsubsistemaId || null,
        desviacionCalidadId: desviacionCalidadId || null,
        descripcion: descripcion || null,
        fechaInicio,
        fechaFin,
      },
      include: {
        tipoParo: true,
        sistema: true,
        subsistema: true,
        subsubsistema: true,
        desviacionCalidad: true,
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
        sistema: true,
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