import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

// GET /api/production-lines/subsubsystems/[id] - Get a specific subsubsystem
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

    const subsubsystem = await prisma.subsubsystem.findUnique({
      where: {
        id,
      },
      include: {
        subsystem: {
          include: {
            system: {
              include: {
                productionLine: true,
              },
            },
          },
        },
      },
    });

    if (!subsubsystem) {
      return NextResponse.json(
        { error: "Sub-subsistema no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(subsubsystem);
  } catch (error) {
    console.error("Error fetching subsubsystem:", error);
    return NextResponse.json(
      { error: "Error al obtener el sub-subsistema" },
      { status: 500 }
    );
  }
}

// PUT /api/production-lines/subsubsystems/[id] - Update a subsubsystem
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

    // Check if the subsubsystem exists
    const subsubsystem = await prisma.subsubsystem.findUnique({
      where: {
        id,
      },
    });

    if (!subsubsystem) {
      return NextResponse.json(
        { error: "Sub-subsistema no encontrado" },
        { status: 404 }
      );
    }

    // Check if the subsystem exists
    const subsystem = await prisma.subsystem.findUnique({
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

    // Check if another subsubsystem with this name already exists in the same subsystem
    const existingSubsubsystem = await prisma.subsubsystem.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        subsystemId,
        id: {
          not: id,
        },
      },
    });

    if (existingSubsubsystem) {
      return NextResponse.json(
        { error: "Ya existe otro sub-subsistema con este nombre en este subsistema" },
        { status: 400 }
      );
    }

    const updatedSubsubsystem = await prisma.subsubsystem.update({
      where: {
        id,
      },
      data: {
        name,
        subsystemId,
      },
    });

    return NextResponse.json(updatedSubsubsystem);
  } catch (error) {
    console.error("Error updating subsubsystem:", error);
    return NextResponse.json(
      { error: "Error al actualizar el sub-subsistema" },
      { status: 500 }
    );
  }
}

// DELETE /api/production-lines/subsubsystems/[id] - Delete a subsubsystem
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

    // Check if the subsubsystem exists
    const subsubsystem = await prisma.subsubsystem.findUnique({
      where: {
        id,
      },
    });

    if (!subsubsystem) {
      return NextResponse.json(
        { error: "Sub-subsistema no encontrado" },
        { status: 404 }
      );
    }

    // Delete the subsubsystem
    await prisma.subsubsystem.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subsubsystem:", error);
    return NextResponse.json(
      { error: "Error al eliminar el sub-subsistema" },
      { status: 500 }
    );
  }
} 