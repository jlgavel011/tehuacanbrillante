// Paleta de colores principal
export const PRIMARY_COLORS = ["blue", "indigo", "violet", "purple"] as const;

// Paleta de colores secundaria
export const SECONDARY_COLORS = ["emerald", "teal", "cyan", "sky"] as const;

// Paleta de colores para estados
export const STATE_COLORS = {
  success: "emerald",
  warning: "amber",
  error: "red",
  info: "blue",
  neutral: "gray",
} as const;

// Paleta de colores para comparaciones
export const COMPARISON_COLORS = {
  actual: "blue",
  planned: "gray",
  difference: "emerald",
} as const;

// Paleta de colores para categorías
export const CATEGORY_COLORS = {
  production: ["blue", "indigo", "violet"],
  quality: ["red", "amber", "yellow"],
  maintenance: ["emerald", "teal", "cyan"],
  operational: ["blue", "sky", "indigo"],
} as const;

// Paleta de colores para KPIs
export const KPI_COLORS = {
  positive: "emerald",
  neutral: "blue",
  negative: "red",
} as const;

// Función auxiliar para convertir arrays readonly a arrays mutables
const toMutableArray = <T>(arr: readonly T[]): T[] => [...arr];

// Configuraciones predefinidas para tipos comunes de gráficos
export const CHART_PRESETS = {
  production: {
    colors: ["blue"],
  },
  comparison: {
    colors: ["blue", "gray"],
  },
  distribution: {
    colors: ["blue", "indigo", "violet"],
  },
  status: {
    colors: ["green", "yellow", "red"],
  },
  performance: {
    colors: ["emerald", "blue", "indigo"],
  },
  flavors: {
    colors: ["pink"],
  },
} as const;

// Función para obtener colores mutables de los presets
export const getChartColors = (preset: keyof typeof CHART_PRESETS): string[] => {
  return [...CHART_PRESETS[preset].colors];
};

// Función para obtener colores mutables de las categorías
export const getCategoryColors = (category: keyof typeof CATEGORY_COLORS): string[] => {
  return [...CATEGORY_COLORS[category]];
};

// Función para obtener colores primarios mutables
export const getPrimaryColors = (): string[] => {
  return [...PRIMARY_COLORS];
}; 