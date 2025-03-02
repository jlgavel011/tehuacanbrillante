import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

// GET /api/production-lines/subsystems/[id] - Get a specific subsystem
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    const subsystem = await prisma.subsystem.findUnique({
      where: {
        id,
      },
      include: {
        system: {
          include: {
            productionLine: true,
          },
        },
        subsubsystems: true,
      },
    });

    if (!subsystem) {
      return NextResponse.json(
        { error: "Subsistema no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(subsystem);
  } catch (error) {
    console.error("Error fetching subsystem:", error);
    return NextResponse.json(
      { error: "Error al obtener el subsistema" },
      { status: 500 }
    );
  }
}

// PUT /api/production-lines/subsystems/[id] - Update a subsystem
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;
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

    // Check if the subsystem exists
    const subsystem = await prisma.subsystem.findUnique({
      where: {
        id,
      },
    });

    if (!subsystem) {
      return NextResponse.json(
        { error: "Subsistema no encontrado" },
        { status: 404 }
      );
    }

    // Check if the system exists
    const system = await prisma.system.findUnique({
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

    // Check if another subsystem with this name already exists in the same system
    const existingSubsystem = await prisma.subsystem.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        systemId,
        id: {
          not: id,
        },
      },
    });

    if (existingSubsystem) {
      return NextResponse.json(
        { error: "Ya existe otro subsistema con este nombre en este sistema" },
        { status: 400 }
      );
    }

    const updatedSubsystem = await prisma.subsystem.update({
      where: {
        id,
      },
      data: {
        name,
        systemId,
      },
    });

    return NextResponse.json(updatedSubsystem);
  } catch (error) {
    console.error("Error updating subsystem:", error);
    return NextResponse.json(
      { error: "Error al actualizar el subsistema" },
      { status: 500 }
    );
  }
}

// DELETE /api/production-lines/subsystems/[id] - Delete a subsystem
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    // Check if the subsystem exists
    const subsystem = await prisma.subsystem.findUnique({
      where: {
        id,
      },
      include: {
        subsubsystems: true,
      },
    });

    if (!subsystem) {
      return NextResponse.json(
        { error: "Subsistema no encontrado" },
        { status: 404 }
      );
    }

    // Check if there are subsubsystems related to this subsystem
    if (subsystem.subsubsystems.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un subsistema que tiene sub-subsistemas asociados" },
        { status: 400 }
      );
    }

    // Delete the subsystem
    await prisma.subsystem.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subsystem:", error);
    return NextResponse.json(
      { error: "Error al eliminar el subsistema" },
      { status: 500 }
    );
  }
} 