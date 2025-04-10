import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";

// Custom type for Paro creation
type ParoCreateData = {
  tiempoMinutos: number;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipoParo: {
    connect: { id: string }
  };
  produccion: {
    connect: { id: string }
  };
  lineaProduccion: {
    connect: { id: string }
  };
  sistema?: {
    connect: { id: string }
  };
  subsistema?: {
    connect: { id: string }
  };
  subsubsistema?: {
    connect: { id: string }
  };
  desviacionCalidad?: {
    connect: { id: string }
  };
  materiaPrima?: {
    connect: { id: string }
  };
};

// Interface for TipoParo
interface TipoParo {
  id: string;
  nombre: string;
}

// Interface for groupBy result
interface ParoStat {
  tipoParoId: string;
  _count: { 
    id: number 
  };
  _sum: { 
    tiempoMinutos: number 
  };
}

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
      hourlyProduction,
      paros, 
      isFinalizingProduction = false,
      tiempoTranscurridoHoras = 0,
      activeHistorialId = null,
      resumenParos = null
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
      hourlyProduction,
      parosCount: paros?.length, 
      isFinalizingProduction,
      tiempoTranscurridoHoras,
      activeHistorialId: activeHistorialId ? 'provided' : 'not provided',
      resumenParos: resumenParos ? 'provided' : 'not provided'
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
        // MODIFICACIÓN: Siempre obtener las cajas actuales directo de la base de datos
        let incrementoCajas = 0;
        const cajasPrevias = order.cajasProducidas || 0;
        
        if (hourlyProduction !== undefined && hourlyProduction !== null) {
          // Si recibimos hourlyProduction directamente, usamos ese valor como incremento
          incrementoCajas = typeof hourlyProduction === 'number' ? hourlyProduction : parseInt(hourlyProduction);
          console.log("Using provided hourlyProduction value for increment:", incrementoCajas);
        } else if (cajasProducidas !== undefined && cajasProducidas !== null) {
          // MODIFICACIÓN: Si cajasProducidas es enviado, lo tratamos SIEMPRE como el total final deseado
          // y calculamos el incremento basado en la diferencia con el total actual en la base de datos
          const cajasNuevas = typeof cajasProducidas === 'number' ? cajasProducidas : parseInt(cajasProducidas);
          
          // Si cajasProducidas > cajasPrevias, calculamos el incremento
          // De lo contrario, asumimos que son datos obsoletos y forzamos un incremento 0
          if (cajasNuevas > cajasPrevias) {
            incrementoCajas = cajasNuevas - cajasPrevias;
            console.log("Calculated increment from total:", {
              cajasPrevias,
              cajasNuevas,
              incremento: incrementoCajas
            });
          } else {
            console.log("ADVERTENCIA: cajasProducidas ≤ cajasPrevias, asumiendo incremento de 0", {
              cajasPrevias,
              cajasProducidas: cajasNuevas,
              incremento: 0
            });
            incrementoCajas = 0;
          }
        } else {
          // No hay ni hourlyProduction ni cajasProducidas, asumimos 0
          console.log("ADVERTENCIA: No se proporcionó ni hourlyProduction ni cajasProducidas, asumiendo incremento de 0");
          incrementoCajas = 0;
        }
        
        console.log("INCREMENTO FINAL de cajas:", incrementoCajas);
        
        // Una comprobación de seguridad para nunca permitir incrementos negativos
        if (incrementoCajas < 0) {
          incrementoCajas = 0;
          console.error("ADVERTENCIA: Se detectó un incremento negativo y se forzó a 0.");
        }
        
        // SIEMPRE registrar el incremento solo si es mayor que 0
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

        // Update the order with the new production count by incrementing SIEMPRE
        console.log("Actualizando orden con increment de Prisma:", {
          id: orderId,
          valorActual: order.cajasProducidas,
          incremento: incrementoCajas
        });
        
        // SIEMPRE usar increment para actualizar cajasProducidas
        const updatedOrder = await prisma.produccion.update({
          where: { id: orderId },
          data: {
            cajasProducidas: {
              increment: incrementoCajas
            },
            estado: isFinalizingProduction ? "completada" : "en_progreso",
            lastUpdateTime: new Date()
          },
        });
        
        console.log("Updated order with new production count:", {
          previousCount: order.cajasProducidas || 0,
          increment: incrementoCajas,
          newTotal: updatedOrder.cajasProducidas
        });

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

              const createData: ParoCreateData = {
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
        
        // When finalizing production, close the active ProduccionHistorial entry
        if (isFinalizingProduction) {
          try {
            let activeHistorial = null;
            
            // Si se proporciona un ID de historial, usarlo primero
            if (activeHistorialId) {
              console.log(`[FINISH] Looking for historial with specific ID: ${activeHistorialId}`);
              
              activeHistorial = await prisma.produccionHistorial.findUnique({
                where: {
                  id: activeHistorialId
                }
              });
              
              if (!activeHistorial) {
                console.error(`[FINISH] ERROR: Historial ID ${activeHistorialId} provided by frontend not found in database!`);
              } else if (!activeHistorial.activo) {
                console.log(`[FINISH] Found historial ID ${activeHistorialId} but it's not active`);
                activeHistorial = null;
              } else {
                console.log(`[FINISH] Successfully found active historial with ID: ${activeHistorialId}`);
                console.log(`[FINISH] Current cajas in historial: ${activeHistorial.cajasProducidas}`);
              }
            }
            
            // Si no se encuentra por ID o no se proporcionó un ID, buscar el historial activo
            if (!activeHistorial) {
              console.log(`[FINISH] Searching for any active historial for order: ${orderId}`);
              
              // First get the active history entry
              activeHistorial = await prisma.produccionHistorial.findFirst({
                where: {
                  produccionId: orderId,
                  activo: true,
                  fechaFin: null
                }
              });
            }
            
            if (activeHistorial) {
              // Get counts and statistics for this period
              // Count total paros since the historial was created
              const parosStats = await prisma.paro.groupBy({
                by: ['tipoParoId'],
                where: {
                  produccionId: orderId,
                  fechaInicio: {
                    gte: activeHistorial.fechaInicio
                  }
                },
                _count: {
                  id: true
                },
                _sum: {
                  tiempoMinutos: true
                }
              });
              
              // Get the tipos de paro to categorize them
              const tiposParo = await prisma.tipoParo.findMany();
              
              // Initialize counters
              let cantidadParosTotal = 0;
              let cantidadParosMantenimiento = 0;
              let cantidadParosCalidad = 0;
              let cantidadParosOperacion = 0;
              let tiempoParosTotal = 0;
              let tiempoParosMantenimiento = 0;
              let tiempoParosCalidad = 0;
              let tiempoParosOperacion = 0;
              
              // Calculate statistics based on tipo de paro
              parosStats.forEach((stat: ParoStat) => {
                const tipoParo = tiposParo.find((t: TipoParo) => t.id === stat.tipoParoId);
                const count = stat._count.id || 0;
                const time = stat._sum.tiempoMinutos || 0;
                
                cantidadParosTotal += count;
                tiempoParosTotal += time;
                
                // Categorize based on the tipo paro name
                if (tipoParo?.nombre.toLowerCase().includes('mantenimiento')) {
                  cantidadParosMantenimiento += count;
                  tiempoParosMantenimiento += time;
                } else if (tipoParo?.nombre.toLowerCase().includes('calidad')) {
                  cantidadParosCalidad += count;
                  tiempoParosCalidad += time;
                } else {
                  // Default to operation
                  cantidadParosOperacion += count;
                  tiempoParosOperacion += time;
                }
              });
              
              // Calculate production increment for this period
              const produccionPorHoraSinceStart = await prisma.produccionPorHora.aggregate({
                where: {
                  produccionId: orderId,
                  horaRegistro: {
                    gte: activeHistorial.fechaInicio
                  }
                },
                _sum: {
                  cajasProducidas: true
                }
              });
              
              // IMPORTANTE: Calcular correctamente las cajas producidas en este periodo
              const cajasProducidasEnPeriodo = produccionPorHoraSinceStart._sum.cajasProducidas || 0;
              
              // Agregar el incremento actual que podría no estar contabilizado en produccionPorHora
              const cajasProducidasTotal = cajasProducidasEnPeriodo + (incrementoCajas > 0 ? incrementoCajas : 0);
              
              console.log(`[FINISH] Cajas producidas en este periodo: ${cajasProducidasEnPeriodo} + incremento actual ${incrementoCajas > 0 ? incrementoCajas : 0} = ${cajasProducidasTotal}`);
              
              // Si hay resumen de paros, usarlo directamente en lugar de calcular
              if (resumenParos) {
                console.log("[FINISH] Using provided paro summary for historial update:", resumenParos);
                console.log("[FINISH] Valores actuales del historial:", {
                  cantidadParosTotal: activeHistorial.cantidadParosTotal,
                  cantidadParosMantenimiento: activeHistorial.cantidadParosMantenimiento,
                  cantidadParosCalidad: activeHistorial.cantidadParosCalidad,
                  cantidadParosOperacion: activeHistorial.cantidadParosOperacion,
                  tiempoParosTotal: activeHistorial.tiempoParosTotal,
                  tiempoParosMantenimiento: activeHistorial.tiempoParosMantenimiento,
                  tiempoParosCalidad: activeHistorial.tiempoParosCalidad,
                  tiempoParosOperacion: activeHistorial.tiempoParosOperacion
                });
                console.log("[FINISH] Incrementando con:", {
                  cantidadParosTotal: resumenParos.cantidadTotal,
                  cantidadParosMantenimiento: resumenParos.cantidadMantenimiento,
                  cantidadParosCalidad: resumenParos.cantidadCalidad,
                  cantidadParosOperacion: resumenParos.cantidadOperacion,
                  tiempoParosTotal: resumenParos.tiempoTotal,
                  tiempoParosMantenimiento: resumenParos.tiempoMantenimiento,
                  tiempoParosCalidad: resumenParos.tiempoCalidad,
                  tiempoParosOperacion: resumenParos.tiempoOperacion
                });
                
                // Update the historial entry with summary data - USAR INCREMENTO, NO REEMPLAZO
                await prisma.produccionHistorial.update({
                  where: { id: activeHistorial.id },
                  data: {
                    // Establecer explícitamente el total de cajas producidas en este periodo
                    cajasProducidas: cajasProducidasTotal,
                    // Incrementar los valores de paros, no reemplazarlos
                    cantidadParosTotal: {
                      increment: resumenParos.cantidadTotal
                    },
                    cantidadParosMantenimiento: {
                      increment: resumenParos.cantidadMantenimiento
                    },
                    cantidadParosCalidad: {
                      increment: resumenParos.cantidadCalidad
                    },
                    cantidadParosOperacion: {
                      increment: resumenParos.cantidadOperacion
                    },
                    tiempoParosTotal: {
                      increment: resumenParos.tiempoTotal
                    },
                    tiempoParosMantenimiento: {
                      increment: resumenParos.tiempoMantenimiento
                    },
                    tiempoParosCalidad: {
                      increment: resumenParos.tiempoCalidad
                    },
                    tiempoParosOperacion: {
                      increment: resumenParos.tiempoOperacion
                    },
                    fechaFin: new Date(),
                    activo: false
                  }
                });
              } else {
                // Update the historial entry with calculated data - USAR INCREMENTO, NO REEMPLAZO
                console.log("[FINISH] Usando conteo calculado de paros para actualizar:", {
                  cantidadParosTotal,
                  cantidadParosMantenimiento,
                  cantidadParosCalidad,
                  cantidadParosOperacion,
                  tiempoParosTotal,
                  tiempoParosMantenimiento,
                  tiempoParosCalidad,
                  tiempoParosOperacion
                });
                console.log("[FINISH] Valores actuales del historial:", {
                  cantidadParosTotal: activeHistorial.cantidadParosTotal,
                  cantidadParosMantenimiento: activeHistorial.cantidadParosMantenimiento,
                  cantidadParosCalidad: activeHistorial.cantidadParosCalidad,
                  cantidadParosOperacion: activeHistorial.cantidadParosOperacion,
                  tiempoParosTotal: activeHistorial.tiempoParosTotal,
                  tiempoParosMantenimiento: activeHistorial.tiempoParosMantenimiento,
                  tiempoParosCalidad: activeHistorial.tiempoParosCalidad,
                  tiempoParosOperacion: activeHistorial.tiempoParosOperacion
                });
                console.log("[FINISH] Incrementando con valores calculados");
                
                await prisma.produccionHistorial.update({
                  where: { id: activeHistorial.id },
                  data: {
                    // Establecer explícitamente el total de cajas producidas en este periodo
                    cajasProducidas: cajasProducidasTotal,
                    // Incrementar los valores de paros, no reemplazarlos
                    cantidadParosTotal: {
                      increment: cantidadParosTotal
                    },
                    cantidadParosMantenimiento: {
                      increment: cantidadParosMantenimiento
                    },
                    cantidadParosCalidad: {
                      increment: cantidadParosCalidad
                    },
                    cantidadParosOperacion: {
                      increment: cantidadParosOperacion
                    },
                    tiempoParosTotal: {
                      increment: tiempoParosTotal
                    },
                    tiempoParosMantenimiento: {
                      increment: tiempoParosMantenimiento
                    },
                    tiempoParosCalidad: {
                      increment: tiempoParosCalidad
                    },
                    tiempoParosOperacion: {
                      increment: tiempoParosOperacion
                    },
                    fechaFin: new Date(),
                    activo: false
                  }
                });
              }
              
              console.log(`[FINISH] Successfully closed ProduccionHistorial ID: ${activeHistorial.id} for order: ${orderId}`);
              
              // Verificar los nuevos valores consultando el historial recién actualizado
              try {
                const updatedHistorial = await prisma.produccionHistorial.findUnique({
                  where: { id: activeHistorial.id }
                });
                
                if (updatedHistorial) {
                  console.log("[FINISH] Valores finales del historial después de la actualización:", {
                    cajasProducidas: updatedHistorial.cajasProducidas,
                    cantidadParosTotal: updatedHistorial.cantidadParosTotal,
                    cantidadParosMantenimiento: updatedHistorial.cantidadParosMantenimiento,
                    cantidadParosCalidad: updatedHistorial.cantidadParosCalidad,
                    cantidadParosOperacion: updatedHistorial.cantidadParosOperacion,
                    tiempoParosTotal: updatedHistorial.tiempoParosTotal,
                    tiempoParosMantenimiento: updatedHistorial.tiempoParosMantenimiento,
                    tiempoParosCalidad: updatedHistorial.tiempoParosCalidad,
                    tiempoParosOperacion: updatedHistorial.tiempoParosOperacion
                  });
                }
              } catch (error) {
                console.error("[FINISH] Error al obtener el historial actualizado:", error);
              }
            } else {
              console.error(`[FINISH] No active ProduccionHistorial found for order: ${orderId}`);
              
              // Si no se encuentra un historial activo, creamos uno y lo cerramos inmediatamente
              // Obtener los datos básicos de la orden
              const orderData = await prisma.produccion.findUnique({
                where: { id: orderId },
                select: { 
                  lineaProduccionId: true, 
                  productoId: true 
                }
              });
              
              if (orderData) {
                console.log(`[FINISH] Creating new ProduccionHistorial for order ${orderId} and closing it immediately`);
                
                // Crear un nuevo historial pero ya cerrado
                const now = new Date();
                // Calcular una fecha de inicio aproximada
                const startDate = new Date(now);
                startDate.setHours(startDate.getHours() - 1); // Asumimos que este periodo duró al menos 1 hora
                
                // Obtener los tipos de paro para clasificarlos
                const tiposParo = await prisma.tipoParo.findMany();
                
                // Crear y cerrar el historial en una sola operación
                const newHistorial = await prisma.produccionHistorial.create({
                  data: {
                    produccionId: orderId,
                    userId: session.user.id,
                    lineaProduccionId: orderData.lineaProduccionId,
                    productoId: orderData.productoId,
                    fechaInicio: startDate,
                    fechaFin: now,
                    activo: false,
                    cajasProducidas: cajasProducidas > 0 ? cajasProducidas : 0,
                    // Si tenemos el resumen de paros, usamos esos datos
                    ...(resumenParos ? {
                      cantidadParosTotal: resumenParos.cantidadTotal,
                      cantidadParosMantenimiento: resumenParos.cantidadMantenimiento,
                      cantidadParosCalidad: resumenParos.cantidadCalidad,
                      cantidadParosOperacion: resumenParos.cantidadOperacion,
                      tiempoParosTotal: resumenParos.tiempoTotal,
                      tiempoParosMantenimiento: resumenParos.tiempoMantenimiento,
                      tiempoParosCalidad: resumenParos.tiempoCalidad,
                      tiempoParosOperacion: resumenParos.tiempoOperacion
                    } : {
                      // De lo contrario, calculamos los conteos basados en los paros enviados
                      cantidadParosTotal: paros?.length || 0,
                      cantidadParosMantenimiento: paros?.filter((p: any) => 
                        tiposParo.find((t: TipoParo) => t.id === p.tipoParoId)?.nombre.toLowerCase().includes('mantenimiento')
                      ).length || 0,
                      cantidadParosCalidad: paros?.filter((p: any) => 
                        tiposParo.find((t: TipoParo) => t.id === p.tipoParoId)?.nombre.toLowerCase().includes('calidad')
                      ).length || 0,
                      cantidadParosOperacion: paros?.filter((p: any) => {
                        const tipo = tiposParo.find((t: TipoParo) => t.id === p.tipoParoId);
                        return tipo && !tipo.nombre.toLowerCase().includes('mantenimiento') && 
                                     !tipo.nombre.toLowerCase().includes('calidad');
                      }).length || 0,
                      tiempoParosTotal: paros?.reduce((sum: number, p: any) => sum + (p.tiempoMinutos || 0), 0) || 0,
                      tiempoParosMantenimiento: paros?.filter((p: any) => 
                        tiposParo.find((t: TipoParo) => t.id === p.tipoParoId)?.nombre.toLowerCase().includes('mantenimiento')
                      ).reduce((sum: number, p: any) => sum + (p.tiempoMinutos || 0), 0) || 0,
                      tiempoParosCalidad: paros?.filter((p: any) => 
                        tiposParo.find((t: TipoParo) => t.id === p.tipoParoId)?.nombre.toLowerCase().includes('calidad')
                      ).reduce((sum: number, p: any) => sum + (p.tiempoMinutos || 0), 0) || 0,
                      tiempoParosOperacion: paros?.filter((p: any) => {
                        const tipo = tiposParo.find((t: TipoParo) => t.id === p.tipoParoId);
                        return tipo && !tipo.nombre.toLowerCase().includes('mantenimiento') && 
                                     !tipo.nombre.toLowerCase().includes('calidad');
                      }).reduce((sum: number, p: any) => sum + (p.tiempoMinutos || 0), 0) || 0
                    })
                  }
                });
                
                console.log(`[FINISH] Created and closed new ProduccionHistorial ID: ${newHistorial.id} for order: ${orderId}`);
              } else {
                console.error(`[FINISH] Could not create ProduccionHistorial, order data not found: ${orderId}`);
              }
            }
          } catch (error) {
            console.error("Error updating production history:", error);
            // Continue with the process even if there's an error with the history
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