import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

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
    let requestData;
    
    try {
      requestData = await request.json();
    } catch (error) {
      console.error("Error parsing request JSON:", error);
      return NextResponse.json(
        { message: "Error al procesar los datos de la solicitud. Formato JSON inválido." },
        { status: 400 }
      );
    }
    
    const { 
      cajasProducidas, 
      paros, 
      isFinalizingProduction = false,
      tiempoTranscurridoHoras = 0
    } = requestData;

    // Validate required fields
    if (typeof cajasProducidas !== 'number' && isNaN(parseInt(cajasProducidas))) {
      return NextResponse.json(
        { message: "El número de cajas producidas es requerido y debe ser un número válido" },
        { status: 400 }
      );
    }

    // Validate paros if provided
    if (paros && !Array.isArray(paros)) {
      return NextResponse.json(
        { message: "El formato de paros es inválido, debe ser un array" },
        { status: 400 }
      );
    }

    console.log("Received request data:", { 
      orderId, 
      cajasProducidas, 
      parosCount: paros?.length, 
      isFinalizingProduction,
      tiempoTranscurridoHoras
    });

    if (!orderId) {
      return NextResponse.json(
        { message: "ID de orden no proporcionado" },
        { status: 400 }
      );
    }

    // First get the current order details
    try {
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
        // Calculate the increment in production since the last update
        const cajasPrevias = order.cajasProducidas || 0;
        const parsedCajasProducidas = typeof cajasProducidas === 'number' ? cajasProducidas : parseInt(cajasProducidas);
        const incrementoCajas = parsedCajasProducidas - cajasPrevias;
        
        console.log("Production increment calculation:", {
          orderId,
          cajasPrevias,
          cajasProducidas: parsedCajasProducidas,
          incrementoCajas
        });
        
        // Record the hourly production data if there's an increment
        if (incrementoCajas > 0) {
          try {
            console.log("Creating hourly production record with data:", {
              produccionId: orderId,
              cajasProducidas: incrementoCajas,
              horaRegistro: new Date()
            });
            
            const produccionPorHora = await prisma.produccionPorHora.create({
              data: {
                produccionId: orderId,
                cajasProducidas: incrementoCajas,
                horaRegistro: new Date()
              }
            });
            
            console.log("Successfully created hourly production record:", produccionPorHora);
          } catch (error) {
            console.error("Error creating hourly production record:", error);
            // Continue with the update even if there's an error with the hourly record
          }
        } else {
          console.log("No increment in production, skipping hourly record");
        }

        // Calculate remaining time if finalizing production
        if (isFinalizingProduction) {
          try {
            const ahora = new Date();
            
            // Si el cliente envió el tiempo transcurrido, usarlo directamente
            // De lo contrario, calcularlo basado en lastUpdateTime
            let tiempoRemanente = tiempoTranscurridoHoras;
            
            if (tiempoRemanente <= 0 && order.lastUpdateTime) {
              const ultimaActualizacion = new Date(order.lastUpdateTime);
              // Calculate time difference in hours as fallback
              tiempoRemanente = (ahora.getTime() - ultimaActualizacion.getTime()) / (1000 * 60 * 60);
              
              console.log("Calculated remaining time from lastUpdateTime:", {
                ultimaActualizacion,
                ahora,
                tiempoRemanenteHoras: tiempoRemanente
              });
            } else {
              console.log("Using client-provided time:", {
                tiempoTranscurridoHoras
              });
            }
            
            if (tiempoRemanente > 0) {
              // Record the remaining time
              const finalizacion = await prisma.finalizacionProduccion.create({
                data: {
                  produccionId: orderId,
                  tiempoHoras: tiempoRemanente,
                  fechaRegistro: ahora
                }
              });
              
              console.log("Successfully created finalization record:", finalizacion);
            }
          } catch (error) {
            console.error("Error creating finalization record:", error);
            // Continue with the update even if there's an error with the finalization record
          }
        }

        // Update the order with the new total production
        const updatedOrder = await prisma.produccion.update({
          where: { id: orderId },
          data: {
            cajasProducidas: typeof cajasProducidas === 'number' ? cajasProducidas : parseInt(cajasProducidas),
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
              // Validate essential paro data
              if (!paro.tiempoMinutos || !paro.tipoParoId) {
                console.error("Invalid paro data, skipping:", paro);
                continue;
              }
              
              console.log("Creating paro with data:", {
                tiempoMinutos: paro.tiempoMinutos,
                tipoParoId: paro.tipoParoId,
                sistemaId: paro.sistemaId,
                subsistemaId: paro.subsistemaId,
                subsubsistemaId: paro.subsubsistemaId,
                desviacionCalidadId: paro.desviacionCalidadId,
                materiaPrimaId: paro.materiaPrimaId
              });

              const createData: Prisma.ParoCreateInput = {
                tiempoMinutos: paro.tiempoMinutos,
                descripcion: paro.descripcion || "",
                fechaInicio: (() => {
                  const now = new Date();
                  const mexicoDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
                  const utcDate = new Date(Date.UTC(
                    mexicoDate.getFullYear(),
                    mexicoDate.getMonth(),
                    mexicoDate.getDate()
                  ));
                  return utcDate;
                })(),
                fechaFin: (() => {
                  const now = new Date();
                  const mexicoDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
                  const utcDate = new Date(Date.UTC(
                    mexicoDate.getFullYear(),
                    mexicoDate.getMonth(),
                    mexicoDate.getDate()
                  ));
                  utcDate.setUTCHours(23, 59, 59, 999);
                  return utcDate;
                })(),
                tipoParo: {
                  connect: { id: paro.tipoParoId }
                },
                produccion: {
                  connect: { id: orderId }
                },
                lineaProduccion: {
                  connect: { id: order.lineaProduccion.id }
                }
              };

              // Add optional connections only if valid IDs are provided
              if (paro.sistemaId) {
                createData.sistema = {
                  connect: { id: paro.sistemaId }
                };
              }
              
              if (paro.subsistemaId) {
                createData.subsistema = {
                  connect: { id: paro.subsistemaId }
                };
              }
              
              if (paro.subsubsistemaId) {
                createData.subsubsistema = {
                  connect: { id: paro.subsubsistemaId }
                };
              }
              
              if (paro.desviacionCalidadId) {
                createData.desviacionCalidad = {
                  connect: { id: paro.desviacionCalidadId }
                };
              }
              
              if (paro.materiaPrimaId) {
                createData.materiaPrima = {
                  connect: { id: paro.materiaPrimaId }
                };
              }

              console.log("Creating paro with data:", JSON.stringify(createData, null, 2));

              const createdParo = await prisma.paro.create({
                data: createData
              });

              console.log("Created paro with ID:", createdParo.id);
            } catch (error: any) {
              console.error("Error creating paro:", error);
              // Continue with the next paro even if there's an error with this one
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
      console.error("Error finding order:", error);
      return NextResponse.json(
        { message: `Error al buscar la orden: ${error?.message || 'Error desconocido'}` },
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