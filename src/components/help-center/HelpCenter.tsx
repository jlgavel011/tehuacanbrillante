"use client";

import React, { useState, useMemo, useEffect } from "react";
import { HelpCenterLayout } from "./HelpCenterLayout";
import Introduction from "./sections/Introduction";
import Dashboard from "./sections/Dashboard";
import Orders from "./sections/Orders";
import ProductionLines from "./sections/ProductionLines";
import Products from "./sections/Products";
import Analytics from "./sections/Analytics";
import Settings from "./sections/Settings";
import FAQ from "./sections/FAQ";

// Definición de los datos de ayuda para búsqueda
interface HelpArticle {
  title: string;
  content: string;
  keywords: string[];
  module: string;
}

export default function HelpCenter() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ title: string; content: string; module: string }>>([]);

  // Datos de todos los artículos de ayuda para buscar
  const helpData = useMemo<HelpArticle[]>(() => [
    // Introducción
    {
      title: "Bienvenido a Tehuacán Brillante",
      content: "Información general sobre la plataforma de gestión de producción.",
      keywords: ["inicio", "bienvenida", "plataforma", "general", "introducción", "tehuacán"],
      module: "introduction"
    },
    // Dashboard
    {
      title: "Dashboard de Producción",
      content: "Visualización rápida de datos y métricas de producción en tiempo real.",
      keywords: ["dashboard", "métricas", "producción", "tiempo real", "visualización", "indicadores"],
      module: "dashboard"
    },
    // Órdenes
    {
      title: "Gestión de Órdenes de Producción",
      content: "Administración de órdenes de producción y seguimiento de progreso.",
      keywords: ["órdenes", "producción", "gestión", "crear orden", "seguimiento", "progreso"],
      module: "orders"
    },
    {
      title: "Crear una Orden de Producción",
      content: "Guía para crear nuevas órdenes de producción y asignar productos.",
      keywords: ["crear", "orden", "producción", "asignar", "productos", "nueva orden"],
      module: "orders"
    },
    {
      title: "Seguimiento de Órdenes",
      content: "Visualización del progreso y estado de las órdenes de producción.",
      keywords: ["seguimiento", "estado", "progreso", "órdenes", "producción", "monitoreo"],
      module: "orders"
    },
    // Líneas de Producción
    {
      title: "Gestión de Líneas de Producción",
      content: "Administración de líneas, sistemas, subsistemas y productos asociados.",
      keywords: ["líneas", "producción", "sistemas", "subsistemas", "gestión", "configuración"],
      module: "production-lines"
    },
    {
      title: "Crear Líneas de Producción",
      content: "Guía para crear y configurar nuevas líneas de producción.",
      keywords: ["crear", "líneas", "producción", "nueva línea", "configurar"],
      module: "production-lines"
    },
    {
      title: "Asignar Sistemas y Subsistemas",
      content: "Procedimiento para crear y asignar sistemas, subsistemas y sub-subsistemas a las líneas de producción.",
      keywords: ["sistemas", "subsistemas", "sub-subsistemas", "asignar", "crear sistema", "jerarquía"],
      module: "production-lines"
    },
    {
      title: "Configurar Productos y Velocidades",
      content: "Instrucciones para asignar productos a líneas y configurar velocidades de producción.",
      keywords: ["productos", "velocidades", "asignar", "cajas/hora", "producción", "configurar"],
      module: "production-lines"
    },
    {
      title: "Configurar Paros de Calidad",
      content: "Guía para crear y configurar paros de calidad en las líneas de producción.",
      keywords: ["paros", "calidad", "materia prima", "crear paro", "configurar", "líneas"],
      module: "production-lines"
    },
    // Productos
    {
      title: "Gestión de Productos",
      content: "Administración de productos y sus atributos como sabor, tamaño, etc.",
      keywords: ["productos", "atributos", "sabor", "tamaño", "gestión", "materias primas"],
      module: "products"
    },
    {
      title: "Crear Productos",
      content: "Guía para crear nuevos productos y configurar sus atributos.",
      keywords: ["crear", "productos", "atributos", "configurar", "nuevo producto"],
      module: "products"
    },
    {
      title: "Gestión de Materias Primas",
      content: "Administración de materias primas y su asignación a productos.",
      keywords: ["materias primas", "asignar", "productos", "insumos", "gestión"],
      module: "products"
    },
    // Analítica
    {
      title: "Reportes Estratégicos",
      content: "Información sobre los diferentes reportes estratégicos disponibles.",
      keywords: ["reportes", "estratégicos", "análisis", "métricas", "datos", "estadísticas"],
      module: "analytics"
    },
    {
      title: "Explorador de Reportes",
      content: "Guía para utilizar el explorador de reportes y crear reportes personalizados.",
      keywords: ["explorador", "reportes", "personalizado", "crear reporte", "visualización", "datos"],
      module: "analytics"
    },
    {
      title: "Descargar Reportes",
      content: "Instrucciones para descargar reportes en diferentes formatos.",
      keywords: ["descargar", "reportes", "csv", "excel", "pdf", "exportar"],
      module: "analytics"
    },
    // Configuración
    {
      title: "Gestión de Usuarios",
      content: "Administración de usuarios, roles y permisos en la plataforma.",
      keywords: ["usuarios", "roles", "permisos", "gestión", "crear usuario", "configuración"],
      module: "settings"
    },
    // FAQ
    {
      title: "Preguntas Frecuentes",
      content: "Respuestas a las preguntas más comunes sobre la plataforma.",
      keywords: ["preguntas", "frecuentes", "FAQ", "ayuda", "problemas", "soluciones"],
      module: "faq"
    }
  ], []);

  // Función de búsqueda
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = helpData.filter(article => {
      // Buscar en título
      if (article.title.toLowerCase().includes(query)) return true;
      // Buscar en contenido
      if (article.content.toLowerCase().includes(query)) return true;
      // Buscar en palabras clave
      if (article.keywords.some(keyword => keyword.toLowerCase().includes(query))) return true;
      return false;
    }).map(article => ({
      title: article.title,
      content: article.content,
      module: article.module
    }));

    setSearchResults(results);
  };

  // Actualizar búsqueda cuando cambia la consulta
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Renderizar la sección activa
  const renderActiveSection = () => {
    switch (activeSection) {
      case "introduction":
        return <Introduction />;
      case "dashboard":
        return <Dashboard />;
      case "orders":
        return <Orders />;
      case "production-lines":
        return <ProductionLines />;
      case "products":
        return <Products />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
      case "faq":
        return <FAQ />;
      default:
        return <Introduction />;
    }
  };

  return (
    <HelpCenterLayout
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onSearch={handleSearch}
      searchResults={searchResults}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {renderActiveSection()}
    </HelpCenterLayout>
  );
} 