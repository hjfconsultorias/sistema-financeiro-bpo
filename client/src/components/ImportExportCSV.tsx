import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Column {
  key: string;
  label: string;
  example?: string;
}

interface ImportExportCSVProps {
  entityName: string; // Nome da entidade (ex: "Clientes", "Fornecedores")
  entityNameSingular: string; // Nome singular (ex: "Cliente", "Fornecedor")
  columns: Column[];
  data: any[];
  onImport: (data: any[]) => Promise<{ success: number; errors: string[] }>;
  onImportSuccess: () => void;
  fileName: string; // Nome base do arquivo (ex: "clientes", "fornecedores")
}

export function ImportExportCSV({
  entityName,
  entityNameSingular,
  columns,
  data,
  onImport,
  onImportSuccess,
  fileName,
}: ImportExportCSVProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileData = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(fileData, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Mapear colunas da planilha para formato esperado
        const mapped = jsonData.map((row: any) => {
          const mappedRow: any = {};
          columns.forEach((col) => {
            // Tentar múltiplas variações do nome da coluna
            const value =
              row[col.label] ||
              row[col.label.toLowerCase()] ||
              row[col.key] ||
              row[col.key.toLowerCase()] ||
              "";
            mappedRow[col.key] = value;
          });
          return mappedRow;
        });

        setPreviewData(mapped);
      } catch (error) {
        toast.error("Erro ao processar arquivo. Verifique o formato.");
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error("Nenhum dado para importar");
      return;
    }

    setIsImporting(true);
    try {
      const result = await onImport(previewData);
      if (result.errors.length > 0) {
        toast.error(`${result.success} ${entityName.toLowerCase()} importados com ${result.errors.length} erros`);
        console.error("Erros de importação:", result.errors);
      } else {
        toast.success(`${result.success} ${entityName.toLowerCase()} importados com sucesso!`);
      }
      setImportDialogOpen(false);
      setPreviewData([]);
      setFile(null);
      onImportSuccess();
    } catch (error: any) {
      toast.error(error.message || `Erro ao importar ${entityName.toLowerCase()}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast.error(`Nenhum ${entityNameSingular.toLowerCase()} para exportar`);
      return;
    }

    const exportData = data.map((item) => {
      const row: any = {};
      columns.forEach((col) => {
        row[col.label] = item[col.key] || "";
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, entityName);
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Arquivo exportado com sucesso!");
  };

  const downloadTemplate = () => {
    const template: any = {};
    columns.forEach((col) => {
      template[col.label] = col.example || `Exemplo ${col.label}`;
    });

    const worksheet = XLSX.utils.json_to_sheet([template]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, entityName);
    XLSX.writeFile(workbook, `template_${fileName}.xlsx`);
    toast.success("Template baixado com sucesso!");
  };

  return (
    <div className="flex gap-2">
      {/* Botão Exportar */}
      <Button onClick={handleExport} variant="outline" className="glass-card hover:bg-white/20">
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </Button>

      {/* Botão Importar */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              setPreviewData([]);
              setFile(null);
            }}
            variant="outline"
            className="glass-card hover:bg-white/20"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-card max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Importar {entityName}
            </DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo Excel (.xlsx) ou CSV com os dados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" onClick={downloadTemplate} className="glass-card">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Baixar Template
              </Button>
              <span className="text-sm text-muted-foreground">
                Use o template como exemplo do formato esperado
              </span>
            </div>

            <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center glass-card">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-generic"
              />
              <label htmlFor="file-upload-generic" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {file ? file.name : "Clique para selecionar um arquivo"}
                </p>
                <p className="text-xs text-muted-foreground">Formatos suportados: .xlsx, .xls, .csv</p>
              </label>
            </div>

            {previewData.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">
                  Preview ({previewData.length} {entityName.toLowerCase()})
                </h3>
                <div className="max-h-60 overflow-y-auto border border-border/50 rounded-lg glass-card">
                  <table className="w-full text-sm">
                    <thead className="bg-white/10 sticky top-0">
                      <tr>
                        {columns.slice(0, 4).map((col) => (
                          <th key={col.key} className="p-2 text-left">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((item, index) => (
                        <tr key={index} className="border-t border-border/30">
                          {columns.slice(0, 4).map((col) => (
                            <td key={col.key} className="p-2">
                              {item[col.key] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <p className="text-xs text-muted-foreground p-2 text-center">
                      ... e mais {previewData.length - 10} {entityName.toLowerCase()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              className="glass-card"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={previewData.length === 0 || isImporting}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isImporting ? "Importando..." : `Importar ${previewData.length} ${entityName}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
