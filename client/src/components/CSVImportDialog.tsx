import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedRow {
  date: string;
  eventName: string;
  categoryName: string;
  cashAmount: number;
  debitCardAmount: number;
  creditCardAmount: number;
  pixAmount: number;
}

export default function CSVImportDialog({ open, onOpenChange, onSuccess }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);

  const importMutation = trpc.dailyRevenues.importFromCSV.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      if (result.success > 0) {
        toast.success(`${result.success} receita(s) importada(s) com sucesso!`);
        onSuccess();
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} erro(s) encontrado(s)`);
      }
    },
    onError: (error) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        // Parse data based on the spreadsheet format
        const parsed: ParsedRow[] = [];
        
        // Find the header row (looking for "DIA")
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          if (jsonData[i].some((cell: any) => String(cell).toUpperCase().includes("DIA"))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error("Formato de planilha inválido. Não foi possível encontrar o cabeçalho.");
          return;
        }

        const headers = jsonData[headerRowIndex].map((h: any) => String(h).toUpperCase().trim());
        
        // Find column indices
        const diaIndex = headers.findIndex((h) => h.includes("DIA"));
        const cnpjIndex = headers.findIndex((h) => h.includes("CNPJ") || h.includes("CENTRO"));
        const dinheiroIndex = headers.findIndex((h) => h.includes("DINHEIRO"));
        const debitoIndex = headers.findIndex((h) => h.includes("DÉBITO") || h.includes("DEBITO"));
        const creditoIndex = headers.findIndex((h) => h.includes("CRÉDITO") || h.includes("CREDITO"));
        const pixIndex = headers.findIndex((h) => h.includes("PIX"));

        // Get category from sheet name or first row
        const sheetName = workbook.SheetNames[0];
        let categoryName = "Stand - Serviço Entretenimento"; // Default
        if (sheetName.toUpperCase().includes("PRODUTO")) {
          categoryName = "Produto";
        } else if (sheetName.toUpperCase().includes("STAND") || sheetName.toUpperCase().includes("SERV")) {
          categoryName = "Stand - Serviço Entretenimento";
        }

        // Parse data rows
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || !row[diaIndex]) continue;

          const dateValue = row[diaIndex];
          let date: Date;

          // Handle Excel date serial number
          if (typeof dateValue === "number") {
            const parsed = XLSX.SSF.parse_date_code(dateValue) as any;
            date = new Date(parsed.y, parsed.m - 1, parsed.d);
          } else if (typeof dateValue === "string") {
            // Try to parse string date
            const parts = dateValue.split("/");
            if (parts.length === 3) {
              date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            } else {
              date = new Date(dateValue);
            }
          } else {
            continue;
          }

          if (isNaN(date.getTime())) continue;

          const eventName = row[cnpjIndex] ? String(row[cnpjIndex]).trim() : "";
          if (!eventName) continue;

          const parseCurrency = (val: any): number => {
            if (typeof val === "number") return Math.round(val * 100);
            if (typeof val === "string") {
              const cleaned = val.replace(/[^\d,.-]/g, "").replace(",", ".");
              return Math.round(parseFloat(cleaned || "0") * 100);
            }
            return 0;
          };

          parsed.push({
            date: date.toISOString().split("T")[0],
            eventName,
            categoryName,
            cashAmount: parseCurrency(row[dinheiroIndex]),
            debitCardAmount: parseCurrency(row[debitoIndex]),
            creditCardAmount: parseCurrency(row[creditoIndex]),
            pixAmount: parseCurrency(row[pixIndex]),
          });
        }

        setParsedData(parsed);
        toast.success(`${parsed.length} linha(s) detectada(s) para importação`);
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Erro ao processar arquivo. Verifique o formato.");
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = () => {
    if (parsedData.length === 0) {
      toast.error("Nenhum dado para importar");
      return;
    }

    importMutation.mutate({ rows: parsedData });
  };

  const handleDownloadTemplate = () => {
    const template = [
      ["DIA", "CNPJ", "DINHEIRO", "CARTÃO DÉBITO", "CARTÃO DE CRÉDITO", "PIX"],
      ["01/12/2025", "A FLORESTA", "100,00", "50,00", "75,00", "25,00"],
      ["02/12/2025", "A FLORESTA", "200,00", "100,00", "150,00", "50,00"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stand - Serviço Entretenimento");
    XLSX.writeFile(wb, "template_receitas.xlsx");
    toast.success("Template baixado com sucesso!");
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Importar Receitas em Lote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Download Template */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Template de Exemplo</h3>
                <p className="text-sm text-muted-foreground">Baixe o modelo para preencher seus dados</p>
              </div>
              <Button onClick={handleDownloadTemplate} variant="outline" className="glass-card">
                <Download className="w-4 h-4 mr-2" />
                Baixar Template
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div className="glass-card p-6 border-2 border-dashed border-border/50">
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">
                    {file ? file.name : "Clique para selecionar arquivo"}
                  </p>
                  <p className="text-sm text-muted-foreground">Formatos aceitos: .xlsx, .xls, .csv</p>
                </div>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Preview */}
          {parsedData.length > 0 && !importResult && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    Preview dos Dados
                  </h3>
                  <p className="text-sm text-muted-foreground">{parsedData.length} linha(s) prontas para importar</p>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  className="bg-gradient-primary hover:opacity-90 shadow-soft glow-primary"
                >
                  {importMutation.isPending ? "Importando..." : "Confirmar Importação"}
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background/95 backdrop-blur">
                    <tr className="border-b border-border/50">
                      <th className="text-left p-2">Data</th>
                      <th className="text-left p-2">Evento</th>
                      <th className="text-left p-2">Categoria</th>
                      <th className="text-right p-2">Dinheiro</th>
                      <th className="text-right p-2">Débito</th>
                      <th className="text-right p-2">Crédito</th>
                      <th className="text-right p-2">PIX</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-b border-border/30 hover:bg-white/20">
                        <td className="p-2">{new Date(row.date).toLocaleDateString("pt-BR")}</td>
                        <td className="p-2">{row.eventName}</td>
                        <td className="p-2 text-xs">{row.categoryName}</td>
                        <td className="p-2 text-right">{formatCurrency(row.cashAmount)}</td>
                        <td className="p-2 text-right">{formatCurrency(row.debitCardAmount)}</td>
                        <td className="p-2 text-right">{formatCurrency(row.creditCardAmount)}</td>
                        <td className="p-2 text-right">{formatCurrency(row.pixAmount)}</td>
                        <td className="p-2 text-right font-semibold">
                          {formatCurrency(
                            row.cashAmount + row.debitCardAmount + row.creditCardAmount + row.pixAmount
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    ... e mais {parsedData.length - 10} linha(s)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="space-y-4">
              {importResult.success > 0 && (
                <div className="glass-card p-4 border-l-4 border-green-500">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-foreground">{importResult.success} receita(s) importada(s)</p>
                      <p className="text-sm text-muted-foreground">Importação concluída com sucesso</p>
                    </div>
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div className="glass-card p-4 border-l-4 border-red-500">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-6 h-6 text-red-600 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground mb-2">
                        {importResult.errors.length} erro(s) encontrado(s)
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResult.errors.map((err, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground">
                            Linha {err.row}: {err.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                  setImportResult(null);
                  onOpenChange(false);
                }}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                Concluir
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
