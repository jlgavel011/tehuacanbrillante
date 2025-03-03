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
        system: true,
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
    console.error("Error obteniendo subsistema:", error);
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

    // Validación básica de datos
    if (!body.nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Verificar si el subsistema existe
    const existingSubsystem = await prisma.subsystem.findUnique({
      where: {
        id,
      },
    });

    if (!existingSubsystem) {
      return NextResponse.json(
        { error: "Subsistema no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el subsistema
    const updatedSubsystem = await prisma.subsystem.update({
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
        systemId: body.systemId,
      },
    });

    return NextResponse.json(updatedSubsystem);
  } catch (error) {
    console.error("Error actualizando subsistema:", error);
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

    // Verificar si el subsistema existe
    const existingSubsystem = await prisma.subsystem.findUnique({
      where: {
        id,
      },
    });

    if (!existingSubsystem) {
      return NextResponse.json(
        { error: "Subsistema no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el subsistema
    await prisma.subsystem.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Subsistema eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error eliminando subsistema:", error);
    return NextResponse.json(
      { error: "Error al eliminar el subsistema" },
      { status: 500 }
    );
  }
} 