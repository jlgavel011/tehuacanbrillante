import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

// GET /api/production-lines/systems/[id] - Get a specific system
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

    const system = await prisma.system.findUnique({
      where: {
        id,
      },
      include: {
        productionLine: true,
        subsystems: true,
      },
    });

    if (!system) {
      return NextResponse.json(
        { error: "Sistema no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(system);
  } catch (error) {
    console.error("Error fetching system:", error);
    return NextResponse.json(
      { error: "Error al obtener el sistema" },
      { status: 500 }
    );
  }
}

// PUT /api/production-lines/systems/[id] - Update a system
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

    // Check if the system exists
    const system = await prisma.system.findUnique({
      where: {
        id,
      },
    });

    if (!system) {
      return NextResponse.json(
        { error: "Sistema no encontrado" },
        { status: 404 }
      );
    }

    // Check if the production line exists
    const productionLine = await prisma.productionLine.findUnique({
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

    // Check if another system with this name already exists in the same production line
    const existingSystem = await prisma.system.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        productionLineId,
        id: {
          not: id,
        },
      },
    });

    if (existingSystem) {
      return NextResponse.json(
        { error: "Ya existe otro sistema con este nombre en esta línea de producción" },
        { status: 400 }
      );
    }

    const updatedSystem = await prisma.system.update({
      where: {
        id,
      },
      data: {
        name,
        productionLineId,
      },
    });

    return NextResponse.json(updatedSystem);
  } catch (error) {
    console.error("Error updating system:", error);
    return NextResponse.json(
      { error: "Error al actualizar el sistema" },
      { status: 500 }
    );
  }
}

// DELETE /api/production-lines/systems/[id] - Delete a system
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

    // Check if the system exists
    const system = await prisma.system.findUnique({
      where: {
        id,
      },
      include: {
        subsystems: true,
      },
    });

    if (!system) {
      return NextResponse.json(
        { error: "Sistema no encontrado" },
        { status: 404 }
      );
    }

    // Check if there are subsystems related to this system
    if (system.subsystems.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un sistema que tiene subsistemas asociados" },
        { status: 400 }
      );
    }

    // Delete the system
    await prisma.system.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting system:", error);
    return NextResponse.json(
      { error: "Error al eliminar el sistema" },
      { status: 500 }
    );
  }
} 