import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay, parseISO } from "date-fns";

interface ProduccionAgregada {
  productoId: string;
  productoNombre: string;
  lineaProduccionId: string;
  lineaProduccionNombre: string;
  totalCajas: number;
  registros: number;
}

export async function GET(request: Request) {
  try {
    // Obtener parámetros de la consulta
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const comparisonPeriod = searchParams.get('comparisonPeriod') || 'previous_period';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: 'Se requieren los parámetros from y to' },
        { status: 400 }
      );
    }

    const fromDate = parseISO(fromParam);
    const toDate = parseISO(toParam);

    // Calcular el rango de fechas para la comparación
    let comparisonFromDate, comparisonToDate;
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

    if (comparisonPeriod === "previous_period") {
      // Período anterior del mismo tamaño
      comparisonToDate = new Date(fromDate);
      comparisonToDate.setDate(comparisonToDate.getDate() - 1);
      comparisonFromDate = new Date(comparisonToDate);
      comparisonFromDate.setDate(comparisonFromDate.getDate() - daysDiff + 1);
    } else {
      // Mismo período del año anterior
      comparisonFromDate = new Date(fromDate);
      comparisonFromDate.setFullYear(comparisonFromDate.getFullYear() - 1);
      comparisonToDate = new Date(toDate);
      comparisonToDate.setFullYear(comparisonToDate.getFullYear() - 1);
    }

    // Obtener datos detallados para el período actual
    const { data: detailedData, averageEfficiency: currentEfficiency } = 
      await getDetailedEfficiencyData(fromDate, toDate, limit);
    
    // Calcular la eficiencia del período de comparación
    const { averageEfficiency: comparisonEfficiency } = 
      await getDetailedEfficiencyData(comparisonFromDate, comparisonToDate, 0);

    // Calcular el porcentaje de cambio
    const percentChange = comparisonEfficiency > 0 
      ? ((currentEfficiency - comparisonEfficiency) / comparisonEfficiency) * 100 
      : 0;

    return NextResponse.json({
      topDeviated: detailedData,
      allData: detailedData,
      averageEfficiency: currentEfficiency,
      comparisonAverageEfficiency: comparisonEfficiency,
      percentChange: Math.round(percentChange * 10) / 10, // Redondear a 1 decimal
      comparisonPeriod,
    });
  } catch (error) {
    console.error("Error calculating hourly production efficiency:", error);
    return NextResponse.json(
      { error: "Error al calcular la eficiencia de producción por hora" },
      { status: 500 }
    );
  }
}

// Función para calcular la eficiencia en un rango de fechas y obtener datos detallados
async function getDetailedEfficiencyData(fromDate: Date, toDate: Date, limit: number = 0): Promise<{
  data: any[],
  averageEfficiency: number
}> {
  try {
    // 1. Obtener todas las producciones en el rango de fechas
    const producciones = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: startOfDay(fromDate),
          lte: endOfDay(toDate),
        },
      },
      include: {
        producto: true,
        lineaProduccion: true,
      },
    });

    // Si no hay producciones, retornar datos vacíos
    if (producciones.length === 0) {
      return { data: [], averageEfficiency: 0 };
    }

    // 2. Obtener todos los registros de producción por hora
    const registrosHora = await (prisma as any).produccionPorHora.findMany({
      where: {
        produccionId: {
          in: producciones.map(p => p.id),
        },
      },
    });

    // Si no hay registros por hora, retornar datos vacíos
    if (registrosHora.length === 0) {
      return { data: [], averageEfficiency: 0 };
    }

    // Crear un mapa para almacenar los datos agregados por producto y línea
    const produccionPorProductoLinea: Record<string, ProduccionAgregada> = {};

    // Procesamos cada registro por hora
    for (const registro of registrosHora) {
      // Buscar la producción asociada a este registro
      const produccion = producciones.find(p => p.id === registro.produccionId);
      if (!produccion) continue;

      const productoId = produccion.productoId;
      const lineaProduccionId = produccion.lineaProduccionId;
      const key = `${productoId}-${lineaProduccionId}`;

      if (!produccionPorProductoLinea[key]) {
        produccionPorProductoLinea[key] = {
          productoId,
          productoNombre: produccion.producto.nombre,
          lineaProduccionId,
          lineaProduccionNombre: produccion.lineaProduccion.nombre,
          totalCajas: 0,
          registros: 0
        };
      }

      produccionPorProductoLinea[key].totalCajas += registro.cajasProducidas;
      produccionPorProductoLinea[key].registros += 1;
    }

    // 3. Calculamos promedios y obtenemos velocidades planificadas
    const resultados = [];

    // Procesamos cada entrada del mapa
    for (const key in produccionPorProductoLinea) {
      const datos = produccionPorProductoLinea[key];
      
      // Calcular promedio de cajas por hora
      const promedioCajasHora = datos.registros > 0 ? datos.totalCajas / datos.registros : 0;

      // Buscar la velocidad planificada en ProductoEnLinea
      const productoEnLinea = await (prisma as any).productoEnLinea.findFirst({
        where: {
          productoId: datos.productoId,
          lineaProduccionId: datos.lineaProduccionId
        }
      });

      const velocidadPlan = productoEnLinea?.velocidadProduccion || 0;

      // Calcular eficiencia y desviación
      const eficiencia = velocidadPlan > 0 ? promedioCajasHora / velocidadPlan : 0;
      // Calculamos la desviación en % positiva o negativa
      const desviacion = velocidadPlan > 0 ? ((promedioCajasHora - velocidadPlan) / velocidadPlan) * 100 : 0;
      
      // Solo incluimos en resultados si tenemos velocidad planificada
      if (velocidadPlan > 0) {
        resultados.push({
          productoId: datos.productoId,
          productoNombre: datos.productoNombre,
          lineaProduccionId: datos.lineaProduccionId,
          lineaProduccionNombre: datos.lineaProduccionNombre,
          promedioCajasHora: Math.round(promedioCajasHora * 100) / 100,
          velocidadPlan,
          eficiencia: Math.round(eficiencia * 100) / 100,
          desviacion: Math.round(desviacion * 10) / 10,
          totalRegistros: datos.registros
        });
      }
    }

    // 4. Ordenar por desviación absoluta (mayor a menor)
    resultados.sort((a, b) => Math.abs(b.desviacion) - Math.abs(a.desviacion));

    // 5. Calcular eficiencia promedio
    const averageEfficiency = resultados.length > 0
      ? resultados.reduce((sum, item) => sum + item.eficiencia, 0) / resultados.length
      : 0;

    // 6. Obtener los N productos con mayor desviación si se ha especificado un límite
    const limitedResults = limit > 0 ? resultados.slice(0, limit) : resultados;

    return {
      data: limitedResults,
      averageEfficiency
    };
  } catch (error) {
    console.error("Error en getDetailedEfficiencyData:", error);
    return { data: [], averageEfficiency: 0 };
  }
} 