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

    const subsubsystem = await prisma.subsubsistema.findUnique({
      where: {
        id,
      },
      include: {
        subsistema: {
          include: {
            sistema: {
              include: {
                lineaProduccion: true,
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
    console.error("Error obteniendo sub-subsistema:", error);
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

    // Validación básica de datos
    if (!body.nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Verificar si el sub-subsistema existe
    const existingSubsubsystem = await prisma.subsubsistema.findUnique({
      where: {
        id,
      },
    });

    if (!existingSubsubsystem) {
      return NextResponse.json(
        { error: "Sub-subsistema no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el sub-subsistema
    const updatedSubsubsystem = await prisma.subsubsistema.update({
      where: {
        id,
      },
      data: {
        nombre: body.nombre,
        descripcion: body.descripcion,
        estado: body.estado,
        criticidad: body.criticidad,
        fechaInstalacion: body.fechaInstalacion
          ? new Date(body.fechaInstalacion)
          : undefined,
        ultimoMantenimiento: body.ultimoMantenimiento
          ? new Date(body.ultimoMantenimiento)
          : undefined,
        proximoMantenimiento: body.proximoMantenimiento
          ? new Date(body.proximoMantenimiento)
          : undefined,
        subsistemaId: body.subsystemId,
      },
    });

    return NextResponse.json(updatedSubsubsystem);
  } catch (error) {
    console.error("Error actualizando sub-subsistema:", error);
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

    // Verificar si el sub-subsistema existe
    const existingSubsubsystem = await prisma.subsubsistema.findUnique({
      where: {
        id,
      },
      include: {
        paros: {
          select: {
            id: true,
          },
          take: 1, // Solo necesitamos saber si hay al menos uno
        },
      },
    });

    if (!existingSubsubsystem) {
      return NextResponse.json(
        { error: "Sub-subsistema no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si hay paros asociados al sub-subsistema
    if (existingSubsubsystem.paros && existingSubsubsystem.paros.length > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar el sub-subsistema porque hay paros asociados. Elimine los paros primero o desasócielos de este sub-subsistema." 
        },
        { status: 400 }
      );
    }

    // Eliminar el sub-subsistema
    await prisma.subsubsistema.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Sub-subsistema eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error eliminando sub-subsistema:", error);
    return NextResponse.json(
      { error: "Error al eliminar el sub-subsistema" },
      { status: 500 }
    );
  }
} 