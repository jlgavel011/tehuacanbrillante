"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Download, FileText, BarChart2, PieChart, LineChart, Info, AlertTriangle, FileSpreadsheet, FileType, Loader2 } from "lucide-react";
import { BarChart, DonutChart, LineChart as TremorLineChart, Title, Subtitle } from "@tremor/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart as RechartsLineChart,
  Line,
  Legend
} from "recharts";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Tipos de datos para el reporte
type ReportFilter = {
  filters: Record<string, string | string[]>;
  dateRange: {
    from: Date;
    to: Date;
  } | null;
};

type ReportData = {
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
  dateRange?: {
    from: Date;
    to: Date;
  };
};

// Datos de ejemplo para demostración
const SAMPLE_DATA: ReportData = {
  kpis: [
    { 
      title: "Total Cajas",
      value: 12584,
      change: {
        value: 8.3,
        isPositive: true
      },
      color: "#4ade80" 
    },
    { 
      title: "Eficiencia",
      value: "86.7%",
      change: {
        value: 2.1,
        isPositive: true
      },
      color: "#4ade80" 
    },
    { 
      title: "Tiempo de Paros",
      value: "47.2 hrs",
      change: {
        value: 12.5,
        isPositive: false
      },
      color: "#f87171" 
    },
    { 
      title: "Producción por Día",
      value: "419.5 cajas",
      change: {
        value: 5.2,
        isPositive: true
      },
      color: "#4ade80" 
    }
  ],
  chartData: [
    { dia: "Lunes", Producción: 352, Planificado: 400 },
    { dia: "Martes", Producción: 418, Planificado: 450 },
    { dia: "Miércoles", Producción: 435, Planificado: 440 },
    { dia: "Jueves", Producción: 397, Planificado: 420 },
    { dia: "Viernes", Producción: 487, Planificado: 490 },
    { dia: "Sábado", Producción: 305, Planificado: 350 },
    { dia: "Domingo", Producción: 0, Planificado: 0 },
  ],
  tableData: [
    { id: 1, fecha: "2023-05-01", linea: "Línea A", producto: "Agua Natural 600ml", producidas: 352, planificadas: 400, eficiencia: "88.0%" },
    { id: 2, fecha: "2023-05-02", linea: "Línea A", producto: "Agua Natural 600ml", producidas: 418, planificadas: 450, eficiencia: "92.9%" },
    { id: 3, fecha: "2023-05-03", linea: "Línea A", producto: "Agua Natural 600ml", producidas: 435, planificadas: 440, eficiencia: "98.9%" },
    { id: 4, fecha: "2023-05-04", linea: "Línea A", producto: "Agua Natural 600ml", producidas: 397, planificadas: 420, eficiencia: "94.5%" },
    { id: 5, fecha: "2023-05-05", linea: "Línea A", producto: "Agua Natural 600ml", producidas: 487, planificadas: 490, eficiencia: "99.4%" },
    { id: 6, fecha: "2023-05-06", linea: "Línea A", producto: "Agua Natural 600ml", producidas: 305, planificadas: 350, eficiencia: "87.1%" },
  ],
  columns: [
    { key: "fecha", title: "Fecha" },
    { key: "linea", title: "Línea" },
    { key: "producto", title: "Producto" },
    { key: "producidas", title: "Cajas Producidas" },
    { key: "planificadas", title: "Cajas Planificadas" },
    { key: "eficiencia", title: "Eficiencia" },
  ]
};

// Datos de torta para demostración
const DONUT_DATA = [
  { name: "Agua Natural 600ml", value: 2215 },
  { name: "Agua Natural 1L", value: 1932 },
  { name: "Agua Sabor Limón", value: 1420 },
];

// Actualizo la paleta de colores estratégicos para coincidir exactamente con reportes estratégicos
const STRATEGIC_COLORS = {
  primary: "#0ea5e9",    // Sky blue - Color principal
  secondary: "#64748b",  // Slate - Color secundario
  success: "#10b981",    // Emerald - Éxito/positivo
  danger: "#f43f5e",     // Rose - Peligro/negativo
  warning: "#f59e0b",    // Amber - Advertencia
  info: "#6366f1",       // Indigo - Información
  // Paleta de colores vivos y contrastantes para gráficos
  chartColors: [
    "#2563eb", // blue-600
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#8b5cf6", // violet-500
    "#ef4444", // red-500
    "#06b6d4", // cyan-500
    "#ec4899", // pink-500
    "#84cc16"  // lime-500
  ],
  pieColors: [
    "#2563eb", // blue-600
    "#3b82f6", // blue-500
    "#60a5fa", // blue-400
    "#93c5fd", // blue-300
    "#bfdbfe", // blue-200
  ]
};

