export function downloadToCSV(data: any[], filename: string) {
  if (!data.length) return;

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Convert data to CSV format
  const csvContent = [
    // Headers row
    headers.join(","),
    // Data rows
    ...data.map((item) =>
      headers
        .map((header) => {
          const value = item[header];
          // Handle values that might contain commas or quotes
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 