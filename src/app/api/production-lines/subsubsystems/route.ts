import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

// GET /api/production-lines/subsubsystems - Get all subsubsystems
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const subsubsystems = await prisma.subsubsistema.findMany({
      orderBy: {
        nombre: 'asc',
      },
      include: {
        subsistema: {
          include: {
            sistema: {
              include: {
                lineaProduccion: true
              }
            }
          }
        }
      }
    });

    // Map the Spanish field names to English names expected by the frontend
    const mappedSubsubsystems = subsubsystems.map((subsubsystem: any) => ({
      id: subsubsystem.id,
      name: subsubsystem.nombre,
      subsystemId: subsubsystem.subsistemaId,
      subsystem: {
        id: subsubsystem.subsistema.id,
        name: subsubsystem.subsistema.nombre,
        systemId: subsubsystem.subsistema.sistemaId,
        system: {
          id: subsubsystem.subsistema.sistema.id,
          name: subsubsystem.subsistema.sistema.nombre,
          productionLineId: subsubsystem.subsistema.sistema.lineaProduccionId,
          productionLine: {
            id: subsubsystem.subsistema.sistema.lineaProduccion.id,
            name: subsubsystem.subsistema.sistema.lineaProduccion.nombre
          }
        }
      },
      createdAt: subsubsystem.createdAt ? subsubsystem.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: subsubsystem.updatedAt ? subsubsystem.updatedAt.toISOString() : new Date().toISOString()
    }));

    return NextResponse.json(mappedSubsubsystems);
  } catch (error) {
    console.error("Error fetching subsubsystems:", error);
    return NextResponse.json(
      { error: "Error al obtener los sub-subsistemas" },
      { status: 500 }
    );
  }
}

// POST /api/production-lines/subsubsystems - Create a new subsubsystem
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, subsystemId } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre del sub-subsistema es requerido" },
        { status: 400 }
      );
    }

    if (!subsystemId || typeof subsystemId !== "string") {
      return NextResponse.json(
        { error: "El subsistema es requerido" },
        { status: 400 }
      );
    }

    // Check if the subsystem exists
    const subsystem = await prisma.subsistema.findUnique({
      where: {
        id: subsystemId,
      },
    });

    if (!subsystem) {
      return NextResponse.json(
        { error: "Subsistema no encontrado" },
        { status: 404 }
      );
    }

    // Check if a subsubsystem with this name already exists in the subsystem
    const existingSubsubsystem = await prisma.subsubsistema.findFirst({
      where: {
        nombre: {
          equals: name,
          mode: 'insensitive',
        },
        subsistemaId: subsystemId,
      },
    });

    if (existingSubsubsystem) {
      return NextResponse.json(
        { error: "Ya existe un sub-subsistema con este nombre en este subsistema" },
        { status: 400 }
      );
    }

    const subsubsystem = await prisma.subsubsistema.create({
      data: {
        nombre: name,
        subsistemaId: subsystemId,
      },
      include: {
        subsistema: {
          include: {
            sistema: {
              include: {
                lineaProduccion: true
              }
            }
          }
        }
      }
    });

    // Map the Spanish field names to English names expected by the frontend
    const mappedSubsubsystem = {
      id: subsubsystem.id,
      name: subsubsystem.nombre,
      subsystemId: subsubsystem.subsistemaId,
      subsystem: {
        id: subsubsystem.subsistema.id,
        name: subsubsystem.subsistema.nombre,
        systemId: subsubsystem.subsistema.sistemaId,
        system: {
          id: subsubsystem.subsistema.sistema.id,
          name: subsubsystem.subsistema.sistema.nombre,
          productionLineId: subsubsystem.subsistema.sistema.lineaProduccionId,
          productionLine: {
            id: subsubsystem.subsistema.sistema.lineaProduccion.id,
            name: subsubsystem.subsistema.sistema.lineaProduccion.nombre
          }
        }
      },
      createdAt: subsubsystem.createdAt ? subsubsystem.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: subsubsystem.updatedAt ? subsubsystem.updatedAt.toISOString() : new Date().toISOString()
    };

    return NextResponse.json(mappedSubsubsystem, { status: 201 });
  } catch (error) {
    console.error("Error creating subsubsystem:", error);
    return NextResponse.json(
      { error: "Error al crear el sub-subsistema" },
      { status: 500 }
    );
  }
} 