// Función auxiliar para determinar si los datos son temporales
const isTemporalData = (data: any[]): boolean => {
  if (!data || data.length === 0) return false;
  
  // Verificar si hay claves que indiquen datos temporales
  const hasTemporalKeys = Object.keys(data[0]).some(key => 
    ['dia', 'fecha', 'semana', 'mes', 'año', 'year', 'date', 'day', 'month', 'week'].includes(key.toLowerCase())
  );
  
  // Verificar si los valores parecen fechas
  if (hasTemporalKeys) {
    // Buscar claves que parezcan temporales
    const temporalKey = Object.keys(data[0]).find(key => 
      ['dia', 'fecha', 'semana', 'mes', 'año', 'year', 'date', 'day', 'month', 'week'].includes(key.toLowerCase())
    );
    
    if (temporalKey) {
      // Verificar si los valores son secuenciales
      const values = data.map(item => item[temporalKey]);
      
      // Si son strings que parecen fechas o días de la semana
      if (typeof values[0] === 'string') {
        // Días de la semana
        const diasSemana = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo'];
        if (diasSemana.includes(values[0].toLowerCase())) {
          return true;
        }
        
        // Comprobar si parece una fecha
        return /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/.test(values[0]);
      }
    }
  }
  
  return false;
};

// Función para encontrar las claves numéricas en los datos
const findNumericKeys = (data: any[]): string[] => {
  if (!data || data.length === 0) return [];
  
  // Obtener todas las claves del primer objeto
  const keys = Object.keys(data[0]);
  
  // Filtrar solo las claves con valores numéricos
  return keys.filter(key => 
    typeof data[0][key] === 'number' && 
    !['id', 'indice', 'index'].includes(key.toLowerCase())
  );
};

// Función para encontrar la categoría principal (no numérica)
const findMainCategory = (data: any[]): string | null => {
  if (!data || data.length === 0) return null;
  
  const numericKeys = findNumericKeys(data);
  const allKeys = Object.keys(data[0]);
  
  // Buscar primero claves que sugieran una categoría principal
  const priorityKeys = ['nombre', 'name', 'categoria', 'category', 'producto', 'linea', 'dia', 'fecha', 'tipo'];
  
  for (const key of priorityKeys) {
    if (allKeys.includes(key) && !numericKeys.includes(key)) {
      return key;
    }
  }
  
  // Si no hay coincidencias, tomar la primera clave no numérica
  const nonNumericKeys = allKeys.filter(key => !numericKeys.includes(key));
  
  if (nonNumericKeys.length > 0) {
    return nonNumericKeys[0];
  }
  
  return null;
};

// --- Type for PDF options ---
type PdfIncludeOptions = {
  table: boolean;
  barras: boolean;
  lineas: boolean;
  pastel: boolean;
};

