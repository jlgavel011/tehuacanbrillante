import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

// GET /api/production-lines/[id] - Get a specific production line
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

    const productionLine = await prisma.productionLine.findUnique({
      where: {
        id,
      },
      include: {
        systems: true,
      },
    });

    if (!productionLine) {
      return NextResponse.json(
        { error: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(productionLine);
  } catch (error) {
    console.error("Error fetching production line:", error);
    return NextResponse.json(
      { error: "Error al obtener la línea de producción" },
      { status: 500 }
    );
  }
}

// PUT /api/production-lines/[id] - Update a production line
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
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre de la línea de producción es requerido" },
        { status: 400 }
      );
    }

    // Check if the production line exists
    const productionLine = await prisma.productionLine.findUnique({
      where: {
        id,
      },
    });

    if (!productionLine) {
      return NextResponse.json(
        { error: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }

    // Check if another production line with this name already exists
    const existingProductionLine = await prisma.productionLine.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        id: {
          not: id,
        },
      },
    });

    if (existingProductionLine) {
      return NextResponse.json(
        { error: "Ya existe otra línea de producción con este nombre" },
        { status: 400 }
      );
    }

    const updatedProductionLine = await prisma.productionLine.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    return NextResponse.json(updatedProductionLine);
  } catch (error) {
    console.error("Error updating production line:", error);
    return NextResponse.json(
      { error: "Error al actualizar la línea de producción" },
      { status: 500 }
    );
  }
}

// DELETE /api/production-lines/[id] - Delete a production line
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

    // Check if the production line exists
    const productionLine = await prisma.productionLine.findUnique({
      where: {
        id,
      },
      include: {
        systems: true,
      },
    });

    if (!productionLine) {
      return NextResponse.json(
        { error: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }

    // Check if there are systems related to this production line
    if (productionLine.systems.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una línea de producción que tiene sistemas asociados" },
        { status: 400 }
      );
    }

    // Delete the production line
    await prisma.productionLine.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting production line:", error);
    return NextResponse.json(
      { error: "Error al eliminar la línea de producción" },
      { status: 500 }
    );
  }
} 