"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDateRange } from "@/context/DateRangeContext";
import { 
  Loader2, 
  RefreshCw, 
  Filter, 
  ChevronRight, 
  Download, 
  PencilRuler, 
  Calendar, 
  BarChart, 
  Settings,
  AlertTriangle
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type FilterCategory = {
  id: string;
  name: string;
  description: string;
  options: FilterOption[];
  type: 'select' | 'multiselect';
  dependsOn?: string;
};

type FilterOption = {
  id: string;
  name: string;
};

// Paleta de colores estratégicos (idéntica a ReportViewer)
const STRATEGIC_COLORS = {
  primary: "#0ea5e9",    // Sky blue - Color principal
  secondary: "#64748b",  // Slate - Color secundario
  success: "#10b981",    // Emerald - Éxito/positivo
  danger: "#f43f5e",     // Rose - Peligro/negativo
  warning: "#f59e0b",    // Amber - Advertencia
  info: "#6366f1",       // Indigo - Información
  chartColors: ["#0ea5e9", "#10b981", "#f59e0b", "#6366f1", "#f43f5e", "#84cc16", "#8b5cf6", "#64748b"]
};

// Definición base de categorías de filtros
const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: 'entidad_principal',
    name: 'Entidad Principal',
    description: 'Selecciona la entidad principal para tu reporte',
    type: 'select',
    options: [
      { id: 'produccion', name: 'Producción' },
      { id: 'producto', name: 'Producto' },
      { id: 'linea', name: 'Línea de Producción' },
      { id: 'paro', name: 'Paro' },
      { id: 'materia_prima', name: 'Materia Prima' },
      { id: 'desviacion_calidad', name: 'Desviación de Calidad' },
    ]
  },
  {
    id: 'linea_produccion',
    name: 'Línea de Producción',
    description: 'Selecciona las líneas de producción',
    type: 'multiselect',
    dependsOn: 'entidad_principal',
    options: [] // Se cargará dinámicamente
  },
  {
    id: 'producto',
    name: 'Producto',
    description: 'Selecciona los productos',
    type: 'multiselect',
    dependsOn: 'linea_produccion',
    options: [] // Se cargará dinámicamente
  },
  {
    id: 'turno',
    name: 'Turno',
    description: 'Selecciona los turnos',
    type: 'multiselect',
    options: [] // Se cargará dinámicamente
  },
  {
    id: 'tipo_paro',
    name: 'Tipo de Paro',
    description: 'Selecciona los tipos de paro',
    type: 'multiselect',
    dependsOn: 'entidad_principal',
    options: [] // Se cargará dinámicamente
  },
  {
    id: 'agrupacion',
    name: 'Agrupar Resultados Por',
    description: 'Selecciona cómo agrupar los resultados',
    type: 'select',
    options: [
      { id: 'dia', name: 'Día' },
      { id: 'semana', name: 'Semana' },
      { id: 'mes', name: 'Mes' },
      { id: 'linea', name: 'Línea' },
      { id: 'producto', name: 'Producto' },
      { id: 'turno', name: 'Turno' },
    ]
  },
  {
    id: 'visualizacion',
    name: 'Tipo de Visualización',
    description: 'Selecciona el tipo de visualización principal',
    type: 'select',
    options: [
      { id: 'tabla', name: 'Tabla Detallada' },
      { id: 'barras', name: 'Gráfico de Barras' },
      { id: 'lineas', name: 'Gráfico de Líneas' },
      { id: 'pastel', name: 'Gráfico de Pastel' },
      { id: 'heat_map', name: 'Mapa de Calor' },
    ]
  },
];