export function ReportViewer() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [activeTab, setActiveTab] = useState("tabla");
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportTitle, setReportTitle] = useState("Reporte Personalizado");
  const [chartWarnings, setChartWarnings] = useState<string[]>([]);
  const [optimalVisualization, setOptimalVisualization] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfIncludeOptions, setPdfIncludeOptions] = useState<PdfIncludeOptions>({
    table: true,
    barras: true,
    lineas: true,
    pastel: true,
  });

  // Refs
  const chartContainerRefs = {
    barras: useRef<HTMLDivElement>(null),
    lineas: useRef<HTMLDivElement>(null),
    pastel: useRef<HTMLDivElement>(null),
  };
  const tableContainerRef = useRef<HTMLTableElement>(null);

  // --- Helper Functions defined in component scope ---

  const determineOptimalVisualization = (data: any[], currentViz: string) => {
    if (!data || data.length === 0) return { visualization: 'tabla', warnings: ['No hay datos para visualizar'] };
    const warnings: string[] = [];
    let recommendedViz = currentViz;
    if (data.length === 1 && currentViz !== 'tabla') {
      warnings.push('Solo hay un registro. La tabla es la mejor visualización.');
      recommendedViz = 'tabla';
    }
    const temporal = isTemporalData(data);
    const categoryKey = findMainCategory(data);
    if (categoryKey) {
      const uniqueCategories = new Set(data.map(item => item[categoryKey])).size;
      if (currentViz === 'pastel' && uniqueCategories > 8) {
        warnings.push(`Demasiadas categorías (${uniqueCategories}) para un gráfico de pastel. Considera usar barras.`);
        recommendedViz = 'barras';
      }
      if (currentViz === 'lineas' && uniqueCategories < 3 && !temporal) {
        warnings.push('Pocas categorías para un gráfico de líneas. Un gráfico de barras podría ser más claro.');
        recommendedViz = 'barras';
      }
    }
    if (temporal) {
      if (currentViz === 'pastel') {
        warnings.push('Los datos temporales suelen visualizarse mejor como líneas o barras.');
        recommendedViz = 'lineas';
      }
    } else {
      if (currentViz === 'lineas' && !temporal) {
        warnings.push('El gráfico de líneas es mejor para series temporales. Considera usar barras.');
        recommendedViz = 'barras';
      }
    }
    const numericKeys = findNumericKeys(data);
    if (numericKeys.length === 0 && currentViz !== 'tabla') {
      warnings.push('No se encontraron valores numéricos para gráficos. La tabla es la mejor opción.');
      recommendedViz = 'tabla';
    }
    return { visualization: recommendedViz, warnings };
  };

  const generateReportTitle = (filters: Record<string, string | string[]>) => {
    let title = "Reporte de ";
    if (filters.entidad_principal === 'produccion') title += "Producción";
    else if (filters.entidad_principal === 'producto') title += "Productos";
    else if (filters.entidad_principal === 'linea') title += "Líneas de Producción";
    else if (filters.entidad_principal === 'paro') title += "Paros";
    if (filters.agrupacion) {
      const agrupacion = filters.agrupacion as string;
      if (agrupacion === 'dia') title += " por Día";
      else if (agrupacion === 'semana') title += " por Semana";
      else if (agrupacion === 'mes') title += " por Mes";
      else if (agrupacion === 'linea') title += " por Línea";
      else if (agrupacion === 'producto') title += " por Producto";
      else if (agrupacion === 'turno') title += " por Turno";
    }
    setReportTitle(title);
  };

  const handleExportCsv = () => {
    if (!reportData || !reportData.tableData || reportData.tableData.length === 0) return;
    try {
      const headers = reportData.columns.map(col => col.title);
      const csvContent = [
        headers.join(','),
        ...reportData.tableData.map(row => 
          reportData.columns
            .map(col => {
              const value = row[col.key];
              const escapedValue = typeof value === 'string' ? value.replace(/"/g, '""') : value;
              return `"${escapedValue}"`; 
            })
            .join(',')
        )
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}.csv`);
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exportando datos CSV:", error);
    }
  };

  const handleExportPdf = async (options: PdfIncludeOptions) => { 
    if (!reportData || !reportGenerated) return;
    setIsExportingPdf(true);
    
    const originalActiveTab = activeTab;

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      let yPosition = margin;

      // --- 1. Add Title and Date Range ---
      doc.setFontSize(18);
      doc.text(reportTitle, margin, yPosition); yPosition += 25;
      doc.setFontSize(10);
      if (reportData.dateRange) {
        const dateString = `${new Date(reportData.dateRange.from).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })} - ${new Date(reportData.dateRange.to).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        doc.text(dateString, margin, yPosition); yPosition += 20;
      }
      yPosition += 10;

      // --- 2. Add Table (Conditional) ---
      if (options.table && reportData.tableData && reportData.tableData.length > 0) {
        const tableHeaders = reportData.columns.map(col => col.title);
        const tableBody = reportData.tableData.map(row => reportData.columns.map(col => row[col.key] ?? ''));
        if (yPosition + 40 > pageHeight - margin) { doc.addPage(); yPosition = margin; }
        autoTable(doc, {
          head: [tableHeaders], body: tableBody, startY: yPosition,
          margin: { left: margin, right: margin }, theme: 'grid',
          headStyles: { fillColor: [0, 105, 92] }, styles: { fontSize: 7, cellPadding: 3 },
          didDrawPage: (data) => { yPosition = data.cursor?.y ?? margin; }
        });
        yPosition += 20;
      } else if (options.table) {
        if (yPosition + 20 > pageHeight - margin) { doc.addPage(); yPosition = margin; }
        doc.setFontSize(9);
        doc.text("Tabla seleccionada, pero no hay datos disponibles.", margin, yPosition); yPosition += 20;
      }

      // --- 3. Add Selected Charts (Sequentially using longer setTimeout) ---
      const chartConfigs = [
        { id: 'barras', title: 'Gráfico de Barras' },
        { id: 'lineas', title: 'Gráfico de Líneas' },
        { id: 'pastel', title: 'Gráfico de Distribución (Pastel)' },
      ];
      const hasChartData = reportData.chartData && reportData.chartData.length > 0;

      for (const config of chartConfigs) {
        if (options[config.id as keyof PdfIncludeOptions] && hasChartData) {
          console.log(`Processing chart: ${config.id}`);
          setActiveTab(config.id);
          
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

          const chartRef = chartContainerRefs[config.id as keyof typeof chartContainerRefs]?.current;
          if (chartRef) {
            if (yPosition + 30 > pageHeight - margin) { doc.addPage(); yPosition = margin; }
            doc.setFontSize(12);
            doc.text(config.title, margin, yPosition); yPosition += 20;

            try {
              console.log(`Capturing chart: ${config.id}`);
              const canvas = await html2canvas(chartRef, { 
                  scale: 2, 
                  backgroundColor: '#ffffff', 
                  logging: false, 
                  useCORS: true
              });
              const imgData = canvas.toDataURL('image/png');
              const imgProps = doc.getImageProperties(imgData);
              const imgWidth = pageWidth - margin * 2;
              let imgHeight = (imgProps.height * imgWidth) / imgProps.width;
              const maxHeight = pageHeight - margin - yPosition;
              if (imgHeight > maxHeight) {
                if (imgHeight > pageHeight - margin * 2) { 
                  imgHeight = pageHeight - margin * 2;
                }
                doc.addPage(); yPosition = margin;
              }
              doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 25;
            } catch (canvasError) {
              console.error(`Error capturing chart ${config.title} with html2canvas:`, canvasError);
               if (yPosition + 20 > pageHeight - margin) { doc.addPage(); yPosition = margin; }
               doc.setFontSize(9);
               doc.setTextColor(255, 0, 0); 
               doc.text(`Error al capturar el gráfico: ${config.title}`, margin, yPosition); 
               doc.setTextColor(0, 0, 0); 
               yPosition += 20;
            }
          } else {
             console.warn(`Chart ref not found for ${config.id} after tab switch.`);
          }
        } else if (options[config.id as keyof PdfIncludeOptions]) {
          if (yPosition + 20 > pageHeight - margin) { doc.addPage(); yPosition = margin; }
          doc.setFontSize(9);
          doc.text(`Gráfico '${config.title}' seleccionado, pero no hay datos disponibles.`, margin, yPosition); yPosition += 20;
        }
      }

      // --- 4. Save PDF ---
      doc.save(`${reportTitle.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error("Error generando PDF:", error);
      // TODO: Add user feedback (maybe a toast notification after modal closes)
    } finally {
      setActiveTab(originalActiveTab);
      setIsExportingPdf(false);
    }
  };

  const handlePdfOptionChange = (option: keyof PdfIncludeOptions, checked: boolean) => {
    setPdfIncludeOptions(prev => ({ ...prev, [option]: checked }));
  };

  // --- useEffect for reportGenerated event ---
  useEffect(() => {
    const handleReportGenerated = async (event: any) => {
      setIsLoading(true);
      setReportGenerated(false);
      setChartWarnings([]);
      const filters = event.detail.filters;
      const dateRange = event.detail.dateRange;
      const reportDateRange = {
        from: dateRange?.from ? new Date(dateRange.from) : new Date(new Date().setDate(new Date().getDate() - 30)),
        to: dateRange?.to ? new Date(dateRange.to) : new Date()
      };
      try {
        const params = new URLSearchParams();
        // Append params...
        if (filters.entidad_principal) params.append('entidad_principal', filters.entidad_principal as string);
        if (filters.agrupacion) params.append('agrupacion', filters.agrupacion as string);
        if (filters.visualizacion) params.append('visualizacion', filters.visualizacion as string);
        if (Array.isArray(filters.linea_produccion)) filters.linea_produccion.forEach((id: string) => params.append('linea_produccion', id));
        if (Array.isArray(filters.producto)) filters.producto.forEach((id: string) => params.append('producto', id));
        if (Array.isArray(filters.turno)) filters.turno.forEach((id: string) => params.append('turno', id));
        if (Array.isArray(filters.tipo_paro)) filters.tipo_paro.forEach((id: string) => params.append('tipo_paro', id));
        if (dateRange?.from && dateRange?.to) {
          params.append('from', dateRange.from.toISOString());
          params.append('to', dateRange.to.toISOString());
        }
        const response = await fetch(`/api/reports/dynamic-report?${params.toString()}`);
        if (!response.ok) throw new Error('Error al generar el reporte');
        const data = await response.json();
        if (!data || (data.tableData && data.tableData.length === 0)) {
          console.log('No hay datos para los filtros seleccionados');
          setChartWarnings(['No se encontraron datos con los filtros seleccionados']);
          setReportData({ // Set minimal data structure even if empty
            kpis: [], chartData: [], tableData: [], 
            columns: data?.columns || [], // Use columns if API provides them
            dateRange: reportDateRange
          });
        } else {
          // Use the determineOptimalVisualization function defined above
          const { visualization, warnings } = determineOptimalVisualization(data.tableData || data.chartData, filters.visualizacion as string);
          setChartWarnings(warnings);
          if (visualization !== filters.visualizacion) setOptimalVisualization(visualization);
          else setOptimalVisualization(null);
          setReportData({ ...data, dateRange: reportDateRange });
        }
        setReportGenerated(true);
        generateReportTitle(filters); // Use generateReportTitle defined above
        if (filters.visualizacion) setActiveTab(filters.visualizacion as string);
        window.dispatchEvent(new CustomEvent('reportFinished'));
      } catch (error) {
        console.error('Error al generar el reporte:', error);
        setReportData({ kpis: [{ title: "Error", value: "No se pudieron cargar los datos", color: "#f87171" }], chartData: [], tableData: [], columns: [{ key: "mensaje", title: "Mensaje" }], dateRange: reportDateRange });
        setReportGenerated(true);
        setActiveTab('tabla');
        window.dispatchEvent(new CustomEvent('reportFinished'));
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener('reportGenerated', handleReportGenerated);
    return () => {
      window.removeEventListener('reportGenerated', handleReportGenerated);
    };
  }, []); // Empty dependency array is correct here, it sets up the listener once

  // --- Determine if data exists for modal checkboxes ---
  const hasChartDataForModal = reportData?.chartData && reportData.chartData.length > 0;
  const hasTableDataForModal = reportData?.tableData && reportData.tableData.length > 0;

  if (!reportGenerated) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <svg 
          className="w-20 h-20 mb-4 text-muted-foreground/50" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="font-medium text-lg mb-2">No hay reporte generado</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Utiliza el panel de filtros para construir y generar un reporte personalizado.
          Selecciona entidad, línea, producto, periodo y más para obtener insights valiosos.
        </p>
      </div>
    );
  }

  if (isLoading || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-opacity-50 rounded-full border-t-primary mb-4"></div>
        <p className="text-muted-foreground">Generando reporte...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{reportTitle}</h2>
          <p className="text-sm text-slate-500">
            {reportData?.dateRange ? (
              `${new Date(reportData.dateRange.from).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: reportData.dateRange.from.getFullYear() !== reportData.dateRange.to.getFullYear() ? 'numeric' : undefined })} - ${new Date(reportData.dateRange.to).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
            ) : (
              reportGenerated ? 'Periodo no especificado' : '' // Show message only after generation
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* CSV Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            onClick={handleExportCsv} 
            disabled={!hasTableDataForModal || isLoading}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
          {/* PDF Button (triggers Modal) */}
          <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                disabled={isExportingPdf || !reportData || !reportGenerated || isLoading} // Disable if no report generated
              >
                {isExportingPdf ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <FileType className="h-4 w-4 mr-1" />
                )}
                {isExportingPdf ? "Exportando..." : "Exportar PDF"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Opciones de Exportación PDF</DialogTitle>
                <DialogDescription>
                  Selecciona los elementos que deseas incluir en el archivo PDF.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Checkbox for Table */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeTable" 
                    checked={pdfIncludeOptions.table}
                    onCheckedChange={(checked) => handlePdfOptionChange('table', !!checked)} 
                    disabled={!hasTableDataForModal}
                  />
                  <Label htmlFor="includeTable" className={!hasTableDataForModal ? 'text-muted-foreground cursor-not-allowed' : ''}>Tabla de Datos</Label>
                </div>
                {/* Checkbox for Bar Chart */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeBarChart" 
                    checked={pdfIncludeOptions.barras}
                    onCheckedChange={(checked) => handlePdfOptionChange('barras', !!checked)}
                    disabled={!hasChartDataForModal}
                  />
                  <Label htmlFor="includeBarChart" className={!hasChartDataForModal ? 'text-muted-foreground cursor-not-allowed' : ''}>Gráfico de Barras</Label>
                </div>
                {/* Checkbox for Line Chart */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeLineChart" 
                    checked={pdfIncludeOptions.lineas}
                    onCheckedChange={(checked) => handlePdfOptionChange('lineas', !!checked)}
                    disabled={!hasChartDataForModal}
                  />
                  <Label htmlFor="includeLineChart" className={!hasChartDataForModal ? 'text-muted-foreground cursor-not-allowed' : ''}>Gráfico de Líneas</Label>
                </div>
                {/* Checkbox for Pie Chart */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includePieChart" 
                    checked={pdfIncludeOptions.pastel}
                    onCheckedChange={(checked) => handlePdfOptionChange('pastel', !!checked)}
                    disabled={!hasChartDataForModal}
                  />
                  <Label htmlFor="includePieChart" className={!hasChartDataForModal ? 'text-muted-foreground cursor-not-allowed' : ''}>Gráfico de Distribución (Pastel)</Label>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button 
                  onClick={() => {
                    setIsPdfModalOpen(false); 
                    if (!isExportingPdf) { 
                      handleExportPdf(pdfIncludeOptions); 
                    }
                  }}
                  disabled={isExportingPdf || (!pdfIncludeOptions.table && !pdfIncludeOptions.barras && !pdfIncludeOptions.lineas && !pdfIncludeOptions.pastel)}
                >
                  {isExportingPdf ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                  ) : (
                    "Generar PDF"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportData.kpis.map((kpi, index) => (
          <Card key={index} className="p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white rounded-lg">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-500 mb-2">{kpi.title}</span>
              <span 
                className="text-3xl font-bold" 
                style={{ color: kpi.color === "#4ade80" ? STRATEGIC_COLORS.success : (kpi.color === "#f87171" ? STRATEGIC_COLORS.danger : STRATEGIC_COLORS.primary) }}
              >
                {typeof kpi.value === 'number' && kpi.value > 1000 
                  ? `${(kpi.value/1000).toFixed(1)}k`
                  : kpi.value}
              </span>
              {kpi.change && (
                <div className="flex items-center mt-2">
                  <Badge 
                    variant={kpi.change.isPositive ? "outline" : "destructive"}
                    className={`text-xs ${kpi.change.isPositive ? 'bg-green-50 text-green-700 hover:bg-green-50' : 'bg-rose-50 text-rose-700 hover:bg-rose-50'} font-medium px-1.5 py-0.5`}
                  >
                    {kpi.change.isPositive ? "↑" : "↓"} {kpi.change.value}%
                  </Badge>
                  <span className="text-xs text-slate-500 ml-2">vs periodo anterior</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 bg-slate-100 p-1 rounded-md">
          <TabsTrigger value="tabla" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" />
            Tabla
          </TabsTrigger>
          <TabsTrigger value="barras" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            <BarChart2 className="h-4 w-4" />
            Barras
          </TabsTrigger>
          <TabsTrigger value="lineas" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            <LineChart className="h-4 w-4" />
            Líneas
          </TabsTrigger>
          <TabsTrigger value="pastel" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            <PieChart className="h-4 w-4" />
            Distribución
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tabla" className="mt-0">
          <Card ref={tableContainerRef} className="p-0 overflow-hidden border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    {reportData.columns.map((column) => (
                      <TableHead key={column.key} className="font-semibold text-slate-700 h-11">
                        <div className="flex items-center">
                          {column.title}
                          <ChevronDown className="h-4 w-4 ml-1 text-slate-400" />
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.tableData.length > 0 ? (
                    reportData.tableData.map((row, index) => (
                      <TableRow key={row.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50 bg-opacity-50'}>
                        {reportData.columns.map((column) => (
                          <TableCell key={`${row.id || index}-${column.key}`} className="py-3 text-slate-700">
                            {row[column.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell 
                        colSpan={reportData.columns.length} 
                        className="text-center py-12 text-slate-500"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <Info className="h-8 w-8 mb-2 text-slate-300" />
                          <p>No hay datos disponibles para los filtros seleccionados</p>
                          <p className="text-sm text-slate-400 mt-1">Intenta modificar los criterios de búsqueda</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="barras" className="mt-0">
          <Card ref={chartContainerRefs.barras} className="p-0 overflow-hidden border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <Title className="text-slate-800 font-bold text-xl mb-1">Visualización de Datos</Title>
              <Subtitle className="text-slate-500 text-sm mb-4">
                {reportTitle} - {reportData.dateRange ? 
                  `${new Date(reportData.dateRange.from).toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})} al ${new Date(reportData.dateRange.to).toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})}` 
                  : 'Periodo actual'}
              </Subtitle>
              
              {reportData.chartData.length > 0 ? (
                <div className="h-[400px] mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={reportData.chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey={findMainCategory(reportData.chartData) || Object.keys(reportData.chartData[0])[0]}
                        tick={{ fill: '#6B7280' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        width={48}
                        tick={{ fill: '#6B7280' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => 
                          value > 1000 ? `${(value/1000).toFixed(1)}k` : value
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          value.toLocaleString(), 
                          findNumericKeys(reportData.chartData)[0]
                        ]}
                        labelFormatter={(value) => `${value}`}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                      />
                      <Legend />
                      {findNumericKeys(reportData.chartData).map((key, index) => (
                        <Bar 
                          key={key} 
                          dataKey={key} 
                          fill={STRATEGIC_COLORS.chartColors[index % STRATEGIC_COLORS.chartColors.length]} 
                          radius={[4, 4, 0, 0]}
                          barSize={40}
                        />
                      ))}
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                  <Info className="h-8 w-8 mb-2 text-slate-300" />
                  <p>No hay datos suficientes para mostrar el gráfico</p>
                  <p className="text-sm text-slate-400 mt-1">Intenta modificar los criterios de búsqueda</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="lineas" className="mt-0">
          <Card ref={chartContainerRefs.lineas} className="p-0 overflow-hidden border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <Title className="text-slate-800 font-bold text-xl mb-1">Tendencia de Datos</Title>
              <Subtitle className="text-slate-500 text-sm mb-4">
                {reportTitle} - {reportData.dateRange ? 
                  `${new Date(reportData.dateRange.from).toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})} al ${new Date(reportData.dateRange.to).toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})}` 
                  : 'Periodo actual'}
              </Subtitle>
              
              {reportData.chartData.length > 0 ? (
                <div className="h-[400px] mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={reportData.chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey={findMainCategory(reportData.chartData) || Object.keys(reportData.chartData[0])[0]}
                        tick={{ fill: '#6B7280' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        width={48}
                        tick={{ fill: '#6B7280' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => 
                          value > 1000 ? `${(value/1000).toFixed(1)}k` : value
                        }
                        allowDecimals={false}
                        min={0}
                        domain={[0, 'auto']}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          value.toLocaleString(), 
                          findNumericKeys(reportData.chartData)[0]
                        ]}
                        labelFormatter={(value) => `${value}`}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                      />
                      <Legend />
                      {findNumericKeys(reportData.chartData).map((key, index) => (
                        <Line 
                          key={key} 
                          type="monotone"
                          dataKey={key} 
                          stroke={STRATEGIC_COLORS.chartColors[index % STRATEGIC_COLORS.chartColors.length]} 
                          strokeWidth={2}
                          dot={{ r: 4, fill: STRATEGIC_COLORS.chartColors[index % STRATEGIC_COLORS.chartColors.length], strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, fill: STRATEGIC_COLORS.chartColors[index % STRATEGIC_COLORS.chartColors.length], strokeWidth: 0 }}
                          connectNulls
                        />
                      ))}
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                  <Info className="h-8 w-8 mb-2 text-slate-300" />
                  <p>No hay datos suficientes para mostrar el gráfico</p>
                  <p className="text-sm text-slate-400 mt-1">Intenta modificar los criterios de búsqueda</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="pastel" className="mt-0">
          <Card ref={chartContainerRefs.pastel} className="p-0 overflow-hidden border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <Title className="text-slate-800 font-bold text-xl mb-1">Distribución de Datos</Title>
              <Subtitle className="text-slate-500 text-sm mb-4">
                {reportTitle} - {reportData.dateRange ? 
                  `${new Date(reportData.dateRange.from).toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})} al ${new Date(reportData.dateRange.to).toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})}` 
                  : 'Periodo actual'}
              </Subtitle>
              
              {reportData.chartData.length > 0 ? (
                <div className="h-[400px] mt-6 flex flex-col">
                  <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={(() => {
                            const categoryKey = findMainCategory(reportData.chartData) || Object.keys(reportData.chartData[0])[0];
                            const valueKey = findNumericKeys(reportData.chartData)[0];
                            
                            if (!categoryKey || !valueKey) return [];
                            
                            const total = reportData.chartData.reduce((sum, item) => 
                              sum + (typeof item[valueKey] === 'number' ? item[valueKey] : 0), 0);
                            
                            return reportData.chartData
                              .map(item => {
                                const value = typeof item[valueKey] === 'number' ? item[valueKey] : 0;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                                
                                return {
                                  name: item[categoryKey],
                                  value: value,
                                  percentage: percentage,
                                  formattedName: `${item[categoryKey]} (${percentage}%)`
                                };
                              })
                              .sort((a, b) => b.value - a.value)
                              .slice(0, 8);
                          })()}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius="90%"
                          fill="#2563eb"
                          stroke="white"
                          strokeWidth={2}
                        >
                          {(() => {
                            const pieData = (() => {
                              const categoryKey = findMainCategory(reportData.chartData) || Object.keys(reportData.chartData[0])[0];
                              const valueKey = findNumericKeys(reportData.chartData)[0];
                              
                              if (!categoryKey || !valueKey) return [];
                              
                              const total = reportData.chartData.reduce((sum, item) => 
                                sum + (typeof item[valueKey] === 'number' ? item[valueKey] : 0), 0);
                              
                              return reportData.chartData
                                .map(item => {
                                  const value = typeof item[valueKey] === 'number' ? item[valueKey] : 0;
                                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                                  
                                  return {
                                    name: item[categoryKey],
                                    value: value,
                                    percentage: percentage,
                                    formattedName: `${item[categoryKey]} (${percentage}%)`
                                  };
                                })
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 8);
                            })();
                            
                            return pieData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={STRATEGIC_COLORS.pieColors[index % STRATEGIC_COLORS.pieColors.length]} 
                              />
                            ));
                          })()}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            const data = payload[0];
                            if (!data) return null;
                            
                            const value = data.value ? Number(data.value) : 0;
                            
                            return (
                              <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-md">
                                <div className="font-medium">{data.name}</div>
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
                                  <span className="text-sm text-slate-500">
                                    Cantidad:
                                  </span>
                                  <span className="text-sm font-medium">
                                    {value.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="h-3 w-3 rounded-full opacity-0" />
                                  <span className="text-sm text-slate-500">
                                    Porcentaje:
                                  </span>
                                  <span className="text-sm font-medium" style={{ color: data.color }}>
                                    {data.payload?.percentage || "0.0"}%
                                  </span>
                                </div>
                              </div>
                            );
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-3 mt-6 border-t border-slate-100 pt-4">
                    {(() => {
                      const categoryKey = findMainCategory(reportData.chartData) || Object.keys(reportData.chartData[0])[0];
                      const valueKey = findNumericKeys(reportData.chartData)[0];
                      
                      if (!categoryKey || !valueKey) return null;
                      
                      const total = reportData.chartData.reduce((sum, item) => 
                        sum + (typeof item[valueKey] === 'number' ? item[valueKey] : 0), 0);
                      
                      const sortedData = reportData.chartData
                        .map((item, idx) => {
                          const value = typeof item[valueKey] === 'number' ? item[valueKey] : 0;
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                          const formattedValue = value.toLocaleString();
                          
                          return {
                            name: item[categoryKey],
                            value: value,
                            formattedValue: formattedValue,
                            percentage: percentage
                          };
                        })
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 8);
                      
                      return sortedData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50/50 hover:bg-slate-100/80 transition-colors cursor-default shadow-sm">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: STRATEGIC_COLORS.pieColors[index % STRATEGIC_COLORS.pieColors.length] }}
                          ></div>
                          <span className="text-sm font-medium text-slate-700">{item.name}</span>
                          <span className="text-sm font-semibold text-slate-500">({item.formattedValue})</span>
                          <span className="text-sm font-bold" style={{ color: STRATEGIC_COLORS.pieColors[index % STRATEGIC_COLORS.pieColors.length] }}>{item.percentage}%</span>
                        </div>
                      ));
                    })()}
                  </div>
                  
                  <div className="text-center text-xs text-slate-400 mt-4">
                    * Se muestran los {Math.min(8, reportData.chartData.length)} valores más significativos
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                  <Info className="h-8 w-8 mb-2 text-slate-300" />
                  <p>No hay datos suficientes para mostrar el gráfico</p>
                  <p className="text-sm text-slate-400 mt-1">Intenta modificar los criterios de búsqueda</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      {chartWarnings.length > 0 && (
        <Alert className="mb-2 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 text-sm font-medium">Información sobre visualización</AlertTitle>
          <AlertDescription className="text-xs text-amber-700">
            <ul className="list-disc pl-4 mt-1 space-y-1">
              {chartWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
            {optimalVisualization && (
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
                  onClick={() => setActiveTab(optimalVisualization)}
                >
                  Cambiar a visualización recomendada: {optimalVisualization}
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      {/* --- Loading Modal for PDF Export --- */}
      <Dialog open={isExportingPdf} modal={true}> {/* Use modal={true} to prevent closing */} 
        <DialogContent className="sm:max-w-[300px]"> {/* Removed hideCloseButton */} 
          <DialogHeader>
            <DialogTitle className="text-center">Generando PDF</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Por favor espera...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 