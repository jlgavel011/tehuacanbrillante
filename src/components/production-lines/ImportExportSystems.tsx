"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, Check, AlertCircle, Loader2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ImportResult {
  sistemas: {
    creados: number;
    existentes: number;
    fallidos: number;
  };
  subsistemas: {
    creados: number;
    existentes: number;
    fallidos: number;
  };
  subsubsistemas: {
    creados: number;
    existentes: number;
    fallidos: number;
  };
  errores: string[];
}

export default function ImportExportSystems() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/sistemas/plantilla");
      
      if (!response.ok) {
        throw new Error("Error al descargar la plantilla");
      }
      
      // Obtener el contenido de la respuesta como blob
      const blob = await response.blob();
      
      // Crear una URL para el blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear un elemento a para simular un clic y descargar el archivo
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_sistemas.csv";
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Plantilla descargada correctamente");
    } catch (error) {
      console.error("Error al descargar la plantilla:", error);
      toast.error("Error al descargar la plantilla");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Debe seleccionar un archivo CSV");
      return;
    }

    if (!file.name.endsWith(".csv")) {
      toast.error("El archivo debe ser en formato CSV");
      return;
    }

    try {
      setIsLoading(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/sistemas/importar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al importar el archivo");
      }

      const result = await response.json();
      setImportResult(result);
      
      // Mostrar notificación de éxito
      toast.success("Archivo importado correctamente");
    } catch (error: any) {
      console.error("Error al importar el archivo:", error);
      toast.error(`Error al importar: ${error.message || "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setImportResult(null);
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDownloadTemplate}
      >
        <Download className="mr-2 h-4 w-4" />
        Plantilla CSV
      </Button>

      <Dialog open={isImportOpen} onOpenChange={(open) => {
        setIsImportOpen(open);
        if (!open) resetImport();
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Sistemas desde CSV</DialogTitle>
            <DialogDescription>
              Suba un archivo CSV con la estructura de sistemas, subsistemas y sub-subsistemas.
              Descargue la plantilla para ver el formato requerido.
            </DialogDescription>
          </DialogHeader>

          {!importResult ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="csv-file" className="text-sm font-medium text-black">
                  Archivo CSV
                </label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  El archivo debe tener columnas para Sistema, Subsistema, Sub-subsistema y ID_Linea_Produccion
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="help">
                  <AccordionTrigger className="text-sm font-medium flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    ¿Cómo funciona la importación?
                  </AccordionTrigger>
                  <AccordionContent className="px-2">
                    <div className="text-sm space-y-3 text-gray-600">
                      <p>La importación de sistemas mediante CSV le permite crear múltiples sistemas, subsistemas y sub-subsistemas de una sola vez.</p>
                      
                      <h4 className="font-medium text-black mt-4">Formato del Archivo:</h4>
                      <ul className="list-disc pl-5 space-y-1.5">
                        <li>Columna <strong>Sistema</strong>: Nombre del sistema (obligatorio)</li>
                        <li>Columna <strong>Subsistema</strong>: Nombre del subsistema (opcional)</li>
                        <li>Columna <strong>Sub-subsistema</strong>: Nombre del sub-subsistema (opcional)</li>
                        <li>Columna <strong>ID_Linea_Produccion</strong>: ID de la línea de producción (obligatorio)</li>
                      </ul>

                      <h4 className="font-medium text-black mt-4">Ejemplo de CSV:</h4>
                      <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto">
                        Sistema,Subsistema,Sub-subsistema,ID_Linea_Produccion<br/>
                        Sistema Mezcla,,,[ID_LINEA]<br/>
                        Sistema Envasado,Subsistema Llenado,,[ID_LINEA]<br/>
                        Sistema Envasado,Subsistema Llenado,Sub-subsistema Válvulas,[ID_LINEA]<br/>
                        Sistema Envasado,Subsistema Sellado,,[ID_LINEA]
                      </pre>

                      <h4 className="font-medium text-black mt-4">Notas Importantes:</h4>
                      <ul className="list-disc pl-5 space-y-1.5">
                        <li>Reemplace <code>[ID_LINEA]</code> con el ID real de la línea de producción</li>
                        <li>Si un sistema, subsistema o sub-subsistema ya existe, será reutilizado</li>
                        <li>Los sub-subsistemas requieren un subsistema asociado</li>
                        <li>Los subsistemas requieren un sistema asociado</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            <div className="space-y-5 py-4">
              <Alert variant="default" className="bg-green-50 border-green-200">
                <Check className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800">Importación completada</AlertTitle>
                <AlertDescription className="text-green-700">
                  Se ha procesado el archivo correctamente.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="border rounded-lg p-4 space-y-2 shadow-sm">
                  <h4 className="font-medium">Sistemas</h4>
                  <div className="grid gap-1.5 text-sm">
                    <div>Creados: <span className="text-green-600 font-medium">{importResult.sistemas.creados}</span></div>
                    <div>Existentes: <span className="text-blue-600 font-medium">{importResult.sistemas.existentes}</span></div>
                    <div>Fallidos: <span className="text-red-600 font-medium">{importResult.sistemas.fallidos}</span></div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 space-y-2 shadow-sm">
                  <h4 className="font-medium">Subsistemas</h4>
                  <div className="grid gap-1.5 text-sm">
                    <div>Creados: <span className="text-green-600 font-medium">{importResult.subsistemas.creados}</span></div>
                    <div>Existentes: <span className="text-blue-600 font-medium">{importResult.subsistemas.existentes}</span></div>
                    <div>Fallidos: <span className="text-red-600 font-medium">{importResult.subsistemas.fallidos}</span></div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 space-y-2 shadow-sm">
                  <h4 className="font-medium">Sub-subsistemas</h4>
                  <div className="grid gap-1.5 text-sm">
                    <div>Creados: <span className="text-green-600 font-medium">{importResult.subsubsistemas.creados}</span></div>
                    <div>Existentes: <span className="text-blue-600 font-medium">{importResult.subsubsistemas.existentes}</span></div>
                    <div>Fallidos: <span className="text-red-600 font-medium">{importResult.subsubsistemas.fallidos}</span></div>
                  </div>
                </div>
              </div>

              {importResult.errores.length > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle>Errores durante la importación</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      <ul className="list-disc pl-5 space-y-1.5">
                        {importResult.errores.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            {!importResult ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadTemplate}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar Plantilla
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={!file || isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Importar
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsImportOpen(false)} className="px-6">
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 