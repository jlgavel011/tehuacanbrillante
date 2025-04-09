"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  AlertTriangle,
  ChevronLeft,
  ListChecks,
  AreaChart,
  Eye,
  CheckCircle
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

// Componente reutilizable para mostrar un filtro (Select o Multiselect)
const FilterInput = ({ category, selectedValue, onChange, isLoading, error, optionsOverride }: {
  category: FilterCategory;
  selectedValue: string | string[];
  onChange: (categoryId: string, value: string | string[]) => void;
  isLoading: boolean;
  error?: string;
  optionsOverride?: FilterOption[]; // Para pasar opciones filtradas
}) => {
  const options = optionsOverride || category.options;
  
  return (
    <div className="mb-4">
      <Label className="text-sm font-medium text-slate-700 block mb-1.5">{category.name}</Label>
      <p className="text-xs text-slate-500 mb-2">{category.description}</p>
      {error ? (
          <p className="text-xs text-rose-500 mb-2">{error}</p>
      ) : null}
      {isLoading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
            <span className="ml-2 text-sm text-slate-500">Cargando opciones...</span>
          </div>
      ) : category.type === 'select' ? (
          <Select
            value={selectedValue as string || ''}
            onValueChange={(value) => onChange(category.id, value)}
            disabled={isLoading || options.length === 0}
          >
            <SelectTrigger className="w-full focus:ring-sky-500 border-slate-300">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-md p-3">
             {options.length === 0 && !isLoading ? (
                <p className="text-xs text-slate-500 italic py-1">
                  No hay opciones disponibles.
                </p>
              ) : (
                options.map((option) => {
                  const isSelected = Array.isArray(selectedValue) && selectedValue.includes(option.id);
                  return (
                    <div className="flex items-center space-x-2 py-1" key={option.id}>
                      <Checkbox 
                        id={`${category.id}-${option.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const currentValues = Array.isArray(selectedValue) ? [...selectedValue] : [];
                          const newValues = checked 
                            ? [...currentValues, option.id]
                            : currentValues.filter(v => v !== option.id);
                          onChange(category.id, newValues);
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
  );
};

export function ReportBuilder() {
  const { date } = useDateRange();
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 5; // Definir número total de pasos
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string | string[]>>({
    // Valores iniciales por defecto
    entidad_principal: 'produccion',
    agrupacion: 'dia',
    visualizacion: 'tabla',
  });
  const [availableFilters, setAvailableFilters] = useState<FilterCategory[]>(FILTER_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState<Record<string, boolean>>({});
  const [filterErrors, setFilterErrors] = useState<Record<string, string>>({});
  const [reportGenerated, setReportGenerated] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const baseGroupingOptions = FILTER_CATEGORIES.find(cat => cat.id === 'agrupacion')?.options || [];
  const baseVisualizationOptions = FILTER_CATEGORIES.find(cat => cat.id === 'visualizacion')?.options || [];

  // --- Lógica de Obtención de Opciones Válidas (como antes) ---
  const getValidGroupingOptions = useCallback((entidadPrincipal: string): FilterOption[] => {
    // ... (implementación como antes)
    switch (entidadPrincipal) {
      case 'linea': return baseGroupingOptions.filter(opt => opt.id !== 'linea');
      case 'producto': return baseGroupingOptions.filter(opt => opt.id !== 'producto');
      default: return baseGroupingOptions;
    }
  }, [baseGroupingOptions]);

  const getValidVisualizationOptions = useCallback((agrupacion: string): FilterOption[] => {
    // ... (implementación como antes)
    const temporalGroupings = ['dia', 'semana', 'mes'];
    const pieSuitableGroupings = ['linea', 'turno', 'tipo_paro']; 
    return baseVisualizationOptions.filter(opt => {
       switch (opt.id) {
         case 'tabla': case 'barras': return true;
         case 'lineas': return temporalGroupings.includes(agrupacion);
         case 'pastel': return !temporalGroupings.includes(agrupacion) && pieSuitableGroupings.includes(agrupacion);
         case 'heat_map': return false; 
         default: return true;
       }
    });
  }, [baseVisualizationOptions]);

  // --- Lógica de Carga de Opciones (como antes, envuelta en useCallback) ---
  const loadFilterOptionsIfNeeded = useCallback(async (categoryId: string) => {
    // ... (toda la implementación de loadFilterOptionsIfNeeded como antes)
      const categoryConfig = FILTER_CATEGORIES.find(cat => cat.id === categoryId);
      if (!categoryConfig) return;
      const entidad = selectedFilters.entidad_principal as string;
      let isVisible = true;
      if (categoryId === 'tipo_paro') isVisible = entidad === 'paro';
      if (categoryId === 'producto') isVisible = entidad !== 'producto';
      if (categoryId === 'linea_produccion') isVisible = entidad !== 'linea';
      if (categoryId === 'materia_prima') isVisible = entidad === 'materia_prima' || entidad === 'paro';
      if (categoryId === 'desviacion_calidad') isVisible = entidad === 'desviacion_calidad' || entidad === 'paro';
      if (!isVisible) {
        setAvailableFilters(prev => prev.map(cat => cat.id === categoryId ? { ...cat, options: [] } : cat));
        setFilterErrors(prev => ({ ...prev, [categoryId]: '' }));
        return;
      }
      let canLoad = true;
      const lineasSelected = Array.isArray(selectedFilters.linea_produccion) && selectedFilters.linea_produccion.length > 0;
      const productosSelected = Array.isArray(selectedFilters.producto) && selectedFilters.producto.length > 0;
      if (categoryId === 'producto' && !lineasSelected) canLoad = false;
      if (categoryId === 'desviacion_calidad' && !lineasSelected) canLoad = false;
      if (categoryId === 'materia_prima' && !productosSelected && entidad === 'materia_prima') { } // canLoad = false; 
      if (!canLoad) {
         console.log(`Skipping load for ${categoryId} due to missing dependencies.`);
         setAvailableFilters(prev => prev.map(cat => cat.id === categoryId ? { ...cat, options: [] } : cat));
         setFilterErrors(prev => ({ ...prev, [categoryId]: '' }));
         return;
       }
      if (isLoadingFilters[categoryId]) return; 
      setIsLoadingFilters(prev => ({ ...prev, [categoryId]: true }));
      setFilterErrors(prev => ({ ...prev, [categoryId]: '' }));
      try {
        let apiUrl = '/api/reports/filter-options';
        const params = new URLSearchParams();
        if (selectedFilters.entidad_principal) params.append('entidad_principal', selectedFilters.entidad_principal as string);
        switch (categoryId) {
          case 'linea_produccion': params.append('type', 'lineas_produccion'); break;
          case 'turno': 
              params.append('type', 'turnos'); 
              if (lineasSelected && Array.isArray(selectedFilters.linea_produccion)) params.append('dependsOn', `lineas:${selectedFilters.linea_produccion.join(',')}`);
              break; 
          case 'producto': 
              params.append('type', 'productos');
              if (lineasSelected && Array.isArray(selectedFilters.linea_produccion)) params.append('dependsOn', `lineas:${selectedFilters.linea_produccion.join(',')}`);
              break;
          case 'tipo_paro': 
              params.append('type', 'tipos_paros');
              if (lineasSelected && Array.isArray(selectedFilters.linea_produccion)) { /* params.append('dependsOn', ...) */ }
              break;
          case 'materia_prima':
              params.append('type', 'materias_primas');
              if (productosSelected && Array.isArray(selectedFilters.producto)) params.append('dependsOn', `productos:${selectedFilters.producto.join(',')}`);
              break;
          case 'desviacion_calidad':
              params.append('type', 'desviaciones_calidad');
              if (lineasSelected && Array.isArray(selectedFilters.linea_produccion)) params.append('dependsOn', `lineas:${selectedFilters.linea_produccion.join(',')}`);
              break;
        }
        if (params.has('type')) {
          console.log(`Fetching filter options for ${categoryId}...`, params.toString());
          const response = await fetch(`${apiUrl}?${params.toString()}`);
          if (!response.ok) throw new Error(`Error fetching ${categoryId}: ${response.statusText}`);
          const data = await response.json();
          if (!data.options || data.options.length === 0) {
            console.log(`No options found for ${categoryId}`);
            setFilterErrors(prev => ({ ...prev, [categoryId]: 'No hay opciones disponibles' }));
            setAvailableFilters(prev => prev.map(cat => cat.id === categoryId ? { ...cat, options: [] } : cat));
          } else {
             setAvailableFilters(prev => prev.map(cat => cat.id === categoryId ? { ...cat, options: data.options } : cat));
          }
        } else {
           console.log(`Skipping API call for ${categoryId}, no type parameter set.`);
        }
      } catch (error) {
        console.error(`Error cargando opciones para ${categoryId}:`, error);
        setFilterErrors(prev => ({ ...prev, [categoryId]: 'Error al cargar opciones' }));
        setAvailableFilters(prev => prev.map(cat => cat.id === categoryId ? { ...cat, options: [] } : cat));
      } finally {
        setIsLoadingFilters(prev => ({ ...prev, [categoryId]: false }));
      }
  }, [selectedFilters.entidad_principal, selectedFilters.linea_produccion, selectedFilters.producto]); 

  // --- useEffect para Carga Inicial y Recargas --- 
  useEffect(() => {
    // Simplificado: Siempre intentar cargar filtros potencialmente relevantes.
    // loadFilterOptionsIfNeeded se encargará de verificar visibilidad y dependencias.
    loadFilterOptionsIfNeeded('linea_produccion'); 
    loadFilterOptionsIfNeeded('turno'); 
    loadFilterOptionsIfNeeded('tipo_paro'); // Solo cargará si entidad es 'paro' (verificado dentro de la función)
    loadFilterOptionsIfNeeded('producto'); // Solo cargará si entidad no es 'producto' y hay línea seleccionada (verificado dentro)
    loadFilterOptionsIfNeeded('materia_prima'); // Verificado dentro
    loadFilterOptionsIfNeeded('desviacion_calidad'); // Verificado dentro

  }, [currentStep, selectedFilters.entidad_principal, selectedFilters.linea_produccion, selectedFilters.producto]); 

  // --- Validación de Combinaciones (como antes) ---
  const validateFilterCombinations = useCallback(() => {
    // ... (implementación como antes)
    const errors: string[] = [];
    const entidad = selectedFilters.entidad_principal as string;
    const visualizacion = selectedFilters.visualizacion as string;
    const agrupacion = selectedFilters.agrupacion as string;
    if (visualizacion === 'pastel' && agrupacion === 'dia') errors.push('...');
    if (visualizacion === 'lineas' && !['dia', 'semana', 'mes'].includes(agrupacion)) errors.push('...');
    if (visualizacion === 'heat_map' /* ... */) errors.push('...');
    if (entidad === 'desviacion_calidad' && (!Array.isArray(selectedFilters.linea_produccion) || selectedFilters.linea_produccion.length === 0)) errors.push('...');
    setValidationErrors(errors);
    return errors.length === 0;
  }, [selectedFilters]); // Añadir dependencias

  // --- Manejador de Cambios en Filtros (adaptado para Wizard) ---
  const handleFilterChange = useCallback((categoryId: string, value: string | string[]) => {
    setSelectedFilters(prevFilters => {
      const newFilters = { ...prevFilters, [categoryId]: value };

      // Lógica de reseteo si cambian dependencias clave
      if (categoryId === 'entidad_principal') {
        // Limpiar filtros específicos dependientes
        delete newFilters.linea_produccion; 
        delete newFilters.producto;
        delete newFilters.tipo_paro;
        // Resetear agrupación y visualización
        const newEntidad = value as string;
        const validGroupings = getValidGroupingOptions(newEntidad);
        const defaultGrouping = validGroupings.find(opt => opt.id === 'dia')?.id || validGroupings[0]?.id || '';
        newFilters.agrupacion = defaultGrouping;
        newFilters.visualizacion = 'tabla'; 
        // Resetear errores de filtros específicos
        setFilterErrors({});
      }
       else if (categoryId === 'linea_produccion') {
         // Limpiar producto si cambian las líneas
         delete newFilters.producto;
         setFilterErrors(prev => ({ ...prev, producto: '' }));
       }
       else if (categoryId === 'agrupacion') {
          // Resetear visualización si la actual no es válida para la nueva agrupación
          const newAgrupacion = value as string;
          const currentVisualizacion = newFilters.visualizacion as string;
          const validVisualizations = getValidVisualizationOptions(newAgrupacion);
          if (!validVisualizations.some(opt => opt.id === currentVisualizacion)) {
            newFilters.visualizacion = 'tabla';
          }
       }
       
      // Validar combinaciones después de actualizar el estado
      setTimeout(() => validateFilterCombinations(), 0);
       
      return newFilters;
    });
  }, [getValidGroupingOptions, getValidVisualizationOptions, validateFilterCombinations]);

  // --- Lógica de Navegación del Wizard ---
  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // --- Lógica de Generación y Exportación (como antes) ---
  const handleGenerateReport = () => {
     // ... (implementación como antes)
      if (!validateFilterCombinations()) {
        console.warn("Advertencias en configuración");
      }
      setIsLoading(true);
      const event = new CustomEvent('reportGenerated', { detail: { filters: selectedFilters, dateRange: date } });
      window.dispatchEvent(event);
      const handleReportFinished = () => {
          setIsLoading(false);
          setReportGenerated(true);
          window.removeEventListener('reportFinished', handleReportFinished);
      };
      window.addEventListener('reportFinished', handleReportFinished);
      setTimeout(() => {
        setIsLoading(false);
        setReportGenerated(true); // Asumir finalización si no hay evento
      }, 5000);
  };
  
  const handleExportData = () => {
    window.dispatchEvent(new CustomEvent('exportReportData'));
  };

  // --- Renderizado del Wizard ---
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Seleccionar Entidad Principal
        return (
          <FilterInput
            category={FILTER_CATEGORIES.find(cat => cat.id === 'entidad_principal')!}
            selectedValue={selectedFilters.entidad_principal}
            onChange={handleFilterChange}
            isLoading={false} // No carga dinámica para este
          />
        );
      case 2: // Aplicar Filtros
        const entidad = selectedFilters.entidad_principal as string;
        // Obtenemos los IDs de los filtros relevantes
        const relevantFilterIds = FILTER_CATEGORIES
           .filter(cat => {
              if (['entidad_principal', 'agrupacion', 'visualizacion'].includes(cat.id)) return false;
              if (cat.id === 'tipo_paro') return entidad === 'paro';
              if (cat.id === 'producto') return entidad !== 'producto';
              if (cat.id === 'linea_produccion') return entidad !== 'linea';
              if (cat.id === 'materia_prima') return entidad === 'materia_prima' || entidad === 'paro';
              if (cat.id === 'desviacion_calidad') return entidad === 'desviacion_calidad' || entidad === 'paro';
              return true; 
           })
           .map(cat => cat.id);
           
        return (
          <div>
            <h4 className="text-md font-semibold text-slate-700 mb-4">Aplicar Filtros (Opcional)</h4>
            {relevantFilterIds.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No hay filtros aplicables para la entidad seleccionada.</p>
            ) : (
              // Aplicar grid general a todos los filtros relevantes
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6"> 
                {relevantFilterIds.map(filterId => {
                    const category = availableFilters.find(cat => cat.id === filterId) || FILTER_CATEGORIES.find(cat => cat.id === filterId);
                    if (!category) return null; 

                    return (
                      <FilterInput
                        key={category.id} // Usar ID de categoría como key
                        category={category} 
                        selectedValue={selectedFilters[category.id]}
                        onChange={handleFilterChange}
                        isLoading={isLoadingFilters[category.id] || false}
                        error={filterErrors[category.id]}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        );
      case 3: // Elegir Agrupación
         const agrupacionCategory = FILTER_CATEGORIES.find(cat => cat.id === 'agrupacion')!;
        return (
          <FilterInput
            category={agrupacionCategory}
            selectedValue={selectedFilters.agrupacion}
            onChange={handleFilterChange}
            isLoading={false}
            optionsOverride={getValidGroupingOptions(selectedFilters.entidad_principal as string)}
          />
        );
      case 4: // Seleccionar Visualización
         const visualizacionCategory = FILTER_CATEGORIES.find(cat => cat.id === 'visualizacion')!;
        return (
          <FilterInput
            category={visualizacionCategory}
            selectedValue={selectedFilters.visualizacion}
            onChange={handleFilterChange}
            isLoading={false}
            optionsOverride={getValidVisualizationOptions(selectedFilters.agrupacion as string)}
          />
        );
      case 5: // Revisar y Generar
        // Helper para obtener el nombre de una opción seleccionada
        const getOptionName = (categoryId: string, value: string) => {
          const category = FILTER_CATEGORIES.find(cat => cat.id === categoryId);
          return category?.options.find(opt => opt.id === value)?.name || value;
        };
        const getMultipleOptionNames = (categoryId: string, values: string[]) => {
          const category = availableFilters.find(cat => cat.id === categoryId);
           if (!category || !Array.isArray(values)) return "N/A";
           return values.map(val => category.options.find(opt => opt.id === val)?.name || val).join(', ') || "(Todos)";
        };
        
        return (
          <div>
            <h4 className="text-md font-semibold text-slate-700 mb-4">Resumen de Configuración</h4>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong>Entidad Principal:</strong> {getOptionName('entidad_principal', selectedFilters.entidad_principal as string)}</p>
              
              {/* Mostrar filtros aplicados */} 
              {Object.entries(selectedFilters)
                  .filter(([key, value]) => 
                      !['entidad_principal', 'agrupacion', 'visualizacion'].includes(key) && 
                      value && 
                      ( (Array.isArray(value) && value.length > 0) || (typeof value === 'string' && value !== '') ) &&
                      FILTER_CATEGORIES.some(cat => cat.id === key) // Asegurar que es un filtro conocido
                   )
                   .map(([key, value]) => (
                       <p key={key}><strong>{FILTER_CATEGORIES.find(c=>c.id===key)?.name || key}:</strong> {Array.isArray(value) ? getMultipleOptionNames(key, value) : getOptionName(key, value as string)}</p>
                   ))
              }
              
              <p><strong>Agrupación:</strong> {getOptionName('agrupacion', selectedFilters.agrupacion as string)}</p>
              <p><strong>Visualización:</strong> {getOptionName('visualizacion', selectedFilters.visualizacion as string)}</p>
            </div>
             {validationErrors.length > 0 && (
              <Alert variant="warning" className="mt-4 bg-amber-50 border-amber-200">
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
            <div className="mt-6">
              <Button 
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3"
                onClick={handleGenerateReport}
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                ) : (
                  <><RefreshCw className="mr-2 h-4 w-4" /> Generar Reporte</>
                )}
              </Button>
            </div>
          </div>
        );
      default: return null;
    }
  };
  
    // Stepper UI
  const steps = [
    { id: 1, name: 'Entidad', icon: Settings },
    { id: 2, name: 'Filtros', icon: ListChecks },
    { id: 3, name: 'Agrupación', icon: AreaChart },
    { id: 4, name: 'Visualización', icon: Eye },
    { id: 5, name: 'Resumen', icon: CheckCircle },
  ];

  return (
    <div className="flex flex-col h-full bg-white p-5 rounded-lg shadow-sm">
       {/* Encabezado y Periodo (se mantiene igual) */} 
       <div className="mb-4">
         <h3 className="text-lg font-semibold text-slate-800">Constructor de Reportes</h3>
       </div>
       <Card className="p-3 mb-5 shadow-xs border border-slate-200 bg-slate-50/50">
         {/* ... (código del periodo como antes) ... */} 
         <div className="flex items-center mb-1">
           <Calendar className="h-4 w-4 text-slate-500 mr-2" />
           <h4 className="text-xs font-medium text-slate-600">Periodo:</h4>
         </div>
         <p className="text-xs text-slate-500 ml-6">
          {date?.from && date?.to 
            ? `${date.from.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - ${date.to.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : "Rango no seleccionado"}
         </p>
       </Card>

       {/* Stepper */} 
       <div className="flex items-center justify-between mb-6 px-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= step.id ? 'bg-sky-500 border-sky-500 text-white' : 'border-slate-300 bg-white text-slate-500'}`}>
                <step.icon className="w-4 h-4" />
              </div>
              <p className={`mt-1 text-xs ${currentStep >= step.id ? 'text-sky-600 font-medium' : 'text-slate-500'}`}>{step.name}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-sky-500' : 'bg-slate-200'}`}></div>
            )}
          </React.Fragment>
        ))}
       </div>

       {/* Contenido del Paso Actual */} 
       <div className="flex-grow mb-6 p-4 border border-slate-200 rounded-md bg-white">
          {renderStepContent()}
       </div>

       {/* Navegación y Acciones */} 
       <div className="mt-auto pt-4 border-t border-slate-200">
         <div className="flex justify-between items-center">
           <Button 
             variant="outline"
             onClick={prevStep}
             disabled={currentStep === 1 || isLoading}
             className="text-sm"
           >
             <ChevronLeft className="mr-1 h-4 w-4" />
             Anterior
           </Button>
           
           {currentStep < TOTAL_STEPS ? (
              <Button 
                onClick={nextStep}
                disabled={isLoading || 
                    (currentStep === 1 && !selectedFilters.entidad_principal) ||
                    (currentStep === 3 && !selectedFilters.agrupacion) ||
                    (currentStep === 4 && !selectedFilters.visualizacion)
                }
                className="bg-sky-500 hover:bg-sky-600 text-white text-sm"
              >
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
           ) : ( // Botón de generar sólo en el último paso
             <Button 
               variant="outline" 
               size="sm" 
               className="text-xs border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
               disabled={!reportGenerated || isLoading}
               onClick={handleExportData}
             >
                <Download className="mr-1 h-3 w-3" /> Exportar
             </Button>
           )}
         </div>
          {currentStep < TOTAL_STEPS && (
             <div className="mt-3 text-center">
                 <Button 
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-500 hover:text-slate-700"
                    onClick={() => { /* Resetear state */
                        setCurrentStep(1);
                        setSelectedFilters({ entidad_principal: 'produccion', agrupacion: 'dia', visualizacion: 'tabla' });
                        setFilterErrors({});
                        setValidationErrors([]);
                        setReportGenerated(false);
                    }}
                 >
                    <Filter className="mr-1 h-3 w-3" /> Reiniciar configuración
                 </Button>
             </div>
         )}
       </div>
    </div>
  );
} 