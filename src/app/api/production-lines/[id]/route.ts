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

    const { id } = await Promise.resolve(params);

    const lineaProduccion = await prisma.lineaProduccion.findUnique({
      where: {
        id,
      },
      include: {
        sistemas: {
          include: {
            subsistemas: {
              include: {
                subsubsistemas: true,
              },
            },
          },
        },
      },
    });

    if (!lineaProduccion) {
      return NextResponse.json(
        { error: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(lineaProduccion);
  } catch (error) {
    console.error("Error obteniendo línea de producción:", error);
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

    // Validación básica de datos
    if (!body.nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Verificar si la línea de producción existe
    const existingLine = await prisma.lineaProduccion.findUnique({
      where: {
        id,
      },
    });

    if (!existingLine) {
      return NextResponse.json(
        { error: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar la línea de producción
    const updatedLine = await prisma.lineaProduccion.update({
      where: {
        id,
      },
      data: {
        nombre: body.nombre,
        descripcion: body.descripcion,
        ubicacion: body.ubicacion,
        estado: body.estado,
        fechaInstalacion: body.fechaInstalacion
          ? new Date(body.fechaInstalacion)
          : undefined,
        ultimoMantenimiento: body.ultimoMantenimiento
          ? new Date(body.ultimoMantenimiento)
          : undefined,
        proximoMantenimiento: body.proximoMantenimiento
          ? new Date(body.proximoMantenimiento)
          : undefined,
        capacidadProduccion: body.capacidadProduccion,
        horasOperacion: body.horasOperacion,
      },
    });

    return NextResponse.json(updatedLine);
  } catch (error) {
    console.error("Error actualizando línea de producción:", error);
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

    // Verificar si la línea de producción existe
    const existingLine = await prisma.lineaProduccion.findUnique({
      where: {
        id,
      },
    });

    if (!existingLine) {
      return NextResponse.json(
        { error: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar la línea de producción
    await prisma.lineaProduccion.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Línea de producción eliminada correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error eliminando línea de producción:", error);
    return NextResponse.json(
      { error: "Error al eliminar la línea de producción" },
      { status: 500 }
    );
  }
} 