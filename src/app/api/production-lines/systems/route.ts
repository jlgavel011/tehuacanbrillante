import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/production-lines/systems - Get all systems
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const productionLineId = url.searchParams.get('productionLineId');

    // Add filter if productionLineId is provided
    const whereClause = productionLineId 
      ? { lineaProduccionId: productionLineId }
      : {};

    const systems = await prisma.sistema.findMany({
      where: whereClause,
      orderBy: {
        nombre: 'asc',
      },
      include: {
        lineaProduccion: true,
      },
    });

    // Map the Spanish field names to English names expected by the frontend
    const mappedSystems = systems.map((system: any) => ({
      id: system.id,
      name: system.nombre,
      productionLineId: system.lineaProduccionId,
      productionLine: {
        id: system.lineaProduccion.id,
        name: system.lineaProduccion.nombre
      },
      createdAt: system.createdAt ? system.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: system.updatedAt ? system.updatedAt.toISOString() : new Date().toISOString()
    }));

    return NextResponse.json(mappedSystems);
  } catch (error) {
    console.error("Error fetching systems:", error);
    return NextResponse.json(
      { error: "Error al obtener los sistemas" },
      { status: 500 }
    );
  }
}

// POST /api/production-lines/systems - Create a new system
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, productionLineId } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre del sistema es requerido" },
        { status: 400 }
      );
    }

    if (!productionLineId || typeof productionLineId !== "string") {
      return NextResponse.json(
        { error: "La línea de producción es requerida" },
        { status: 400 }
      );
    }

    // Check if the production line exists
    const productionLine = await prisma.lineaProduccion.findUnique({
      where: {
        id: productionLineId,
      },
    });

    if (!productionLine) {
      return NextResponse.json(
        { error: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }

    // Check if a system with this name already exists in the production line
    const existingSystem = await prisma.sistema.findFirst({
      where: {
        nombre: {
          equals: name,
          mode: 'insensitive',
        },
        lineaProduccionId: productionLineId,
      },
    });

    if (existingSystem) {
      return NextResponse.json(
        { error: "Ya existe un sistema con este nombre en esta línea de producción" },
        { status: 400 }
      );
    }

    const system = await prisma.sistema.create({
      data: {
        nombre: name,
        lineaProduccionId: productionLineId,
      },
      include: {
        lineaProduccion: true
      }
    });

    // Map the Spanish field names to English names expected by the frontend
    const mappedSystem = {
      id: system.id,
      name: system.nombre,
      productionLineId: system.lineaProduccionId,
      productionLine: {
        id: system.lineaProduccion.id,
        name: system.lineaProduccion.nombre
      },
      createdAt: system.createdAt ? system.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: system.updatedAt ? system.updatedAt.toISOString() : new Date().toISOString()
    };

    return NextResponse.json(mappedSystem, { status: 201 });
  } catch (error) {
    console.error("Error creating system:", error);
    return NextResponse.json(
      { error: "Error al crear el sistema" },
      { status: 500 }
    );
  }
} 