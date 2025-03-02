import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/paros - Get all downtime events
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const lineaId = searchParams.get("lineaId");
    const tipoParoId = searchParams.get("tipoParoId");
    const produccionId = searchParams.get("produccionId");
    const subsistemaId = searchParams.get("subsistemaId");
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");
    
    // Build query conditions
    const where: any = {};
    
    if (lineaId) {
      where.lineaProduccionId = lineaId;
    }
    
    if (tipoParoId) {
      where.tipoParoId = tipoParoId;
    }
    
    if (produccionId) {
      where.produccionId = produccionId;
    }
    
    if (subsistemaId) {
      where.subsistemaId = subsistemaId;
    }
    
    if (fechaInicio && fechaFin) {
      where.fechaInicio = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      };
    } else if (fechaInicio) {
      where.fechaInicio = {
        gte: new Date(fechaInicio),
      };
    } else if (fechaFin) {
      where.fechaInicio = {
        lte: new Date(fechaFin),
      };
    }
    
    const paros = await prisma.paro.findMany({
      where,
      include: {
        tipoParo: true,
        lineaProduccion: true,
        produccion: {
          include: {
            producto: true,
          },
        },
        subsistema: true,
        subsubsistema: true,
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });
    
    return NextResponse.json(paros);
  } catch (error) {
    console.error("Error al obtener paros:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener paros" }),
      { status: 500 }
    );
  }
}

// POST /api/paros - Create a new downtime event
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.tiempoMinutos || !body.tipoParoId || !body.produccionId || !body.lineaProduccionId) {
      return new NextResponse(
        JSON.stringify({ error: "Faltan campos obligatorios" }),
        { status: 400 }
      );
    }
    
    // For maintenance paros, subsistema and/or subsubsistema are required
    if (body.tipoParoId === "mantenimiento" && !body.subsistemaId) {
      return new NextResponse(
        JSON.stringify({ error: "Para paros de mantenimiento, se requiere al menos un subsistema" }),
        { status: 400 }
      );
    }
    
    const paro = await prisma.paro.create({
      data: {
        tiempoMinutos: body.tiempoMinutos,
        tipoParoId: body.tipoParoId,
        produccionId: body.produccionId,
        lineaProduccionId: body.lineaProduccionId,
        subsistemaId: body.subsistemaId || null,
        subsubsistemaId: body.subsubsistemaId || null,
        descripcion: body.descripcion || null,
        fechaInicio: body.fechaInicio ? new Date(body.fechaInicio) : new Date(),
        fechaFin: body.fechaFin ? new Date(body.fechaFin) : null,
      },
      include: {
        tipoParo: true,
        lineaProduccion: true,
        produccion: true,
        subsistema: true,
        subsubsistema: true,
      },
    });
    
    return NextResponse.json(paro, { status: 201 });
  } catch (error) {
    console.error("Error al crear paro:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al crear paro" }),
      { status: 500 }
    );
  }
} 