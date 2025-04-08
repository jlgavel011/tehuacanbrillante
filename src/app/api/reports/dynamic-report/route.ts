import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseISO, startOfDay, endOfDay, format } from "date-fns";
import { es } from "date-fns/locale";

// Tipos principales para filtros
type ReportFilters = {
  entidad_principal?: string;
  linea_produccion?: string[];
  producto?: string[];
  turno?: string[];
  tipo_paro?: string[];
  agrupacion?: string;
  visualizacion?: string;
  from?: string;
  to?: string;
};

// Estructura de respuesta
type ReportResponse = {
  kpis: {
    title: string;
    value: string | number;
    change?: {
      value: number;
      isPositive: boolean;
    };
    color: string;
  }[];
  chartData: any[];
  tableData: any[];
  columns: {
    key: string;
    title: string;
  }[];
};

// Colores para KPIs y gráficos
const COLORS = {
  success: "#10b981", // Emerald - Éxito/positivo
  danger: "#f43f5e",  // Rose - Peligro/negativo
  warning: "#f59e0b", // Amber - Advertencia
  info: "#6366f1",    // Indigo - Información
  primary: "#0ea5e9", // Sky blue - Principal
};

// Tipo para las materias primas con sus relaciones
type MateriaPrimaWithRelations = {
  id: string;
  nombre: string;
  productoMateriasPrimas: Array<{
    productoId: string;
    producto: {
      id: string;
      nombre: string;
    }
  }>;
  paros: Array<{
    duracionMinutos?: number;
    lineaProduccionId: string;
    lineaProduccion: {
      nombre: string;
    }
  }>;
};

// Tipo para paros de calidad con relaciones
type ParoCalidadWithRelations = {
  id: string;
  descripcion: string | null;
  tiempoMinutos: number;
  duracionMinutos?: number;
  fecha?: Date;
  fechaInicio: Date;
  fechaFin: Date | null;
  lineaProduccionId: string;
  lineaProduccion: {
    id?: string;
    nombre: string;
  };
  produccion?: {
    id: string;
    cajasProducidas: number;
    cajasPlanificadas: number;
    turno: number;
    producto: {
      id: string;
      nombre: string;
    }
  };
  // Otros campos que pueda tener el modelo
  createdAt?: Date;
  updatedAt?: Date;
  tipoParoId?: string;
  produccionId?: string;
  subsistemaId?: string | null;
  subsubsistemaId?: string | null;
};

