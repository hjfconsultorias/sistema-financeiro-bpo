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
import { trpc } from "@/lib/trpc";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface SupplierImportExportProps {
  onImportSuccess: () => void;
}

export function SupplierImportExport({ onImportSuccess }: SupplierImportExportProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const { data: suppliers = [] } = trpc.suppliers.exportCSV.useQuery();
  const importMutation = trpc.suppliers.importCSV.useMutation({
    onSuccess: (result) => {
      if (result.errors.length > 0) {
        toast.error(`${result.success} fornecedores importados com ${result.errors.length} erros`);
        console.error("Erros de importação:", result.errors);
      } else {
        toast.success(`${result.success} fornecedores importados com sucesso!`);
      }
      setImportDialogOpen(false);
      setPreviewData([]);
      setFile(null);
      onImportSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao importar fornecedores");
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Mapear colunas da planilha para formato esperado
        const mapped = jsonData.map((row: any) => ({
          name: String(row["Nome"] || row["Nome do Fornecedor"] || row["name"] || ""),
          cnpjCpf: String(row["CNPJ/CPF"] || row["CNPJ"] || row["CPF"] || row["cnpjCpf"] || ""),
          email: String(row["Email"] || row["email"] || ""),
          phone: String(row["Telefone"] || row["phone"] || ""),
          address: String(row["Endereço"] || row["Endereco"] || row["address"] || ""),
          pix: String(row["PIX"] || row["Chave PIX"] || row["pix"] || ""),
          notes: String(row["Observação"] || row["Observacao"] || row["notes"] || ""),
        }));

        setPreviewData(mapped);
      } catch (error) {
        toast.error("Erro ao processar arquivo. Verifique o formato.");
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleImport = () => {
    if (previewData.length === 0) {
      toast.error("Nenhum dado para importar");
      return;
    }
    importMutation.mutate({ data: previewData });
  };

  const handleExport = () => {
    if (suppliers.length === 0) {
      toast.error("Nenhum fornecedor para exportar");
      return;
    }

    const exportData = suppliers.map((s) => ({
      "Nome": s.name,
      "CNPJ/CPF": s.cnpjCpf,
      "Email": s.email || "",
      "Telefone": s.phone || "",
      "Endereço": s.address || "",
      "PIX": s.pix || "",
      "Observação": s.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fornecedores");
    XLSX.writeFile(workbook, `fornecedores_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Arquivo exportado com sucesso!");
  };

  const downloadTemplate = () => {
    const template = [
      {
        "Nome": "Exemplo Fornecedor Ltda",
        "CNPJ/CPF": "00.000.000/0000-00",
        "Email": "contato@exemplo.com",
        "Telefone": "(11) 99999-9999",
        "Endereço": "Rua Exemplo, 123",
        "PIX": "exemplo@pix.com",
        "Observação": "Observação exemplo",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fornecedores");
    XLSX.writeFile(workbook, "template_fornecedores.xlsx");
    toast.success("Template baixado com sucesso!");
  };

  return (
    <div className="flex gap-2">
      {/* Botão Exportar */}
      <Button
        onClick={handleExport}
        variant="outline"
        className="glass-card hover:bg-white/20"
      >
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
              Importar Fornecedores
            </DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo Excel (.xlsx) ou CSV com os dados dos fornecedores
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={downloadTemplate}
                className="glass-card"
              >
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
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {file ? file.name : "Clique para selecionar um arquivo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos suportados: .xlsx, .xls, .csv
                </p>
              </label>
            </div>

            {previewData.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">
                  Preview ({previewData.length} fornecedores)
                </h3>
                <div className="max-h-60 overflow-y-auto border border-border/50 rounded-lg glass-card">
                  <table className="w-full text-sm">
                    <thead className="bg-white/10 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Nome</th>
                        <th className="p-2 text-left">CNPJ/CPF</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Telefone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((item, index) => (
                        <tr key={index} className="border-t border-border/30">
                          <td className="p-2">{item.name}</td>
                          <td className="p-2">{item.cnpjCpf}</td>
                          <td className="p-2">{item.email || "-"}</td>
                          <td className="p-2">{item.phone || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <p className="text-xs text-muted-foreground p-2 text-center">
                      ... e mais {previewData.length - 10} fornecedores
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
              disabled={previewData.length === 0 || importMutation.isPending}
              className="bg-gradient-primary hover:opacity-90"
            >
              {importMutation.isPending ? "Importando..." : `Importar ${previewData.length} Fornecedores`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
