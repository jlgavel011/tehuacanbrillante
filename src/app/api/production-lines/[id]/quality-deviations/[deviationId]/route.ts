import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// PUT /api/production-lines/[id]/quality-deviations/[deviationId]
export async function PUT(
  request: Request,
  { params }: { params: { id: string; deviationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre } = body;

    if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre de la desviación es requerido" },
        { status: 400 }
      );
    }

    // Check if the quality deviation exists and belongs to the production line
    const existingDeviation = await prisma.desviacionCalidad.findFirst({
      where: {
        id: params.deviationId,
        lineaProduccionId: params.id,
      },
    });

    if (!existingDeviation) {
      return NextResponse.json(
        { error: "Desviación de calidad no encontrada" },
        { status: 404 }
      );
    }

    // Check if another quality deviation with this name already exists in the production line
    const duplicateDeviation = await prisma.desviacionCalidad.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive',
        },
        lineaProduccionId: params.id,
        id: {
          not: params.deviationId,
        },
      },
    });

    if (duplicateDeviation) {
      return NextResponse.json(
        { error: "Ya existe una desviación de calidad con este nombre en esta línea de producción" },
        { status: 400 }
      );
    }

    const updatedDeviation = await prisma.desviacionCalidad.update({
      where: {
        id: params.deviationId,
      },
      data: {
        nombre,
      },
    });

    return NextResponse.json(updatedDeviation);
  } catch (error) {
    console.error("Error updating quality deviation:", error);
    return NextResponse.json(
      { error: "Error al actualizar la desviación de calidad" },
      { status: 500 }
    );
  }
}

// DELETE /api/production-lines/[id]/quality-deviations/[deviationId]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; deviationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check if the quality deviation exists and belongs to the production line
    const existingDeviation = await prisma.desviacionCalidad.findFirst({
      where: {
        id: params.deviationId,
        lineaProduccionId: params.id,
      },
    });

    if (!existingDeviation) {
      return NextResponse.json(
        { error: "Desviación de calidad no encontrada" },
        { status: 404 }
      );
    }

    await prisma.desviacionCalidad.delete({
      where: {
        id: params.deviationId,
      },
    });

    return NextResponse.json({ message: "Desviación de calidad eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting quality deviation:", error);
    return NextResponse.json(
      { error: "Error al eliminar la desviación de calidad" },
      { status: 500 }
    );
  }
} 