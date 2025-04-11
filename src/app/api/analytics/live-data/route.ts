import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Get all production lines
    const lineasProduccion = await prisma.lineaProduccion.findMany();
    
    // 2. Prepare data structure for response
    const result = [];
    
    // 3. For each production line, check if there's an active production order
    for (const linea of lineasProduccion) {
      // Get production order in process for this line
      const ordenActiva = await prisma.produccion.findFirst({
        where: {
          lineaProduccionId: linea.id,
          estado: "en_progreso",
        },
        select: {
          id: true,
          numeroOrden: true,
          cajasPlanificadas: true,
          cajasProducidas: true,
          tiempoPlan: true,
          fechaProduccion: true,
          productoId: true,
          createdAt: true,
          producto: {
            select: {
              id: true,
              nombre: true,
              modelo: {
                select: {
                  nombre: true
                }
              },
              sabor: {
                select: {
                  nombre: true
                }
              },
              tamaño: {
                select: {
                  nombre: true,
                  litros: true
                }
              },
              caja: {
                select: {
                  nombre: true,
                  numeroUnidades: true
                }
              }
            }
          },
          // Get the most recent production history regardless of active status
          historialesProduccion: {
            orderBy: {
              fechaInicio: 'desc'
            },
            take: 1,
            select: {
              id: true,
              cajasProducidas: true,
              fechaInicio: true,
              cantidadParosTotal: true,
              tiempoParosTotal: true,
              cantidadParosMantenimiento: true,
              tiempoParosMantenimiento: true,
              cantidadParosCalidad: true,
              tiempoParosCalidad: true,
              cantidadParosOperacion: true,
              tiempoParosOperacion: true,
              activo: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
      
      if (ordenActiva) {
        // Calculate time elapsed for the total production order
        // Count how many entries in ProduccionPorHora for this order (each entry = 1 hour)
        const horasRegistradas = await prisma.produccionPorHora.count({
          where: {
            produccionId: ordenActiva.id
          }
        });
        
        // Get finalization time records for this order
        const finalizaciones = await prisma.finalizacionProduccion.findMany({
          where: {
            produccionId: ordenActiva.id
          },
          select: {
            tiempoHoras: true
          }
        });
        
        // Sum up all hours from finalization records
        const horasFinalizacion = finalizaciones.reduce((sum: number, record: { tiempoHoras: number }) => sum + record.tiempoHoras, 0);
        
        // Total elapsed time = hours from hourly records + hours from finalization records
        const tiempoTotalTranscurrido = horasRegistradas + horasFinalizacion;
        
        // Check if we have any production history records
        let datosActuales = null;
        const historialReciente = ordenActiva.historialesProduccion[0];
        
        if (historialReciente) {
          // Use the most recent history record (active or not)
          const tiempoTranscurridoActual = (new Date().getTime() - new Date(historialReciente.fechaInicio).getTime()) / (1000 * 60 * 60); // Convert to hours
          const promedioCajasActual = historialReciente.cajasProducidas / tiempoTranscurridoActual || 0;
          const promedioPlanificado = ordenActiva.cajasPlanificadas / (ordenActiva.tiempoPlan || 1);
          const cajasRestantes = ordenActiva.cajasPlanificadas - ordenActiva.cajasProducidas;
          const tiempoEstimadoRestante = promedioCajasActual > 0 ? cajasRestantes / promedioCajasActual : 0;
          const tiempoFaltanteVsPlan = (ordenActiva.tiempoPlan || 0) - tiempoTotalTranscurrido;
          
          datosActuales = {
            cajasProducidas: historialReciente.cajasProducidas,
            fechaInicio: historialReciente.fechaInicio,
            tiempoTranscurrido: tiempoTranscurridoActual,
            parosTotales: {
              cantidad: historialReciente.cantidadParosTotal,
              tiempo: historialReciente.tiempoParosTotal
            },
            parosMantenimiento: {
              cantidad: historialReciente.cantidadParosMantenimiento,
              tiempo: historialReciente.tiempoParosMantenimiento
            },
            parosCalidad: {
              cantidad: historialReciente.cantidadParosCalidad,
              tiempo: historialReciente.tiempoParosCalidad
            },
            parosOperacion: {
              cantidad: historialReciente.cantidadParosOperacion,
              tiempo: historialReciente.tiempoParosOperacion
            },
            promedioCajasActual,
            promedioPlanificado,
            comparacionPromedio: promedioCajasActual / promedioPlanificado,
            tiempoEstimadoRestante,
            tiempoFaltanteVsPlan,
            jefeProduccion: historialReciente.user.name,
            activo: historialReciente.activo
          };
        } else {
          // If no history records exist, create default data based on production creation time
          const tiempoTranscurridoActual = (new Date().getTime() - new Date(ordenActiva.createdAt).getTime()) / (1000 * 60 * 60);
          const promedioPlanificado = ordenActiva.cajasPlanificadas / (ordenActiva.tiempoPlan || 1);
          const cajasRestantes = ordenActiva.cajasPlanificadas - ordenActiva.cajasProducidas;
          
          // Use an estimate for average production rate - assuming current production is evenly distributed
          const promedioCajasActual = ordenActiva.cajasProducidas / tiempoTotalTranscurrido || 0;
          const tiempoEstimadoRestante = promedioCajasActual > 0 ? cajasRestantes / promedioCajasActual : 0;
          const tiempoFaltanteVsPlan = (ordenActiva.tiempoPlan || 0) - tiempoTotalTranscurrido;
          
          // Create default Live Data
          datosActuales = {
            cajasProducidas: 0, // Currently 0 from this latest session
            fechaInicio: ordenActiva.createdAt,
            tiempoTranscurrido: tiempoTranscurridoActual,
            parosTotales: {
              cantidad: 0,
              tiempo: 0
            },
            parosMantenimiento: {
              cantidad: 0,
              tiempo: 0
            },
            parosCalidad: {
              cantidad: 0,
              tiempo: 0
            },
            parosOperacion: {
              cantidad: 0,
              tiempo: 0
            },
            promedioCajasActual,
            promedioPlanificado,
            comparacionPromedio: promedioCajasActual / promedioPlanificado,
            tiempoEstimadoRestante,
            tiempoFaltanteVsPlan,
            jefeProduccion: "No asignado",
            activo: false
          };
        }
        
        // Add line information to result
        result.push({
          id: linea.id,
          nombre: linea.nombre,
          estado: "activo",
          ordenProduccion: {
            id: ordenActiva.id,
            numeroOrden: ordenActiva.numeroOrden,
            cajasPlanificadas: ordenActiva.cajasPlanificadas,
            cajasProducidas: ordenActiva.cajasProducidas,
            tiempoPlan: ordenActiva.tiempoPlan,
            tiempoTranscurrido: tiempoTotalTranscurrido,
            producto: {
              nombre: ordenActiva.producto.nombre,
              modelo: ordenActiva.producto.modelo.nombre,
              sabor: ordenActiva.producto.sabor.nombre,
              tamaño: ordenActiva.producto.tamaño.nombre,
              caja: ordenActiva.producto.caja.nombre,
              unidadesPorCaja: ordenActiva.producto.caja.numeroUnidades,
              litrosPorUnidad: ordenActiva.producto.tamaño.litros
            }
          },
          datosActuales
        });
      } else {
        // Line is not active
        result.push({
          id: linea.id,
          nombre: linea.nombre,
          estado: "inactivo"
        });
      }
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al obtener datos en vivo:", error);
    return NextResponse.json(
      { error: "Error al obtener datos en vivo" },
      { status: 500 }
    );
  }
} 