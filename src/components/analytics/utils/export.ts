import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Column<T> {
  id: string;
  header: string | ((context: any) => string);
  accessorKey?: string;
  accessorFn?: (row: T) => any;
}

// Export data to CSV
export const exportToCSV = <T extends object>(
  data: T[],
  columns: Column<T>[],
  filename: string
) => {
  // Create headers array from column definitions
  const headers = columns.map((col) => {
    const header = col.header;
    return typeof header === "function" ? header({} as any) : header;
  });

  // Create rows array from data
  const rows = data.map((item) =>
    columns.map((col) => {
      if (col.accessorFn) {
        return col.accessorFn(item);
      }
      if (col.accessorKey) {
        return item[col.accessorKey as keyof T];
      }
      return item[col.id as keyof T];
    })
  );

  // Create worksheet
  const ws = utils.aoa_to_sheet([headers, ...rows]);

  // Create workbook
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Sheet1");

  // Save file
  writeFile(wb, `${filename}.xlsx`);
};

// Export data to PDF
export const exportToPDF = <T extends object>(
  data: T[],
  columns: Column<T>[],
  filename: string,
  title: string
) => {
  // Create new PDF document
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Create headers array from column definitions
  const headers = columns.map((col) => {
    const header = col.header;
    return typeof header === "function" ? header({} as any) : header;
  });

  // Create rows array from data
  const rows = data.map((item) =>
    columns.map((col) => {
      if (col.accessorFn) {
        return col.accessorFn(item);
      }
      if (col.accessorKey) {
        return item[col.accessorKey as keyof T];
      }
      return item[col.id as keyof T];
    })
  );

  // Add table to document
  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: 30,
    styles: {
      fontSize: 10,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontSize: 10,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Save file
  doc.save(`${filename}.pdf`);
}; 