export function ReportBuilder() {
  const { date } = useDateRange();
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string | string[]>>({
    entidad_principal: 'produccion',
    visualizacion: 'tabla',
    agrupacion: 'dia',
  });
  const [availableFilters, setAvailableFilters] = useState<FilterCategory[]>(FILTER_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState<Record<string, boolean>>({});
  const [filterErrors, setFilterErrors] = useState<Record<string, string>>({});
  const [reportGenerated, setReportGenerated] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Cargar opciones dinámicas para filtros cuando cambien las dependencias
  useEffect(() => {
    async function loadFilterOptions(categoryId: string, dependsOnValue?: string) {
      // No recargar si ya está cargando
      if (isLoadingFilters[categoryId]) return;
      
      setIsLoadingFilters(prev => ({ ...prev, [categoryId]: true }));
      // Borrar errores anteriores
      setFilterErrors(prev => ({ ...prev, [categoryId]: '' }));
      
      try {
        let apiUrl = '/api/reports/filter-options';
        const params = new URLSearchParams();
        
        // Agregar la entidad principal para optimizar las consultas
        if (selectedFilters.entidad_principal) {
          params.append('entidad_principal', selectedFilters.entidad_principal as string);
        }
        
        switch (categoryId) {
          case 'linea_produccion':
            params.append('type', 'lineas_produccion');
            break;
          case 'producto':
            params.append('type', 'productos');
            // Si depende de líneas seleccionadas
            if (Array.isArray(selectedFilters.linea_produccion) && selectedFilters.linea_produccion.length > 0) {
              params.append('dependsOn', `lineas:${selectedFilters.linea_produccion.join(',')}`);
            }
            break;
          case 'turno':
            params.append('type', 'turnos');
            // Si depende de líneas seleccionadas
            if (Array.isArray(selectedFilters.linea_produccion) && selectedFilters.linea_produccion.length > 0) {
              params.append('dependsOn', `lineas:${selectedFilters.linea_produccion.join(',')}`);
            }
            break;
          case 'tipo_paro':
            params.append('type', 'tipos_paros');
            // Si depende de líneas seleccionadas
            if (Array.isArray(selectedFilters.linea_produccion) && selectedFilters.linea_produccion.length > 0) {
              params.append('dependsOn', `lineas:${selectedFilters.linea_produccion.join(',')}`);
            }
            break;
          case 'materia_prima':
            params.append('type', 'materias_primas');
            // Si depende de productos seleccionados
            if (Array.isArray(selectedFilters.producto) && selectedFilters.producto.length > 0) {
              params.append('dependsOn', `productos:${selectedFilters.producto.join(',')}`);
            }
            break;
          case 'desviacion_calidad':
            params.append('type', 'desviaciones_calidad');
            // Si depende de líneas seleccionadas
            if (Array.isArray(selectedFilters.linea_produccion) && selectedFilters.linea_produccion.length > 0) {
              params.append('dependsOn', `lineas:${selectedFilters.linea_produccion.join(',')}`);
            }
            break;
          default:
            break;
        }
        
        // Solo hacer la llamada si se configuró algún parámetro
        if (params.toString()) {
          console.log(`Fetching filter options for ${categoryId}...`, params.toString());
          const response = await fetch(`${apiUrl}?${params.toString()}`);
          
          if (!response.ok) {
            throw new Error(`Error fetching ${categoryId} options: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (!data.options || data.options.length === 0) {
            console.log(`No options found for ${categoryId}`);
            // Si no hay opciones, mostrar mensaje informativo
            setFilterErrors(prev => ({ 
              ...prev, 
              [categoryId]: 'No hay opciones disponibles con los filtros actuales'
            }));
          }
          
          // Actualizar las opciones del filtro correspondiente
          setAvailableFilters(prev => prev.map(category => {
            if (category.id === categoryId) {
              return {
                ...category,
                options: data.options || []
              };
            }
            return category;
          }));
        }
      } catch (error) {
        console.error(`Error cargando opciones para ${categoryId}:`, error);
        setFilterErrors(prev => ({ 
          ...prev, 
          [categoryId]: 'Error al cargar opciones. Intente nuevamente.'
        }));
      } finally {
        setIsLoadingFilters(prev => ({ ...prev, [categoryId]: false }));
      }
    }
    
    // Cargar opciones iniciales para filtros que no dependen de otras selecciones
    const loadInitialOptions = async () => {
      await loadFilterOptions('linea_produccion');
      await loadFilterOptions('turno');
      await loadFilterOptions('tipo_paro');
      await loadFilterOptions('materia_prima');
      
      // Cargar opciones de productos cuando cambie la selección de líneas
      if (Array.isArray(selectedFilters.linea_produccion) && selectedFilters.linea_produccion.length > 0) {
        await loadFilterOptions('producto');
        await loadFilterOptions('desviacion_calidad');
      }
    };
    
    loadInitialOptions();
    
  }, [selectedFilters.linea_produccion, selectedFilters.entidad_principal, selectedFilters.producto]);
  
  // Determinar qué filtros están disponibles basados en las selecciones actuales
  useEffect(() => {
    // Filtrar categorías según la entidad principal seleccionada
    const entidadPrincipal = selectedFilters.entidad_principal as string;
    
    // Determinamos qué filtros mostrar según la entidad principal
    let filteredCategories = [...FILTER_CATEGORIES];
    
    if (entidadPrincipal === 'paro') {
      // Si la entidad es paro, mostrar tipo_paro y ocultar producto
      filteredCategories = filteredCategories.filter(cat => cat.id !== 'producto');
    } else if (entidadPrincipal === 'producto') {
      // Si la entidad es producto, ocultar tipo_paro
      filteredCategories = filteredCategories.filter(cat => cat.id !== 'tipo_paro');
    }
    
    // Mantener las opciones ya cargadas
    const updatedCategories = filteredCategories.map(category => {
      const existingCategory = availableFilters.find(cat => cat.id === category.id);
      if (existingCategory && existingCategory.options.length > 0) {
        return {
          ...category,
          options: existingCategory.options
        };
      }
      return category;
    });
    
    setAvailableFilters(updatedCategories);
  }, [selectedFilters.entidad_principal]);

  // Función para validar combinaciones de filtros y visualizaciones
  const validateFilterCombinations = () => {
    const errors: string[] = [];
    const entidad = selectedFilters.entidad_principal as string;
    const visualizacion = selectedFilters.visualizacion as string;
    const agrupacion = selectedFilters.agrupacion as string;
    
    // Verificar visualizaciones incompatibles con ciertos datos
    if (visualizacion === 'pastel' && agrupacion === 'dia') {
      errors.push('El gráfico de pastel no es ideal para datos temporales. Considera usar gráfico de barras o líneas.');
    }
    
    if (visualizacion === 'lineas' && !['dia', 'semana', 'mes'].includes(agrupacion)) {
      errors.push('El gráfico de líneas es mejor para series temporales. Considera agrupar por día, semana o mes.');
    }
    
    if (visualizacion === 'heat_map' && entidad === 'materia_prima') {
      errors.push('El mapa de calor no está implementado para Materia Prima. Usa otra visualización.');
    }
    
    // Verificar dependencias de filtros
    if (entidad === 'desviacion_calidad' && 
        (!Array.isArray(selectedFilters.linea_produccion) || selectedFilters.linea_produccion.length === 0)) {
      errors.push('Las desviaciones de calidad requieren seleccionar al menos una línea de producción.');
    }
    
    // Alertar sobre la falta de datos para ciertas combinaciones
    if (entidad === 'desviacion_calidad' && visualizacion === 'lineas') {
      errors.push('Los datos de desviaciones de calidad pueden ser limitados para gráficos de líneas.');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Modificar la función handleFilterChange para validar después de cada cambio
  const handleFilterChange = (categoryId: string, value: string | string[]) => {
    // Para listas de selección múltiple, asegurarse de que el valor sea un array
    if (Array.isArray(value) || categoryId === 'entidad_principal' || categoryId === 'agrupacion' || categoryId === 'visualizacion') {
      setSelectedFilters({
        ...selectedFilters,
        [categoryId]: value
      });
    } else if (typeof value === 'string') {
      // Convertir a array para multiselectores
      const currentValues = Array.isArray(selectedFilters[categoryId]) 
        ? [...selectedFilters[categoryId] as string[]] 
        : [];
      
      if (!currentValues.includes(value)) {
        setSelectedFilters({
          ...selectedFilters,
          [categoryId]: [...currentValues, value]
        });
      }
    }
    
    // Si cambia la entidad principal, reiniciar filtros dependientes
    if (categoryId === 'entidad_principal') {
      const newFilters = { ...selectedFilters } as Record<string, string | string[]>;
      newFilters[categoryId] = value;
      
      // Limpiar selecciones de otros filtros
      delete newFilters.linea_produccion;
      delete newFilters.producto;
      delete newFilters.tipo_paro;
      
      setSelectedFilters(newFilters);
      // Limpiar errores de validación anteriores
      setValidationErrors([]);
    }
    
    // Si cambia la línea de producción, actualizar productos disponibles
    if (categoryId === 'linea_produccion') {
      // También limpiar selección de productos
      setSelectedFilters(prev => {
        const newFilters = { ...prev } as Record<string, string | string[]>;
        newFilters[categoryId] = value;
        delete newFilters.producto;
        return newFilters;
      });
    }
    
    // Si se modifica visualización o agrupación, validar combinaciones
    if (categoryId === 'visualizacion' || categoryId === 'agrupacion' || categoryId === 'entidad_principal') {
      // Validamos después de que el estado se actualice
      setTimeout(() => {
        validateFilterCombinations();
      }, 0);
    }
  };

  const handleGenerateReport = () => {
    // Validar combinaciones antes de generar el reporte
    if (!validateFilterCombinations()) {
      // Si hay errores, mostrar una alerta pero permitir continuar
      console.warn("Hay advertencias en la configuración del reporte");
    }
    
    setIsLoading(true);
    
    // Emitir evento para actualizar el visor de reportes inmediatamente
    const event = new CustomEvent('reportGenerated', {
      detail: {
        filters: selectedFilters,
        dateRange: date
      }
    });
    window.dispatchEvent(event);
    
    // Escuchar evento de finalización para actualizar el estado de carga
    const handleReportFinished = () => {
      setIsLoading(false);
      setReportGenerated(true);
      // Eliminar el listener después de usarlo
      window.removeEventListener('reportFinished', handleReportFinished);
    };
    
    window.addEventListener('reportFinished', handleReportFinished);
    
    // Por seguridad, establecer un timeout para finalizar la carga si no se recibe el evento
    setTimeout(() => {
      setIsLoading(false);
      setReportGenerated(true);
    }, 5000);
  };
  
  // Manejar la exportación de datos
  const handleExportData = () => {
    window.dispatchEvent(new CustomEvent('exportReportData'));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-800 mb-1.5">Explorador de Reportes</h3>
        <p className="text-sm text-slate-500">
          Construye tu reporte personalizado seleccionando los criterios y visualizaciones.
        </p>
      </div>
      
      {validationErrors.length > 0 && (
        <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 text-sm font-medium">Advertencias</AlertTitle>
          <AlertDescription className="text-xs text-amber-700">
            <ul className="list-disc pl-4 mt-1 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="p-4 mb-5 shadow-sm border-0 bg-slate-50">
        <div className="flex items-center mb-2">
          <Calendar className="h-4 w-4 text-slate-500 mr-2" />
          <h4 className="text-sm font-medium text-slate-700">Periodo seleccionado</h4>
        </div>
        <p className="text-xs text-slate-500 ml-6">
          {date?.from && date?.to 
            ? `${date.from.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} al ${date.to.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : "Selecciona un rango de fechas para mayor precisión"}
        </p>
      </Card>
      
      <div className="mb-3 flex items-center">
        <PencilRuler className="h-4 w-4 text-slate-500 mr-2" />
        <h4 className="text-sm font-semibold text-slate-700">Configuración del reporte</h4>
      </div>
      
      <Accordion type="single" collapsible defaultValue="entidad_principal" className="w-full">
        {availableFilters.map((category) => (
          <AccordionItem 
            value={category.id} 
            key={category.id} 
            className="border-slate-200 overflow-hidden"
          >
            <AccordionTrigger className="text-sm font-medium text-slate-700 py-3 hover:bg-slate-50 px-3 hover:no-underline">
              <div className="flex items-center">
                {category.id === 'entidad_principal' && <Settings className="h-4 w-4 mr-2 text-slate-500" />}
                {category.id === 'linea_produccion' && <ChevronRight className="h-4 w-4 mr-2 text-slate-500" />}
                {category.id === 'producto' && <ChevronRight className="h-4 w-4 mr-2 text-slate-500" />}
                {category.id === 'turno' && <ChevronRight className="h-4 w-4 mr-2 text-slate-500" />}
                {category.id === 'tipo_paro' && <ChevronRight className="h-4 w-4 mr-2 text-slate-500" />}
                {category.id === 'agrupacion' && <BarChart className="h-4 w-4 mr-2 text-slate-500" />}
                {category.id === 'visualizacion' && <BarChart className="h-4 w-4 mr-2 text-slate-500" />}
                <span>{category.name}</span>
              </div>
              {isLoadingFilters[category.id] && (
                <Loader2 className="h-3 w-3 ml-2 animate-spin text-slate-500" />
              )}
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-3 px-3">
              <div className="space-y-3">
                <p className="text-xs text-slate-500 mb-2">{category.description}</p>
                
                {filterErrors[category.id] ? (
                  <p className="text-xs text-rose-500 mb-2">{filterErrors[category.id]}</p>
                ) : null}
                
                {isLoadingFilters[category.id] ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                    <span className="ml-2 text-sm text-slate-500">Cargando opciones...</span>
                  </div>
                ) : category.type === 'select' ? (
                  <Select
                    value={selectedFilters[category.id] as string || ''}
                    onValueChange={(value) => handleFilterChange(category.id, value)}
                    disabled={isLoadingFilters[category.id] || category.options.length === 0}
                  >
                    <SelectTrigger className="w-full focus:ring-sky-500 border-slate-300">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {category.options.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    {category.options.length === 0 && !isLoadingFilters[category.id] ? (
                      <p className="text-xs text-slate-500 italic py-1">
                        No hay opciones disponibles con los filtros actuales.
                      </p>
                    ) : (
                      category.options.map((option) => {
                        const isSelected = Array.isArray(selectedFilters[category.id]) && 
                          (selectedFilters[category.id] as string[])?.includes(option.id);
                        
                        return (
                          <div className="flex items-center space-x-2 py-1" key={option.id}>
                            <Checkbox 
                              id={`${category.id}-${option.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const currentValues = Array.isArray(selectedFilters[category.id]) 
                                  ? [...selectedFilters[category.id] as string[]] 
                                  : [];
                                
                                const newValues = checked 
                                  ? [...currentValues, option.id]
                                  : currentValues.filter(v => v !== option.id);
                                
                                handleFilterChange(category.id, newValues);
                              }}
                              className="text-sky-500 border-slate-300"
                            />
                            <Label htmlFor={`${category.id}-${option.id}`} className="text-sm text-slate-700">
                              {option.name}
                            </Label>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="mt-auto pt-6">
        <Separator className="mb-4" />
        <Button 
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-6"
          onClick={handleGenerateReport}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generando reporte...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-5 w-5" />
              Generar Reporte
            </>
          )}
        </Button>
        
        <div className="flex justify-between mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            onClick={() => {
              setSelectedFilters({
                entidad_principal: 'produccion', 
                visualizacion: 'tabla',
                agrupacion: 'dia'
              });
            }}
          >
            <Filter className="mr-1 h-3 w-3" />
            Limpiar filtros
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            disabled={!reportGenerated}
            onClick={handleExportData}
          >
            <Download className="mr-1 h-3 w-3" />
            Exportar datos
          </Button>
        </div>
      </div>
    </div>
  );
} 