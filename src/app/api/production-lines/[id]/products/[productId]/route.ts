import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// PATCH: Update the production speed of a product in a production line
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const lineaId = params.id;
    const productoId = params.productId;
    const { velocidadProduccion } = await req.json();

    console.log("PATCH request received:", { lineaId, productoId, velocidadProduccion });

    // Verify the production line exists
    const lineaProduccion = await prisma.lineaProduccion.findUnique({
      where: { id: lineaId },
    });

    if (!lineaProduccion) {
      return NextResponse.json(
        { message: "Línea de producción no encontrada" },
        { status: 404 }
      );
    }

    // Find the relation
    const relation = await prisma.productoEnLinea.findFirst({
      where: {
        lineaProduccionId: lineaId,
        productoId,
      },
    });

    if (!relation) {
      return NextResponse.json(
        { message: "El producto no está asignado a esta línea de producción" },
        { status: 404 }
      );
    }

    console.log("Found relation:", relation);

    // Parse the velocidadProduccion value
    let speedValue = null;
    if (velocidadProduccion !== null && velocidadProduccion !== undefined) {
      speedValue = typeof velocidadProduccion === 'string' 
        ? parseFloat(velocidadProduccion) 
        : velocidadProduccion;
      
      if (isNaN(speedValue)) {
        return NextResponse.json(
          { message: "La velocidad de producción en cajas/hora debe ser un número válido" },
          { status: 400 }
        );
      }
    }

    // Update the production speed using a simpler approach
    try {
      // For MongoDB, we need to use a raw query to update the field
      // First, let's try to update using Prisma's raw query capabilities
      await prisma.$runCommandRaw({
        update: "productos_en_lineas",
        updates: [
          {
            q: { _id: { $oid: relation.id } },
            u: { $set: { velocidadProduccion: speedValue } }
          }
        ]
      });

      // Return success
      return NextResponse.json({
        success: true,
        message: "Velocidad de producción en cajas/hora actualizada con éxito",
        data: {
          id: relation.id,
          productoId,
          lineaProduccionId: lineaId,
          velocidadProduccion: speedValue
        }
      });
    } catch (updateError: any) {
      console.error("Database error updating relation:", updateError);
      
      return NextResponse.json(
        { 
          message: "Error al actualizar la velocidad de producción en cajas/hora",
          details: updateError.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error updating production speed:", error);
    return NextResponse.json(
      { 
        message: "Error al actualizar la velocidad de producción en cajas/hora",
        details: error.message
      },
      { status: 500 }
    );
  }
} 