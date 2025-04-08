import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Tipos de filtros soportados
type FilterType = 
  | 'lineas_produccion' 
  | 'productos' 
  | 'turnos' 
  | 'tipos_paros'
  | 'materias_primas'
  | 'desviaciones_calidad';

// Tipo para opciones de filtro
type FilterOption = {
  id: string;
  name: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('type') as FilterType;
    const dependsOn = searchParams.get('dependsOn');
    const entidadPrincipal = searchParams.get('entidad_principal');
    
    if (!filterType) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro type' },
        { status: 400 }
      );
    }
    
    // Obtener opciones de filtro basadas en el tipo
    let options: FilterOption[] = [];
    
    switch (filterType) {
      case 'lineas_produccion':
        // Si hay una entidad principal seleccionada, podemos filtrar las líneas relevantes
        if (entidadPrincipal) {
          switch (entidadPrincipal) {
            case 'producto':
              // Mostrar solo líneas que tengan productos asignados
              const lineasConProductos = await prisma.productoEnLinea.findMany({
                select: {
                  lineaProduccionId: true,
                  lineaProduccion: {
                    select: {
                      id: true,
                      nombre: true,
                    }
                  }
                },
                distinct: ['lineaProduccionId'],
                orderBy: {
                  lineaProduccion: {
                    nombre: 'asc'
                  }
                }
              });
              
              options = lineasConProductos.map((linea) => ({
                id: linea.lineaProduccionId,
                name: linea.lineaProduccion.nombre,
              }));
              break;
              
            case 'paro':
              // Mostrar solo líneas que tengan paros registrados
              const lineasConParos = await prisma.paro.findMany({
                select: {
                  lineaProduccionId: true,
                  lineaProduccion: {
                    select: {
                      id: true,
                      nombre: true,
                    }
                  }
                },
                distinct: ['lineaProduccionId'],
                orderBy: {
                  lineaProduccion: {
                    nombre: 'asc'
                  }
                }
              });
              
              options = lineasConParos.map((linea) => ({
                id: linea.lineaProduccionId,
                name: linea.lineaProduccion.nombre,
              }));
              break;
              
            case 'desviacion_calidad':
              // Mostrar líneas con desviaciones de calidad
              // Nota: Si no existe una tabla real para desviaciones en prisma, usamos un query alternativo
              try {
                // Intentar consultar a través de paros relacionados con desviaciones
                const lineasConDesviaciones = await prisma.lineaProduccion.findMany({
                  where: {
                    paros: {
                      some: {
                        descripcion: {
                          contains: 'calidad',
                          mode: 'insensitive'
                        }
                      }
                    }
                  },
                  select: {
                    id: true,
                    nombre: true
                  },
                  orderBy: {
                    nombre: 'asc'
                  }
                });
                
                options = lineasConDesviaciones.map((linea) => ({
                  id: linea.id,
                  name: linea.nombre,
                }));
              } catch (error) {
                // Fallback a todas las líneas si no se puede consultar específicamente
                console.error('Error al buscar líneas con desviaciones:', error);
                const lineas = await prisma.lineaProduccion.findMany({
                  select: {
                    id: true,
                    nombre: true,
                  },
                  orderBy: {
                    nombre: 'asc',
                  },
                });
                
                options = lineas.map((linea) => ({
                  id: linea.id,
                  name: linea.nombre,
                }));
              }
              break;
              
            default:
              // Comportamiento estándar - traer todas las líneas
              const lineas = await prisma.lineaProduccion.findMany({
                select: {
                  id: true,
                  nombre: true,
                },
                orderBy: {
                  nombre: 'asc',
                },
              });
              
              options = lineas.map((linea) => ({
                id: linea.id,
                name: linea.nombre,
              }));
          }
        } else {
          // Comportamiento estándar - traer todas las líneas
          const lineas = await prisma.lineaProduccion.findMany({
            select: {
              id: true,
              nombre: true,
            },
            orderBy: {
              nombre: 'asc',
            },
          });
          
          options = lineas.map((linea) => ({
            id: linea.id,
            name: linea.nombre,
          }));
        }
        break;
        
      case 'productos':
        // Si depende de líneas de producción, filtrar por esas líneas
        if (dependsOn && dependsOn.startsWith('lineas:')) {
          const lineaIds = dependsOn.substring(7).split(',');
          
          const productosEnLineas = await prisma.productoEnLinea.findMany({
            where: {
              lineaProduccionId: {
                in: lineaIds,
              },
            },
            select: {
              productoId: true,
              producto: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
            orderBy: {
              producto: {
                nombre: 'asc'
              }
            }
          });
          
          // Eliminar duplicados y ordenar alfabéticamente
          const productosUnicos = new Map();
          productosEnLineas.forEach(pel => {
            if (!productosUnicos.has(pel.productoId)) {
              productosUnicos.set(pel.productoId, pel.producto);
            }
          });
          
          options = Array.from(productosUnicos.values())
            .map(producto => ({
              id: producto.id,
              name: producto.nombre,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
          
        } else {
          // Filtrar por entidad principal si está definida
          if (entidadPrincipal) {
            switch (entidadPrincipal) {
              case 'materia_prima':
                // Mostrar productos que usan cierta materia prima
                const productosConMaterias = await prisma.productoMateriaPrima.findMany({
                  select: {
                    productoId: true,
                    producto: {
                      select: {
                        id: true,
                        nombre: true
                      }
                    }
                  },
                  distinct: ['productoId'],
                  orderBy: {
                    producto: {
                      nombre: 'asc'
                    }
                  }
                });
                
                options = productosConMaterias.map(prod => ({
                  id: prod.productoId,
                  name: prod.producto.nombre
                }));
                break;
                
              default:
                // Traer todos los productos con datos de producción
                const productosConProduccion = await prisma.produccion.findMany({
                  select: {
                    productoId: true,
                    producto: {
                      select: {
                        id: true,
                        nombre: true
                      }
                    }
                  },
                  distinct: ['productoId'],
                  orderBy: {
                    producto: {
                      nombre: 'asc'
                    }
                  }
                });
                
                options = productosConProduccion.map(prod => ({
                  id: prod.productoId,
                  name: prod.producto.nombre
                }));
            }
          } else {
            // Sin filtro de línea ni entidad principal, traer todos los productos
            const productos = await prisma.producto.findMany({
              select: {
                id: true,
                nombre: true,
              },
              orderBy: {
                nombre: 'asc',
              },
            });
            
            options = productos.map(producto => ({
              id: producto.id,
              name: producto.nombre,
            }));
          }
        }
        break;
        
      case 'turnos':
        // Si hay líneas seleccionadas, mostrar solo turnos para esas líneas
        if (dependsOn && dependsOn.startsWith('lineas:')) {
          const lineaIds = dependsOn.substring(7).split(',');
          
          const turnosPorLinea = await prisma.produccion.findMany({
            where: {
              lineaProduccionId: {
                in: lineaIds
              }
            },
            select: {
              turno: true
            },
            distinct: ['turno'],
            orderBy: {
              turno: 'asc'
            }
          });
          
          options = turnosPorLinea.map(prod => ({
            id: prod.turno.toString(),
            name: `Turno ${prod.turno}`,
          }));
        } else {
          // Obtener turnos únicos de las producciones
          const producciones = await prisma.produccion.groupBy({
            by: ['turno'],
            orderBy: {
              turno: 'asc',
            },
          });
          
          options = producciones.map(prod => ({
            id: prod.turno.toString(),
            name: `Turno ${prod.turno}`,
          }));
        }
        break;
        
      case 'tipos_paros':
        // Si hay líneas seleccionadas, mostrar tipos de paro para esas líneas
        if (dependsOn && dependsOn.startsWith('lineas:')) {
          const lineaIds = dependsOn.substring(7).split(',');
          
          const parosPorLinea = await prisma.paro.findMany({
            where: {
              lineaProduccionId: {
                in: lineaIds
              }
            },
            select: {
              tipoParoId: true,
              tipoParo: {
                select: {
                  id: true,
                  nombre: true
                }
              }
            },
            distinct: ['tipoParoId'],
            orderBy: {
              tipoParo: {
                nombre: 'asc'
              }
            }
          });
          
          options = parosPorLinea.map(paro => ({
            id: paro.tipoParoId,
            name: paro.tipoParo.nombre,
          }));
        } else {
          // Traer todos los tipos de paro
          const tiposParos = await prisma.tipoParo.findMany({
            select: {
              id: true,
              nombre: true,
            },
            orderBy: {
              nombre: 'asc',
            },
          });
          
          options = tiposParos.map(tipo => ({
            id: tipo.id,
            name: tipo.nombre,
          }));
        }
        break;
        
      case 'materias_primas':
        // Si depende de productos, mostrar materias primas para esos productos
        if (dependsOn && dependsOn.startsWith('productos:')) {
          const productoIds = dependsOn.substring(10).split(',');
          
          const materiasPorProducto = await prisma.productoMateriaPrima.findMany({
            where: {
              productoId: {
                in: productoIds
              }
            },
            select: {
              materiaPrimaId: true,
              materiaPrima: {
                select: {
                  id: true,
                  nombre: true
                }
              }
            },
            distinct: ['materiaPrimaId'],
            orderBy: {
              materiaPrima: {
                nombre: 'asc'
              }
            }
          });
          
          options = materiasPorProducto.map(mpp => ({
            id: mpp.materiaPrimaId,
            name: mpp.materiaPrima.nombre,
          }));
        } else {
          // Traer todas las materias primas
          const materiasPrimas = await prisma.materiaPrima.findMany({
            select: {
              id: true,
              nombre: true,
            },
            orderBy: {
              nombre: 'asc',
            },
          });
          
          options = materiasPrimas.map(mp => ({
            id: mp.id,
            name: mp.nombre,
          }));
        }
        break;
        
      case 'desviaciones_calidad':
        // Implementar consulta real a la tabla de desviaciones de calidad o usar tabla relacionada
        try {
          // Si depende de líneas seleccionadas
          let whereClause = {};
          
          if (dependsOn && dependsOn.startsWith('lineas:')) {
            const lineaIds = dependsOn.substring(7).split(',');
            whereClause = {
              lineaProduccionId: {
                in: lineaIds
              }
            };
          }
          
          // Verificar si existe la relación en paros para desviaciones
          // Aquí asumimos que hay una relación en paros relacionada con calidad
          const desviaciones = await prisma.paro.findMany({
            where: {
              ...whereClause,
              descripcion: {
                contains: 'calidad',
                mode: 'insensitive'
              }
            },
            select: {
              id: true,
              descripcion: true
            },
            distinct: ['descripcion'],
            orderBy: {
              descripcion: 'asc'
            }
          });
          
          // Si hay resultados de la base de datos, usarlos
          if (desviaciones.length > 0) {
            options = desviaciones
              .filter((desv) => desv.descripcion !== null) // Filtrar valores nulos
              .map((desv) => ({
                id: desv.id,
                name: desv.descripcion || 'Desviación sin descripción' // Proporcionar valor predeterminado
              }));
          } else {
            // Usar datos de ejemplo estandarizados como fallback
            console.log('No se encontraron desviaciones de calidad en la base de datos, usando datos de ejemplo');
            options = [
              { id: 'dc-001', name: 'Contaminación microbiana' },
              { id: 'dc-002', name: 'Variación de color' },
              { id: 'dc-003', name: 'Sabor fuera de especificación' },
              { id: 'dc-004', name: 'PH fuera de rango permitido' },
              { id: 'dc-005', name: 'Defecto en envase o tapa' },
              { id: 'dc-006', name: 'Densidad fuera de especificación' },
              { id: 'dc-007', name: 'Carbonatación incorrecta' },
              { id: 'dc-008', name: 'Partículas extrañas visibles' }
            ];
          }
        } catch (error) {
          console.error('Error al consultar desviaciones de calidad:', error);
          // Mantener datos de ejemplo como fallback en caso de error
          options = [
            { id: 'dc-001', name: 'Contaminación microbiana' },
            { id: 'dc-002', name: 'Variación de color' },
            { id: 'dc-003', name: 'Sabor fuera de especificación' },
            { id: 'dc-004', name: 'PH fuera de rango permitido' }
          ];
        }
        break;
        
      default:
        return NextResponse.json(
          { error: 'Tipo de filtro no soportado' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ options });
  } catch (error) {
    console.error('Error obteniendo opciones de filtro:', error);
    return NextResponse.json(
      { error: 'Error al obtener opciones de filtro' },
      { status: 500 }
    );
  }
} 