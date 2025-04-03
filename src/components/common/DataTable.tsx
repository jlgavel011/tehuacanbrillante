import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DataExport } from "./DataExport";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

interface Column {
  header: string;
  accessorKey: string;
  isNumeric?: boolean;
  formatFn?: (value: any) => string;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  title?: string;
  filename?: string;
  pageSize?: number;
}

export function DataTable({ 
  data, 
  columns, 
  title = "Datos", 
  filename = "export",
  pageSize = 10 
}: DataTableProps) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.accessorKey))
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on filter values
  const filteredData = data.filter(row =>
    Object.entries(filterValues).every(([key, value]) => {
      if (!value) return true;
      const cellValue = row[key];
      return cellValue?.toString().toLowerCase().includes(value.toLowerCase());
    })
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(columnKey)) {
      newVisibleColumns.delete(columnKey);
    } else {
      newVisibleColumns.add(columnKey);
    }
    setVisibleColumns(newVisibleColumns);
  };

  // Filter visible columns
  const visibleColumnsList = columns.filter(col => 
    visibleColumns.has(col.accessorKey)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.accessorKey}
                  checked={visibleColumns.has(column.accessorKey)}
                  onCheckedChange={() => toggleColumn(column.accessorKey)}
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DataExport
            data={filteredData}
            columns={visibleColumnsList}
            filename={filename}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
        {visibleColumnsList.map((column) => (
          <div key={column.accessorKey}>
            <Input
              placeholder={`Filtrar por ${column.header.toLowerCase()}`}
              value={filterValues[column.accessorKey] || ""}
              onChange={(e) =>
                setFilterValues({
                  ...filterValues,
                  [column.accessorKey]: e.target.value,
                })
              }
              className="max-w-sm"
            />
          </div>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumnsList.map((column) => (
                <TableHead
                  key={column.accessorKey}
                  className={column.isNumeric ? "text-right" : ""}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {visibleColumnsList.map((column) => (
                  <TableCell
                    key={column.accessorKey}
                    className={column.isNumeric ? "text-right" : ""}
                  >
                    {column.formatFn
                      ? column.formatFn(row[column.accessorKey])
                      : row[column.accessorKey]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
} 