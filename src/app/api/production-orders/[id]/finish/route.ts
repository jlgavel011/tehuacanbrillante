import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const orderId = params.id;
    const { cajasProducidas, paros, isFinalizingProduction = false } = await request.json();

    console.log("Received request data:", { orderId, cajasProducidas, parosCount: paros?.length, isFinalizingProduction });

    if (!orderId) {
      return NextResponse.json(
        { message: "ID de orden no proporcionado" },
        { status: 400 }
      );
    }

    // First get the current order details
    const order = await prisma.produccion.findUnique({
      where: { id: orderId },
      include: {
        lineaProduccion: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Orden de producción no encontrada" },
        { status: 404 }
      );
    }

    console.log("Found order:", { orderId: order.id, lineaProduccionId: order.lineaProduccion.id });

    try {
      // Update the order with the new total production
      const updatedOrder = await prisma.produccion.update({
        where: { id: orderId },
        data: {
          cajasProducidas: cajasProducidas,
          estado: isFinalizingProduction ? "completada" : "en_progreso",
          lastUpdateTime: new Date()
        },
      });

      console.log("Updated order:", { orderId: updatedOrder.id, newCajasProducidas: updatedOrder.cajasProducidas });

      // Register all paros if they exist
      if (paros && paros.length > 0) {
        console.log("Processing paros:", { count: paros.length });
        
        for (const paro of paros) {
          try {
            console.log("Creating paro with data:", {
              tiempoMinutos: paro.tiempoMinutos,
              tipoParoId: paro.tipoParoId,
              subsistemaId: paro.subsistemaId,
              subsubsistemaId: paro.subsubsistemaId,
              desviacionCalidadId: paro.desviacionCalidadId,
              materiaPrimaId: paro.materiaPrimaId
            });

            // Validar si tenemos una materia prima válida
            const hasValidMateriaPrima = paro.materiaPrimaId && paro.materiaPrimaId !== "placeholder";

            const createData: Prisma.ParoCreateInput = {
              tiempoMinutos: paro.tiempoMinutos,
              descripcion: paro.descripcion || "",
              fechaInicio: new Date(),
              fechaFin: new Date(),
              tipoParo: {
                connect: { id: paro.tipoParoId }
              },
              produccion: {
                connect: { id: orderId }
              },
              lineaProduccion: {
                connect: { id: order.lineaProduccion.id }
              },
              ...(paro.subsistemaId && paro.subsistemaId !== "placeholder" && {
                subsistema: {
                  connect: { id: paro.subsistemaId }
                }
              }),
              ...(paro.subsubsistemaId && paro.subsubsistemaId !== "placeholder" && {
                subsubsistema: {
                  connect: { id: paro.subsubsistemaId }
                }
              }),
              ...(paro.desviacionCalidadId && paro.desviacionCalidadId !== "placeholder" && {
                desviacionCalidad: {
                  connect: { id: paro.desviacionCalidadId }
                }
              }),
              ...(hasValidMateriaPrima && {
                materiaPrima: {
                  connect: { id: paro.materiaPrimaId }
                }
              })
            };

            console.log("Creating paro with data:", JSON.stringify(createData, null, 2));

            const createdParo = await prisma.paro.create({
              data: createData
            });

            console.log("Created paro with ID:", createdParo.id);
          } catch (error: any) {
            console.error("Error creating paro:", error);
            throw new Error(`Error al crear paro: ${error?.message || 'Error desconocido'}`);
          }
        }
      }

      return NextResponse.json(
        { 
          message: isFinalizingProduction ? "Producción finalizada correctamente" : "Producción actualizada correctamente", 
          order: updatedOrder 
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Database operation error:", error);
      return NextResponse.json(
        { message: `Error en operación de base de datos: ${error?.message || 'Error desconocido'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in finish endpoint:", error);
    return NextResponse.json(
      { message: `Error al finalizar la producción: ${error?.message || 'Error desconocido'}` },
      { status: 500 }
    );
  }
} 