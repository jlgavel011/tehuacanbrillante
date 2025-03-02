import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

// GET /api/production-lines/subsystems - Get all subsystems
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const subsystems = await prisma.subsistema.findMany({
      orderBy: {
        nombre: 'asc',
      },
      include: {
        sistema: {
          include: {
            lineaProduccion: true
          }
        }
      }
    });

    // Map the Spanish field names to English names expected by the frontend
    const mappedSubsystems = subsystems.map((subsystem: any) => ({
      id: subsystem.id,
      name: subsystem.nombre,
      systemId: subsystem.sistemaId,
      system: {
        id: subsystem.sistema.id,
        name: subsystem.sistema.nombre,
        productionLineId: subsystem.sistema.lineaProduccionId,
        productionLine: {
          id: subsystem.sistema.lineaProduccion.id,
          name: subsystem.sistema.lineaProduccion.nombre
        }
      },
      createdAt: subsystem.createdAt ? subsystem.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: subsystem.updatedAt ? subsystem.updatedAt.toISOString() : new Date().toISOString()
    }));

    return NextResponse.json(mappedSubsystems);
  } catch (error) {
    console.error("Error fetching subsystems:", error);
    return NextResponse.json(
      { error: "Error al obtener los subsistemas" },
      { status: 500 }
    );
  }
}

// POST /api/production-lines/subsystems - Create a new subsystem
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, systemId } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre del subsistema es requerido" },
        { status: 400 }
      );
    }

    if (!systemId || typeof systemId !== "string") {
      return NextResponse.json(
        { error: "El sistema es requerido" },
        { status: 400 }
      );
    }

    // Check if the system exists
    const system = await prisma.sistema.findUnique({
      where: {
        id: systemId,
      },
    });

    if (!system) {
      return NextResponse.json(
        { error: "Sistema no encontrado" },
        { status: 404 }
      );
    }

    // Check if a subsystem with this name already exists in the system
    const existingSubsystem = await prisma.subsistema.findFirst({
      where: {
        nombre: {
          equals: name,
          mode: 'insensitive',
        },
        sistemaId: systemId,
      },
    });

    if (existingSubsystem) {
      return NextResponse.json(
        { error: "Ya existe un subsistema con este nombre en este sistema" },
        { status: 400 }
      );
    }

    const subsystem = await prisma.subsistema.create({
      data: {
        nombre: name,
        sistemaId: systemId,
      },
      include: {
        sistema: {
          include: {
            lineaProduccion: true
          }
        }
      }
    });

    // Map the Spanish field names to English names expected by the frontend
    const mappedSubsystem = {
      id: subsystem.id,
      name: subsystem.nombre,
      systemId: subsystem.sistemaId,
      system: {
        id: subsystem.sistema.id,
        name: subsystem.sistema.nombre,
        productionLineId: subsystem.sistema.lineaProduccionId,
        productionLine: {
          id: subsystem.sistema.lineaProduccion.id,
          name: subsystem.sistema.lineaProduccion.nombre
        }
      },
      createdAt: subsystem.createdAt ? subsystem.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: subsystem.updatedAt ? subsystem.updatedAt.toISOString() : new Date().toISOString()
    };

    return NextResponse.json(mappedSubsystem, { status: 201 });
  } catch (error) {
    console.error("Error creating subsystem:", error);
    return NextResponse.json(
      { error: "Error al crear el subsistema" },
      { status: 500 }
    );
  }
} 