export async function GET(request: Request) {
  try {
    // Obtener parámetros de filtro
    const { searchParams } = new URL(request.url);
    
    const filters: ReportFilters = {
      entidad_principal: searchParams.get('entidad_principal') || undefined,
      linea_produccion: searchParams.getAll('linea_produccion'),
      producto: searchParams.getAll('producto'),
      turno: searchParams.getAll('turno'),
      tipo_paro: searchParams.getAll('tipo_paro'),
      agrupacion: searchParams.get('agrupacion') || undefined,
      visualizacion: searchParams.get('visualizacion') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined
    };

    // Validar fechas
    let fromDate: Date;
    let toDate: Date;
    
    if (filters.from && filters.to) {
      fromDate = startOfDay(parseISO(filters.from));
      toDate = endOfDay(parseISO(filters.to));
    } else {
      // Periodo predeterminado: últimos 30 días
      toDate = new Date();
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
    }

    // Generar reporte según la entidad principal y agrupación seleccionada
    let report: ReportResponse;
    
    switch (filters.entidad_principal) {
      case 'produccion':
        report = await generateProduccionReport(filters, fromDate, toDate);
        break;
      case 'producto':
        report = await generateProductoReport(filters, fromDate, toDate);
        break;
      case 'linea':
        report = await generateLineaReport(filters, fromDate, toDate);
        break;
      case 'paro':
        report = await generateParoReport(filters, fromDate, toDate);
        break;
      case 'materia_prima':
        report = await generateMateriaPrimaReport(filters, fromDate, toDate);
        break;
      case 'desviacion_calidad':
        report = await generateDesviacionCalidadReport(filters, fromDate, toDate);
        break;
      default:
        // Reporte predeterminado
        report = await generateProduccionReport(filters, fromDate, toDate);
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generando reporte dinámico:', error);
    return NextResponse.json(
      { error: 'Error al generar el reporte dinámico' },
      { status: 500 }
    );
  }
}

// Generadores de reportes específicos por entidad

async function generateProduccionReport(
  filters: ReportFilters,
  fromDate: Date,
  toDate: Date
): Promise<ReportResponse> {
  // Construir la query base
  const where: any = {
    fechaProduccion: {
      gte: fromDate,
      lte: toDate,
    },
  };

  // Aplicar filtros adicionales
  if (filters.linea_produccion && filters.linea_produccion.length > 0) {
    where.lineaProduccionId = { in: filters.linea_produccion };
  }

  if (filters.producto && filters.producto.length > 0) {
    where.productoId = { in: filters.producto };
  }

  if (filters.turno && filters.turno.length > 0) {
    where.turno = { in: filters.turno.map(t => parseInt(t)) };
  }

  // Obtener datos de producción
  const producciones = await prisma.produccion.findMany({
    where,
    include: {
      lineaProduccion: {
        select: {
          nombre: true
        }
      },
      producto: {
        select: {
          nombre: true,
          tamaño: {
            select: {
              litros: true
            }
          }
        }
      }
    },
    orderBy: {
      fechaProduccion: 'asc'
    }
  });

  // Calcular KPIs
  const totalCajasProducidas = producciones.reduce((sum, prod) => sum + prod.cajasProducidas, 0);
  const totalCajasPlanificadas = producciones.reduce((sum, prod) => sum + prod.cajasPlanificadas, 0);
  const eficienciaPromedio = totalCajasPlanificadas > 0 ? (totalCajasProducidas / totalCajasPlanificadas) : 0;
  const totalLitros = producciones.reduce((sum, prod) => {
    const litrosPorCaja = prod.producto.tamaño.litros * (prod.cajasProducidas || 0);
    return sum + litrosPorCaja;
  }, 0);

  // Calcular comparación con periodo anterior (periodo de igual duración anterior al seleccionado)
  let comparacionCajas = { value: 0, isPositive: true };
  let comparacionEficiencia = { value: 0, isPositive: true };
  
  try {
    // Calcular el periodo anterior con la misma duración
    const duracionPeriodo = toDate.getTime() - fromDate.getTime();
    const periodoAnteriorFin = new Date(fromDate);
    const periodoAnteriorInicio = new Date(new Date(fromDate).getTime() - duracionPeriodo);
    
    // Consultar producción del periodo anterior
    const produccionesAnteriores = await prisma.produccion.findMany({
      where: {
        fechaProduccion: {
          gte: periodoAnteriorInicio,
          lte: periodoAnteriorFin,
        },
        // Aplicar mismos filtros que el periodo actual
        ...(filters.linea_produccion?.length ? { lineaProduccionId: { in: filters.linea_produccion } } : {}),
        ...(filters.producto?.length ? { productoId: { in: filters.producto } } : {}),
        ...(filters.turno?.length ? { turno: { in: filters.turno.map(t => parseInt(t)) } } : {})
      },
      include: {
        producto: {
          select: {
            tamaño: {
              select: {
                litros: true
              }
            }
          }
        }
      }
    });
    
    // Calcular métricas del periodo anterior
    const cajasProducidasAnteriores = produccionesAnteriores.reduce((sum, prod) => sum + prod.cajasProducidas, 0);
    const cajasPlanificadasAnteriores = produccionesAnteriores.reduce((sum, prod) => sum + prod.cajasPlanificadas, 0);
    const eficienciaAnterior = cajasPlanificadasAnteriores > 0 ? 
      (cajasProducidasAnteriores / cajasPlanificadasAnteriores) : 0;
    
    // Calcular diferencias porcentuales
    if (cajasProducidasAnteriores > 0) {
      const difCajas = ((totalCajasProducidas - cajasProducidasAnteriores) / cajasProducidasAnteriores) * 100;
      comparacionCajas = {
        value: Math.abs(parseFloat(difCajas.toFixed(1))),
        isPositive: difCajas >= 0
      };
    }
    
    if (eficienciaAnterior > 0) {
      const difEficiencia = ((eficienciaPromedio - eficienciaAnterior) / eficienciaAnterior) * 100;
      comparacionEficiencia = {
        value: Math.abs(parseFloat(difEficiencia.toFixed(1))),
        isPositive: difEficiencia >= 0
      };
    }
  } catch (error) {
    console.error('Error calculando comparaciones con periodo anterior:', error);
    // Mantener valores predeterminados si hay error
  }

  // Datos para gráficos y tabla según agrupación
  let chartData: any[] = [];
  let tableData: any[] = [];

  // Agrupar datos según el criterio seleccionado
  if (filters.agrupacion === 'dia') {
    // Agrupar por día
    const porDia = new Map<string, { 
      producidas: number; 
      planificadas: number; 
      fecha: Date;
    }>();
    
    for (const prod of producciones) {
      const dateStr = format(prod.fechaProduccion, 'yyyy-MM-dd');
      
      if (!porDia.has(dateStr)) {
        porDia.set(dateStr, { 
          producidas: 0, 
          planificadas: 0, 
          fecha: prod.fechaProduccion 
        });
      }
      
      const datos = porDia.get(dateStr)!;
      datos.producidas += prod.cajasProducidas;
      datos.planificadas += prod.cajasPlanificadas;
    }
    
    // Convertir a array ordenado por fecha
    chartData = Array.from(porDia.entries())
      .sort((a, b) => a[1].fecha.getTime() - b[1].fecha.getTime())
      .map(([dateStr, data]) => ({
        fecha: format(data.fecha, 'dd MMM', { locale: es }),
        Producción: data.producidas,
        Planificado: data.planificadas,
      }));
    
    // Generar datos para la tabla
    tableData = Array.from(porDia.entries()).map(([dateStr, data], index) => {
      const eficiencia = data.planificadas > 0 ? (data.producidas / data.planificadas) * 100 : 0;
      
      return {
        id: index + 1,
        fecha: format(data.fecha, 'dd/MM/yyyy'),
        producidas: data.producidas,
        planificadas: data.planificadas,
        eficiencia: `${eficiencia.toFixed(1)}%`,
        litros: totalLitros / porDia.size, // Aproximación simplificada
      };
    });
  } else if (filters.agrupacion === 'linea') {
    // Agrupar por línea de producción
    const porLinea = new Map<string, { 
      id: string;
      nombre: string;
      producidas: number; 
      planificadas: number;
    }>();
    
    for (const prod of producciones) {
      if (!porLinea.has(prod.lineaProduccionId)) {
        porLinea.set(prod.lineaProduccionId, { 
          id: prod.lineaProduccionId,
          nombre: prod.lineaProduccion.nombre,
          producidas: 0, 
          planificadas: 0
        });
      }
      
      const datos = porLinea.get(prod.lineaProduccionId)!;
      datos.producidas += prod.cajasProducidas;
      datos.planificadas += prod.cajasPlanificadas;
    }
    
    // Datos para gráficos y tabla
    chartData = Array.from(porLinea.values()).map((data) => ({
      linea: data.nombre,
      Producción: data.producidas,
      Planificado: data.planificadas,
    }));
    
    tableData = Array.from(porLinea.values()).map((data, index) => {
      const eficiencia = data.planificadas > 0 ? (data.producidas / data.planificadas) * 100 : 0;
      
      return {
        id: index + 1,
        linea: data.nombre,
        producidas: data.producidas,
        planificadas: data.planificadas,
        eficiencia: `${eficiencia.toFixed(1)}%`,
      };
    });
  } else if (filters.agrupacion === 'producto') {
    // Agrupar por producto
    const porProducto = new Map<string, { 
      id: string;
      nombre: string;
      producidas: number; 
      planificadas: number;
    }>();
    
    for (const prod of producciones) {
      if (!porProducto.has(prod.productoId)) {
        porProducto.set(prod.productoId, { 
          id: prod.productoId,
          nombre: prod.producto.nombre,
          producidas: 0, 
          planificadas: 0
        });
      }
      
      const datos = porProducto.get(prod.productoId)!;
      datos.producidas += prod.cajasProducidas;
      datos.planificadas += prod.cajasPlanificadas;
    }
    
    // Datos para gráficos y tabla
    chartData = Array.from(porProducto.values()).map((data) => ({
      producto: data.nombre,
      Producción: data.producidas,
      Planificado: data.planificadas,
    }));
    
    tableData = Array.from(porProducto.values()).map((data, index) => {
      const eficiencia = data.planificadas > 0 ? (data.producidas / data.planificadas) * 100 : 0;
      
      return {
        id: index + 1,
        producto: data.nombre,
        producidas: data.producidas,
        planificadas: data.planificadas,
        eficiencia: `${eficiencia.toFixed(1)}%`,
      };
    });
  } else if (filters.agrupacion === 'turno') {
    // Agrupar por turno
    const porTurno = new Map<number, { 
      turno: number;
      producidas: number; 
      planificadas: number;
    }>();
    
    for (const prod of producciones) {
      if (!porTurno.has(prod.turno)) {
        porTurno.set(prod.turno, { 
          turno: prod.turno,
          producidas: 0, 
          planificadas: 0
        });
      }
      
      const datos = porTurno.get(prod.turno)!;
      datos.producidas += prod.cajasProducidas;
      datos.planificadas += prod.cajasPlanificadas;
    }
    
    // Datos para gráficos y tabla
    chartData = Array.from(porTurno.values()).map((data) => ({
      turno: `Turno ${data.turno}`,
      Producción: data.producidas,
      Planificado: data.planificadas,
    }));
    
    tableData = Array.from(porTurno.values()).map((data, index) => {
      const eficiencia = data.planificadas > 0 ? (data.producidas / data.planificadas) * 100 : 0;
      
      return {
        id: index + 1,
        turno: `Turno ${data.turno}`,
        producidas: data.producidas,
        planificadas: data.planificadas,
        eficiencia: `${eficiencia.toFixed(1)}%`,
      };
    });
  }

  // Definir estructura de columnas para la tabla
  const columns: any[] = [];
  
  if (filters.agrupacion === 'dia') {
    columns.push({ key: 'fecha', title: 'Fecha' });
  } else if (filters.agrupacion === 'linea') {
    columns.push({ key: 'linea', title: 'Línea de Producción' });
  } else if (filters.agrupacion === 'producto') {
    columns.push({ key: 'producto', title: 'Producto' });
  } else if (filters.agrupacion === 'turno') {
    columns.push({ key: 'turno', title: 'Turno' });
  }
  
  columns.push(
    { key: 'producidas', title: 'Cajas Producidas' },
    { key: 'planificadas', title: 'Cajas Planificadas' },
    { key: 'eficiencia', title: 'Eficiencia' }
  );

  // Construir respuesta final
  return {
    kpis: [
      { 
        title: "Total Cajas Producidas",
        value: totalCajasProducidas,
        change: comparacionCajas,
        color: "#4ade80" 
      },
      { 
        title: "Eficiencia",
        value: `${(eficienciaPromedio * 100).toFixed(1)}%`,
        change: comparacionEficiencia,
        color: "#4ade80" 
      },
      { 
        title: "Total Litros",
        value: `${totalLitros.toLocaleString()} L`,
        color: "#4ade80" 
      },
      { 
        title: "Cajas Promedio por Día",
        value: producciones.length > 0 ? Math.round(totalCajasProducidas / (producciones.length / 24)) : 0,
        color: "#4ade80" 
      }
    ],
    chartData,
    tableData,
    columns
  };
}

// Función para generar reportes de productos
async function generateProductoReport(
  filters: ReportFilters,
  fromDate: Date,
  toDate: Date
): Promise<ReportResponse> {
  // Construir la query base
  const where: any = {
    fechaProduccion: {
      gte: fromDate,
      lte: toDate,
    },
  };

  // Aplicar filtros adicionales
  if (filters.linea_produccion && filters.linea_produccion.length > 0) {
    where.lineaProduccionId = { in: filters.linea_produccion };
  }

  if (filters.producto && filters.producto.length > 0) {
    where.productoId = { in: filters.producto };
  }

  if (filters.turno && filters.turno.length > 0) {
    where.turno = { in: filters.turno.map(t => parseInt(t)) };
  }

  // Obtener datos de producción agrupados por producto
  const producciones = await prisma.produccion.findMany({
    where,
    include: {
      producto: {
        select: {
          id: true,
          nombre: true,
          tamaño: {
            select: {
              litros: true
            }
          }
        }
      }
    },
  });

  // Agrupar datos por producto
  const productoMap = new Map<string, {
    id: string;
    nombre: string;
    cajasProducidas: number;
    cajasPlanificadas: number;
    litros: number;
    eficiencia: number;
  }>();

  for (const prod of producciones) {
    if (!productoMap.has(prod.productoId)) {
      productoMap.set(prod.productoId, {
        id: prod.productoId,
        nombre: prod.producto.nombre,
        cajasProducidas: 0,
        cajasPlanificadas: 0,
        litros: 0,
        eficiencia: 0
      });
    }

    const producto = productoMap.get(prod.productoId)!;
    producto.cajasProducidas += prod.cajasProducidas;
    producto.cajasPlanificadas += prod.cajasPlanificadas;
    producto.litros += prod.cajasProducidas * prod.producto.tamaño.litros;
  }

  // Calcular eficiencia para cada producto
  for (const producto of Array.from(productoMap.values())) {
    producto.eficiencia = producto.cajasPlanificadas > 0 
      ? (producto.cajasProducidas / producto.cajasPlanificadas * 100) 
      : 0;
  }

  // Ordenar productos por cajas producidas
  const productosOrdenados = Array.from(productoMap.values())
    .sort((a, b) => b.cajasProducidas - a.cajasProducidas);

  // Calcular KPIs
  const totalProductos = productosOrdenados.length;
  const totalCajas = productosOrdenados.reduce((sum, p) => sum + p.cajasProducidas, 0);
  const totalLitros = productosOrdenados.reduce((sum, p) => sum + p.litros, 0);
  const eficienciaPromedio = productosOrdenados.reduce((sum, p) => sum + p.eficiencia, 0) / 
    (totalProductos || 1);
  
  const productoMasProducido = productosOrdenados.length > 0 
    ? productosOrdenados[0].nombre 
    : "N/A";

  // Datos para gráficos
  const chartData = productosOrdenados.slice(0, 10).map(p => ({
    producto: p.nombre,
    Producción: p.cajasProducidas
  }));

  // Datos para tabla
  const tableData = productosOrdenados.map((p, idx) => ({
    id: idx + 1,
    producto: p.nombre,
    producidas: p.cajasProducidas,
    litros: Math.round(p.litros),
    eficiencia: `${p.eficiencia.toFixed(1)}%`
  }));

  // Definir columnas
  const columns = [
    { key: "producto", title: "Producto" },
    { key: "producidas", title: "Cajas Producidas" },
    { key: "litros", title: "Litros" },
    { key: "eficiencia", title: "Eficiencia" }
  ];

  return {
    kpis: [
      { title: "Total Productos", value: totalProductos, color: "#4ade80" },
      { title: "Producto más producido", value: productoMasProducido, color: "#4ade80" },
      { title: "Litros Totales", value: `${totalLitros.toLocaleString()} L`, color: "#4ade80" },
      { title: "Eficiencia por Producto", value: `${eficienciaPromedio.toFixed(1)}%`, color: "#4ade80" }
    ],
    chartData,
    tableData,
    columns
  };
}

// Función para generar reportes de líneas de producción
async function generateLineaReport(
  filters: ReportFilters,
  fromDate: Date,
  toDate: Date
): Promise<ReportResponse> {
  // Construir la query base
  const where: any = {
    fechaProduccion: {
      gte: fromDate,
      lte: toDate,
    },
  };

  // Aplicar filtros adicionales
  if (filters.linea_produccion && filters.linea_produccion.length > 0) {
    where.lineaProduccionId = { in: filters.linea_produccion };
  }

  if (filters.producto && filters.producto.length > 0) {
    where.productoId = { in: filters.producto };
  }

  if (filters.turno && filters.turno.length > 0) {
    where.turno = { in: filters.turno.map(t => parseInt(t)) };
  }

  // Obtener datos de producción agrupados por línea
  const producciones = await prisma.produccion.findMany({
    where,
    include: {
      lineaProduccion: {
        select: {
          id: true,
          nombre: true
        }
      }
    },
  });

  // Obtener datos de paros
  const paros = await prisma.paro.findMany({
    where: {
      produccion: {
        fechaProduccion: {
          gte: fromDate,
          lte: toDate,
        }
      },
      lineaProduccionId: filters.linea_produccion && filters.linea_produccion.length > 0 
        ? { in: filters.linea_produccion } 
        : undefined
    },
    include: {
      lineaProduccion: true
    }
  });

  // Agrupar datos por línea
  const lineaMap = new Map<string, {
    id: string;
    nombre: string;
    cajasProducidas: number;
    cajasPlanificadas: number;
    eficiencia: number;
    tiempoProduccion: number; // en horas
    cantidadParos: number;
  }>();

  for (const prod of producciones) {
    if (!lineaMap.has(prod.lineaProduccionId)) {
      lineaMap.set(prod.lineaProduccionId, {
        id: prod.lineaProduccionId,
        nombre: prod.lineaProduccion.nombre,
        cajasProducidas: 0,
        cajasPlanificadas: 0,
        eficiencia: 0,
        tiempoProduccion: 0,
        cantidadParos: 0
      });
    }

    const linea = lineaMap.get(prod.lineaProduccionId)!;
    linea.cajasProducidas += prod.cajasProducidas;
    linea.cajasPlanificadas += prod.cajasPlanificadas;
    // Estimación simple del tiempo de producción en horas
    linea.tiempoProduccion += 8; // Asumiendo turnos de 8 horas
  }

  // Contar paros por línea
  for (const paro of paros) {
    if (lineaMap.has(paro.lineaProduccionId)) {
      const linea = lineaMap.get(paro.lineaProduccionId)!;
      linea.cantidadParos += 1;
    }
  }

  // Calcular eficiencia para cada línea
  for (const linea of Array.from(lineaMap.values())) {
    linea.eficiencia = linea.cajasPlanificadas > 0 
      ? (linea.cajasProducidas / linea.cajasPlanificadas * 100) 
      : 0;
  }

  // Ordenar líneas por eficiencia
  const lineasOrdenadas = Array.from(lineaMap.values())
    .sort((a, b) => b.eficiencia - a.eficiencia);

  // Calcular KPIs
  const totalLineas = lineasOrdenadas.length;
  const lineaMasEficiente = lineasOrdenadas.length > 0 
    ? lineasOrdenadas[0].nombre 
    : "N/A";
  const eficienciaPromedio = lineasOrdenadas.reduce((sum, l) => sum + l.eficiencia, 0) / 
    (totalLineas || 1);
  const tiempoProductivoTotal = lineasOrdenadas.reduce((sum, l) => sum + l.tiempoProduccion, 0);

  // Datos para gráficos
  const chartData = lineasOrdenadas.map(l => ({
    linea: l.nombre,
    Eficiencia: parseFloat(l.eficiencia.toFixed(1))
  }));

  // Datos para tabla
  const tableData = lineasOrdenadas.map((l, idx) => ({
    id: idx + 1,
    linea: l.nombre,
    eficiencia: `${l.eficiencia.toFixed(1)}%`,
    producidas: l.cajasProducidas,
    tiempoProduccion: Math.round(l.tiempoProduccion),
    paros: l.cantidadParos
  }));

  // Definir columnas
  const columns = [
    { key: "linea", title: "Línea" },
    { key: "eficiencia", title: "Eficiencia" },
    { key: "producidas", title: "Cajas Producidas" },
    { key: "tiempoProduccion", title: "Tiempo Producción (hrs)" },
    { key: "paros", title: "Total Paros" }
  ];

  return {
    kpis: [
      { title: "Total Líneas", value: totalLineas, color: "#4ade80" },
      { title: "Línea más eficiente", value: lineaMasEficiente, color: "#4ade80" },
      { title: "Eficiencia Promedio", value: `${eficienciaPromedio.toFixed(1)}%`, color: "#4ade80" },
      { title: "Tiempo Productivo", value: `${tiempoProductivoTotal} hrs`, color: "#4ade80" }
    ],
    chartData,
    tableData,
    columns
  };
}

// Función para generar reportes de paros
async function generateParoReport(
  filters: ReportFilters,
  fromDate: Date,
  toDate: Date
): Promise<ReportResponse> {
  // Construir la query base para paros
  const where: any = {
    produccion: {
      fechaProduccion: {
        gte: fromDate,
        lte: toDate,
      }
    }
  };

  // Aplicar filtros adicionales
  if (filters.linea_produccion && filters.linea_produccion.length > 0) {
    where.lineaProduccionId = { in: filters.linea_produccion };
  }

  if (filters.tipo_paro && filters.tipo_paro.length > 0) {
    where.tipoParoId = { in: filters.tipo_paro };
  }

  // Obtener datos de paros con sus relaciones
  const paros = await prisma.paro.findMany({
    where,
    include: {
      tipoParo: {
        select: {
          id: true,
          nombre: true
        }
      },
      lineaProduccion: {
        select: {
          id: true,
          nombre: true
        }
      }
    }
  });

  // Agrupar datos por tipo de paro
  const tipoParoMap = new Map<string, {
    id: string;
    nombre: string;
    cantidad: number;
    tiempoMinutos: number;
  }>();

  for (const paro of paros) {
    if (!tipoParoMap.has(paro.tipoParoId)) {
      tipoParoMap.set(paro.tipoParoId, {
        id: paro.tipoParoId,
        nombre: paro.tipoParo?.nombre || `Tipo ${paro.tipoParoId}`,
        cantidad: 0,
        tiempoMinutos: 0
      });
    }

    const tipoParo = tipoParoMap.get(paro.tipoParoId)!;
    tipoParo.cantidad += 1;
    tipoParo.tiempoMinutos += paro.tiempoMinutos;
  }

  // Ordenar tipos de paro por tiempo total
  const tiposParoOrdenados = Array.from(tipoParoMap.values())
    .sort((a, b) => b.tiempoMinutos - a.tiempoMinutos);

  // Calcular KPIs
  const totalParos = paros.length;
  const tiempoTotalMinutos = paros.reduce((sum, p) => sum + p.tiempoMinutos, 0);
  const tiempoTotalHoras = tiempoTotalMinutos / 60;
  const tiempoPromedioMinutos = totalParos > 0 ? tiempoTotalMinutos / totalParos : 0;
  
  const paroMasFrecuente = tiposParoOrdenados.length > 0 
    ? tiposParoOrdenados[0].nombre 
    : "N/A";

  // Datos para gráficos
  const chartData = tiposParoOrdenados.map(tp => ({
    tipo: tp.nombre,
    Tiempo: parseFloat((tp.tiempoMinutos / 60).toFixed(1))
  }));

  // Datos para tabla
  const tableData = tiposParoOrdenados.map((tp, idx) => {
    const tiempoHoras = tp.tiempoMinutos / 60;
    const impactoProduccion = tiempoTotalMinutos > 0 
      ? (tp.tiempoMinutos / tiempoTotalMinutos * 100) 
      : 0;
    const tiempoPromedio = tp.cantidad > 0 
      ? tp.tiempoMinutos / tp.cantidad 
      : 0;
    
    return {
      id: idx + 1,
      tipo: tp.nombre,
      cantidad: tp.cantidad,
      tiempoTotal: `${tiempoHoras.toFixed(1)} hrs`,
      tiempoPromedio: `${tiempoPromedio.toFixed(0)} min`,
      impacto: `${impactoProduccion.toFixed(1)}%`
    };
  });

  // Definir columnas
  const columns = [
    { key: "tipo", title: "Tipo de Paro" },
    { key: "cantidad", title: "Cantidad" },
    { key: "tiempoTotal", title: "Tiempo Total" },
    { key: "tiempoPromedio", title: "Tiempo Promedio" },
    { key: "impacto", title: "Impacto en Producción" }
  ];

  return {
    kpis: [
      { title: "Total Paros", value: totalParos, color: "#f87171" },
      { title: "Tiempo Total", value: `${tiempoTotalHoras.toFixed(1)} hrs`, color: "#f87171" },
      { title: "Paro más frecuente", value: paroMasFrecuente, color: "#f87171" },
      { title: "Tiempo promedio", value: `${tiempoPromedioMinutos.toFixed(0)} min`, color: "#f87171" }
    ],
    chartData,
    tableData,
    columns
  };
}

// Nuevo generador para reportes de materia prima
async function generateMateriaPrimaReport(
  filters: ReportFilters,
  fromDate: Date,
  toDate: Date
): Promise<ReportResponse> {
  // Construir la query base para materias primas
  let materiasPrimasQuery: any = {
    include: {
      productoMateriasPrimas: {
        include: {
          producto: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      },
      paros: {
        where: {
          fecha: {
            gte: fromDate,
            lte: toDate
          }
        },
        include: {
          lineaProduccion: {
            select: {
              nombre: true
            }
          }
        }
      }
    }
  };

  // Filtrar materias primas por sus productos relacionados
  if (filters.producto && filters.producto.length > 0) {
    materiasPrimasQuery = {
      ...materiasPrimasQuery,
      where: {
        ...materiasPrimasQuery.where,
        productoMateriasPrimas: {
          some: {
            productoId: {
              in: filters.producto
            }
          }
        }
      }
    };
  }

  // Si se filtra por línea, filtrar los paros de esas líneas
  if (filters.linea_produccion && filters.linea_produccion.length > 0) {
    if (!materiasPrimasQuery.where) {
      materiasPrimasQuery.where = {};
    }
    
    materiasPrimasQuery.where = {
      ...materiasPrimasQuery.where,
      paros: {
        some: {
          lineaProduccionId: {
            in: filters.linea_produccion
          }
        }
      }
    };
  }

  // Obtener datos de materias primas
  const materiasPrimas = await prisma.materiaPrima.findMany(materiasPrimasQuery) as MateriaPrimaWithRelations[];

  // Calcular KPIs relevantes para materias primas
  const totalMateriasPrimas = materiasPrimas.length;
  const totalProductosRelacionados = new Set(
    materiasPrimas.flatMap(mp => 
      mp.productoMateriasPrimas.map(pmp => pmp.producto.id)
    )
  ).size;
  
  const totalParosRelacionados = materiasPrimas.reduce(
    (sum, mp) => sum + mp.paros.length, 0
  );
  
  // Calcular duración total de paros relacionados con materias primas
  let duracionTotalParos = 0;
  materiasPrimas.forEach(mp => {
    mp.paros.forEach(paro => {
      // Asumiendo que hay un campo duracionMinutos
      duracionTotalParos += paro.duracionMinutos || 0;
    });
  });

  // Preparar datos para tablas y gráficos según agrupación
  let tableData: any[] = [];
  let chartData: any[] = [];
  
  // Agrupar por productos que las usan
  if (filters.agrupacion === 'producto') {
    // Contar cuántos productos usan cada materia prima
    const porProducto = new Map<string, { 
      nombreProducto: string; 
      cantidad: number;
      materiaPrima: string;
      materiaPrimaId: string;
    }>();
    
    for (const mp of materiasPrimas) {
      for (const pmp of mp.productoMateriasPrimas) {
        const key = `${mp.id}-${pmp.producto.id}`;
        
        if (!porProducto.has(key)) {
          porProducto.set(key, { 
            nombreProducto: pmp.producto.nombre,
            cantidad: 0,
            materiaPrima: mp.nombre,
            materiaPrimaId: mp.id
          });
        }
        
        porProducto.get(key)!.cantidad += 1;
      }
    }
    
    chartData = Array.from(porProducto.values()).map(item => ({
      producto: item.nombreProducto,
      materiaPrima: item.materiaPrima,
      cantidad: item.cantidad
    }));
    
    tableData = chartData;
  } 
  // Agrupar por paros relacionados
  else if (filters.agrupacion === 'paro') {
    // Contar paros por materia prima
    const porParo = new Map<string, { 
      materiaPrima: string; 
      paros: number;
      duracionTotal: number;
      impacto: number;
    }>();
    
    for (const mp of materiasPrimas) {
      if (!porParo.has(mp.id)) {
        porParo.set(mp.id, { 
          materiaPrima: mp.nombre,
          paros: 0,
          duracionTotal: 0,
          impacto: 0
        });
      }
      
      const record = porParo.get(mp.id)!;
      record.paros += mp.paros.length;
      
      let duracion = 0;
      mp.paros.forEach(paro => {
        duracion += paro.duracionMinutos || 0;
      });
      
      record.duracionTotal = duracion;
      // Calcular impacto como porcentaje del tiempo total de paros
      record.impacto = duracionTotalParos > 0 ? (duracion / duracionTotalParos) * 100 : 0;
    }
    
    chartData = Array.from(porParo.values()).map(item => ({
      materiaPrima: item.materiaPrima,
      paros: item.paros,
      duracionTotal: item.duracionTotal,
      impacto: item.impacto.toFixed(2) + '%'
    }));
    
    tableData = chartData;
  }
  // Agrupar por línea de producción
  else if (filters.agrupacion === 'linea') {
    // Contar paros por línea y materia prima
    const porLinea = new Map<string, { 
      materiaPrima: string; 
      linea: string;
      paros: number;
      duracionTotal: number;
    }>();
    
    for (const mp of materiasPrimas) {
      for (const paro of mp.paros) {
        const key = `${mp.id}-${paro.lineaProduccionId}`;
        
        if (!porLinea.has(key)) {
          porLinea.set(key, { 
            materiaPrima: mp.nombre,
            linea: paro.lineaProduccion.nombre,
            paros: 0,
            duracionTotal: 0
          });
        }
        
        const record = porLinea.get(key)!;
        record.paros += 1;
        record.duracionTotal += paro.duracionMinutos || 0;
      }
    }
    
    chartData = Array.from(porLinea.values()).map(item => ({
      materiaPrima: item.materiaPrima,
      linea: item.linea,
      paros: item.paros,
      duracionHoras: (item.duracionTotal / 60).toFixed(2)
    }));
    
    tableData = chartData;
  }
  // Por defecto, listar todas las materias primas
  else {
    tableData = materiasPrimas.map(mp => {
      // Contar productos que usan esta materia prima
      const productosQueUsan = mp.productoMateriasPrimas.length;
      
      // Calcular duración total de paros para esta materia prima
      let duracionParos = 0;
      mp.paros.forEach(paro => {
        duracionParos += paro.duracionMinutos || 0;
      });
      
      return {
        id: mp.id,
        materiaPrima: mp.nombre,
        productosRelacionados: productosQueUsan,
        parosRelacionados: mp.paros.length,
        duracionTotalParos: duracionParos > 0 ? `${(duracionParos / 60).toFixed(2)} hrs` : '0 hrs'
      };
    });
    
    chartData = tableData.map(item => ({
      materiaPrima: item.materiaPrima,
      productosRelacionados: item.productosRelacionados,
      parosRelacionados: item.parosRelacionados
    }));
  }

  // Determinar columnas según el tipo de agrupación
  let columns = [];
  
  if (filters.agrupacion === 'producto') {
    columns = [
      { key: 'materiaPrima', title: 'Materia Prima' },
      { key: 'producto', title: 'Producto' },
      { key: 'cantidad', title: 'Cantidad' }
    ];
  } else if (filters.agrupacion === 'paro') {
    columns = [
      { key: 'materiaPrima', title: 'Materia Prima' },
      { key: 'paros', title: 'Paros' },
      { key: 'duracionTotal', title: 'Duración (minutos)' },
      { key: 'impacto', title: 'Impacto (%)' }
    ];
  } else if (filters.agrupacion === 'linea') {
    columns = [
      { key: 'materiaPrima', title: 'Materia Prima' },
      { key: 'linea', title: 'Línea de Producción' },
      { key: 'paros', title: 'Paros' },
      { key: 'duracionHoras', title: 'Duración (horas)' }
    ];
  } else {
    columns = [
      { key: 'materiaPrima', title: 'Materia Prima' },
      { key: 'productosRelacionados', title: 'Productos que la usan' },
      { key: 'parosRelacionados', title: 'Paros relacionados' },
      { key: 'duracionTotalParos', title: 'Duración total' }
    ];
  }

  // Armar reporte completo
  return {
    kpis: [
      {
        title: "Materias Primas",
        value: totalMateriasPrimas,
        color: COLORS.primary
      },
      {
        title: "Productos Relacionados",
        value: totalProductosRelacionados,
        color: COLORS.info
      },
      {
        title: "Paros Relacionados",
        value: totalParosRelacionados,
        color: COLORS.warning
      },
      {
        title: "Duración Paros",
        value: `${(duracionTotalParos / 60).toFixed(2)} hrs`,
        color: COLORS.danger
      }
    ],
    chartData,
    tableData,
    columns
  };
}

// Nuevo generador para reportes de desviaciones de calidad
async function generateDesviacionCalidadReport(
  filters: ReportFilters,
  fromDate: Date,
  toDate: Date
): Promise<ReportResponse> {
  // Definir un reporte que consulta desviaciones de calidad a través de los paros asociados
  // ya que parece que no hay una tabla específica de desviaciones
  
  // Construir el query para paros relacionados con calidad
  let parosQuery: any = {
    where: {
      fecha: {
        gte: fromDate,
        lte: toDate
      },
      descripcion: {
        contains: 'calidad',
        mode: 'insensitive'
      }
    },
    include: {
      lineaProduccion: {
        select: {
          id: true,
          nombre: true
        }
      },
      produccion: {
        select: {
          id: true,
          cajasProducidas: true,
          cajasPlanificadas: true,
          turno: true,
          producto: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      }
    }
  };

  // Aplicar filtros adicionales
  if (filters.linea_produccion && filters.linea_produccion.length > 0) {
    parosQuery.where.lineaProduccionId = { in: filters.linea_produccion };
  }

  if (filters.producto && filters.producto.length > 0) {
    parosQuery.where.produccion = {
      productoId: { in: filters.producto }
    };
  }

  // Obtener los paros relacionados con desviaciones de calidad
  const parosCalidad = await prisma.paro.findMany(parosQuery) as unknown as ParoCalidadWithRelations[];

  // Calcular KPIs
  const totalDesviaciones = parosCalidad.length;
  
  let duracionTotalMinutos = 0;
  parosCalidad.forEach(paro => {
    duracionTotalMinutos += paro.duracionMinutos || paro.tiempoMinutos || 0;
  });
  
  const duracionPromedio = totalDesviaciones > 0 ? duracionTotalMinutos / totalDesviaciones : 0;
  
  // Calcular el impacto en la producción (cajas no producidas)
  let impactoProduccion = 0;
  parosCalidad.forEach(paro => {
    if (paro.produccion && paro.produccion.cajasPlanificadas > paro.produccion.cajasProducidas) {
      impactoProduccion += (paro.produccion.cajasPlanificadas - paro.produccion.cajasProducidas);
    }
  });

  // Categorizar los tipos de desviaciones de calidad (usando descripciones)
  const tiposDesviaciones = new Map<string, number>();
  parosCalidad.forEach(paro => {
    // Tratar de extraer tipo de desviación de la descripción
    let tipoDesviacion = "Otro";
    
    const descripcion = (paro.descripcion || '').toLowerCase();
    if (descripcion.includes('microbia')) tipoDesviacion = 'Contaminación microbiana';
    else if (descripcion.includes('color') || descripcion.includes('visual')) tipoDesviacion = 'Aspecto visual';
    else if (descripcion.includes('sabor')) tipoDesviacion = 'Sabor';
    else if (descripcion.includes('ph')) tipoDesviacion = 'PH';
    else if (descripcion.includes('envase') || descripcion.includes('tapa')) tipoDesviacion = 'Envase/tapa';
    else if (descripcion.includes('llenado')) tipoDesviacion = 'Llenado';
    else if (descripcion.includes('partícula') || descripcion.includes('particula')) tipoDesviacion = 'Partículas extrañas';
    else if (descripcion.includes('etiqueta')) tipoDesviacion = 'Etiquetado';
    
    tiposDesviaciones.set(
      tipoDesviacion, 
      (tiposDesviaciones.get(tipoDesviacion) || 0) + 1
    );
  });

  // Preparar datos para tablas y gráficos según agrupación
  let tableData: any[] = [];
  let chartData: any[] = [];
  
  // Agrupar por línea de producción
  if (filters.agrupacion === 'linea') {
    // Contar desviaciones por línea
    const porLinea = new Map<string, { 
      linea: string; 
      desviaciones: number;
      duracion: number;
      impacto: number;
    }>();
    
    for (const paro of parosCalidad) {
      const lineaId = paro.lineaProduccionId;
      
      if (!porLinea.has(lineaId)) {
        porLinea.set(lineaId, { 
          linea: paro.lineaProduccion.nombre,
          desviaciones: 0,
          duracion: 0,
          impacto: 0
        });
      }
      
      const record = porLinea.get(lineaId)!;
      record.desviaciones += 1;
      record.duracion += paro.duracionMinutos || 0;
      
      if (paro.produccion && paro.produccion.cajasPlanificadas > paro.produccion.cajasProducidas) {
        record.impacto += (paro.produccion.cajasPlanificadas - paro.produccion.cajasProducidas);
      }
    }
    
    chartData = Array.from(porLinea.values()).map(item => ({
      linea: item.linea,
      desviaciones: item.desviaciones,
      duracionHoras: (item.duracion / 60).toFixed(1),
      impactoCajas: item.impacto
    }));
    
    tableData = chartData;
  } 
  // Agrupar por producto
  else if (filters.agrupacion === 'producto') {
    // Contar desviaciones por producto
    const porProducto = new Map<string, { 
      producto: string; 
      desviaciones: number;
      duracion: number;
    }>();
    
    for (const paro of parosCalidad) {
      if (paro.produccion && paro.produccion.producto) {
        const productoId = paro.produccion.producto.id;
        
        if (!porProducto.has(productoId)) {
          porProducto.set(productoId, { 
            producto: paro.produccion.producto.nombre,
            desviaciones: 0,
            duracion: 0
          });
        }
        
        const record = porProducto.get(productoId)!;
        record.desviaciones += 1;
        record.duracion += paro.duracionMinutos || 0;
      }
    }
    
    chartData = Array.from(porProducto.values()).map(item => ({
      producto: item.producto,
      desviaciones: item.desviaciones,
      duracionHoras: (item.duracion / 60).toFixed(1)
    }));
    
    tableData = chartData;
  }
  // Agrupar por turno
  else if (filters.agrupacion === 'turno') {
    // Contar desviaciones por turno
    const porTurno = new Map<number, { 
      turno: number; 
      desviaciones: number;
      duracion: number;
    }>();
    
    for (const paro of parosCalidad) {
      if (paro.produccion) {
        const turno = paro.produccion.turno;
        
        if (!porTurno.has(turno)) {
          porTurno.set(turno, { 
            turno,
            desviaciones: 0,
            duracion: 0
          });
        }
        
        const record = porTurno.get(turno)!;
        record.desviaciones += 1;
        record.duracion += paro.duracionMinutos || 0;
      }
    }
    
    chartData = Array.from(porTurno.values()).map(item => ({
      turno: `Turno ${item.turno}`,
      desviaciones: item.desviaciones,
      duracionHoras: (item.duracion / 60).toFixed(1)
    }));
    
    tableData = chartData;
  }
  // Por defecto, agrupar por tipo de desviación
  else {
    chartData = Array.from(tiposDesviaciones.entries()).map(([tipo, cantidad]) => ({
      tipoDesviacion: tipo,
      cantidad
    }));
    
    // Preparar datos detallados para la tabla
    tableData = parosCalidad.map(paro => {
      let tipoDesviacion = "Otro";
      
      const descripcion = (paro.descripcion || '').toLowerCase();
      if (descripcion.includes('microbia')) tipoDesviacion = 'Contaminación microbiana';
      else if (descripcion.includes('color') || descripcion.includes('visual')) tipoDesviacion = 'Aspecto visual';
      else if (descripcion.includes('sabor')) tipoDesviacion = 'Sabor';
      else if (descripcion.includes('ph')) tipoDesviacion = 'PH';
      else if (descripcion.includes('envase') || descripcion.includes('tapa')) tipoDesviacion = 'Envase/tapa';
      else if (descripcion.includes('llenado')) tipoDesviacion = 'Llenado';
      else if (descripcion.includes('partícula') || descripcion.includes('particula')) tipoDesviacion = 'Partículas extrañas';
      else if (descripcion.includes('etiqueta')) tipoDesviacion = 'Etiquetado';
      
      return {
        id: paro.id,
        fecha: format(paro.fechaInicio, 'dd/MM/yyyy'),
        lineaProduccion: paro.lineaProduccion.nombre,
        producto: paro.produccion ? paro.produccion.producto.nombre : 'N/A',
        tipoDesviacion,
        descripcion: paro.descripcion || 'Sin descripción',
        duracionMinutos: paro.duracionMinutos || paro.tiempoMinutos || 0,
        impactoCajas: paro.produccion ? 
          Math.max(0, paro.produccion.cajasPlanificadas - paro.produccion.cajasProducidas) : 0
      };
    });
  }

  // Determinar columnas según el tipo de agrupación
  let columns = [];
  
  if (filters.agrupacion === 'linea') {
    columns = [
      { key: 'linea', title: 'Línea de Producción' },
      { key: 'desviaciones', title: 'Desviaciones' },
      { key: 'duracionHoras', title: 'Duración (horas)' },
      { key: 'impactoCajas', title: 'Impacto (cajas)' }
    ];
  } else if (filters.agrupacion === 'producto') {
    columns = [
      { key: 'producto', title: 'Producto' },
      { key: 'desviaciones', title: 'Desviaciones' },
      { key: 'duracionHoras', title: 'Duración (horas)' }
    ];
  } else if (filters.agrupacion === 'turno') {
    columns = [
      { key: 'turno', title: 'Turno' },
      { key: 'desviaciones', title: 'Desviaciones' },
      { key: 'duracionHoras', title: 'Duración (horas)' }
    ];
  } else {
    columns = [
      { key: 'fecha', title: 'Fecha' },
      { key: 'lineaProduccion', title: 'Línea' },
      { key: 'producto', title: 'Producto' },
      { key: 'tipoDesviacion', title: 'Tipo de Desviación' },
      { key: 'descripcion', title: 'Descripción' },
      { key: 'duracionMinutos', title: 'Duración (min)' },
      { key: 'impactoCajas', title: 'Impacto (cajas)' }
    ];
  }

  // Armar reporte completo
  return {
    kpis: [
      {
        title: "Total Desviaciones",
        value: totalDesviaciones,
        color: COLORS.danger
      },
      {
        title: "Duración Total",
        value: `${(duracionTotalMinutos / 60).toFixed(1)} hrs`,
        color: COLORS.warning
      },
      {
        title: "Duración Promedio",
        value: `${duracionPromedio.toFixed(0)} min`,
        color: COLORS.info
      },
      {
        title: "Impacto en Producción",
        value: `${impactoProduccion} cajas`,
        color: COLORS.primary
      }
    ],
    chartData,
    tableData,
    columns
  };
} 