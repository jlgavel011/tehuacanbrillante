export function downloadCSV(data: any[], filename: string) {
  // Obtener los headers del primer objeto
  const headers = Object.keys(data[0]);

  // Crear las filas del CSV
  const csvRows = [
    // Headers en español
    headers
      .map((header) => {
        const headerMap: { [key: string]: string } = {
          nombre: "Nombre",
          cantidad: "Cajas Producidas",
          porcentaje: "% del Total",
          modelo: "Modelo",
          sabor: "Sabor",
          tamaño: "Tamaño",
          caja: "Unidades/Caja",
        };
        return headerMap[header] || header;
      })
      .join(","),
    // Datos
    ...data.map((row) =>
      headers
        .map((header) => {
          let cell = row[header];
          
          // Formatear números
          if (header === "cantidad") {
            cell = row[header].toLocaleString("es-MX");
          } else if (header === "porcentaje") {
            cell = `${row[header].toFixed(1)}%`;
          }

          // Escapar comas y comillas dobles
          if (typeof cell === "string" && (cell.includes(",") || cell.includes('"'))) {
            cell = `"${cell.replace(/"/g, '""')}"`;
          }
          
          return cell ?? "";
        })
        .join(",")
    ),
  ].join("\n");

  // Crear el blob con BOM para Excel
  const blob = new Blob(["\ufeff" + csvRows], { type: "text/csv;charset=utf-8" });
  
  // Crear el link de descarga
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  
  // Trigger la descarga
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 