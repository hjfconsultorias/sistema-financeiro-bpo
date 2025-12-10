import { useState } from "react";
import { trpc } from "../lib/trpc";
import FinancialDashboardLayout from "../components/FinancialDashboardLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Calendar, Building2, MapPin, Network, Filter, Upload, Download, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { useLocation } from "wouter";

export default function Agenda() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  // Estados
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    companyId: "",
    eventId: undefined as number | undefined,
    year: undefined as number | undefined,
    status: "",
    state: "",
    network: "",
    classification: "",
    shopping: "",
  });

  // Queries
  const { data: agendaList = [], isLoading } = trpc.agenda.list.useQuery(filters);
  const { data: stats } = trpc.agenda.stats.useQuery();
  const { data: companies = [] } = trpc.companies.listActive.useQuery();
  const { data: events = [] } = trpc.events.listActive.useQuery();

  // Mutations
  const importMutation = trpc.agenda.import.useMutation({
    onSuccess: (result) => {
      utils.agenda.list.invalidate();
      utils.agenda.stats.invalidate();
      setImportDialogOpen(false);
      setExcelFile(null);
      
      if (result.failed > 0) {
        toast.warning(
          `Importação concluída: ${result.imported} sucesso, ${result.failed} erros. Verifique o console para detalhes.`,
          { duration: 5000 }
        );
        console.log("Detalhes da importação:", result.details);
      } else {
        toast.success(`${result.imported} registros importados com sucesso!`);
      }
    },
    onError: (error) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
  });

  // Handlers
  const handleImportClick = () => {
    setImportDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!excelFile) {
      toast.error("Selecione um arquivo Excel");
      return;
    }

    setIsImporting(true);

    try {
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("Arquivo vazio");
        setIsImporting(false);
        return;
      }

      // Validar colunas
      const firstRow = jsonData[0] as any;
      const requiredColumns = ["EMPRESA", "EVENTO", "ANO", "PERIODO", "STATUS"];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        toast.error(`Colunas faltando: ${missingColumns.join(", ")}`);
        setIsImporting(false);
        return;
      }

      // Enviar para API
      await importMutation.mutateAsync({ records: jsonData as any });
    } catch (error: any) {
      toast.error(`Erro ao processar arquivo: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadModel = () => {
    // Criar modelo de exemplo
    const modelData = [
      {
        EMPRESA: "GP 1",
        EVENTO: "Av em Alto Mar",
        ANO: 2026,
        PERIODO: "Janeiro a Fevereiro",
        STATUS: "Fase de Contrato",
        SHOPPING: "PRUDEM",
        UF: "SP",
        REDE: "ARGOPLAN",
        CLASSIFICACAO: "Excelente",
        ALUGUEL: 1000,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(modelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agenda");
    XLSX.writeFile(wb, "modelo_importacao_agenda.xlsx");
    
    toast.success("Modelo baixado com sucesso!");
  };

  const handleExport = async () => {
    try {
      const data = await utils.client.agenda.export.query();
      
      if (data.length === 0) {
        toast.warning("Nenhum dado para exportar");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Agenda");
      XLSX.writeFile(wb, `agenda_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success("Dados exportados com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao exportar: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <FinancialDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FinancialDashboardLayout>
    );
  }

  return (
    <FinancialDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/modules")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Módulos
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8" />
                Agenda de Eventos
              </h1>
              <p className="text-muted-foreground">Gestão de eventos e logística de shoppings</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImportClick}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCompanies || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redes</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalNetworks || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStatus || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Empresa</Label>
                <Input
                  placeholder="Filtrar por empresa..."
                  value={filters.companyId}
                  onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
                />
              </div>
              <div>
                <Label>Ano</Label>
                <Input
                  type="number"
                  placeholder="2026"
                  value={filters.year || ""}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Input
                  placeholder="Filtrar por status..."
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                />
              </div>
              <div>
                <Label>UF</Label>
                <Input
                  placeholder="SP, RJ, etc..."
                  value={filters.state}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Eventos */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {agendaList.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum evento encontrado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Comece criando seu primeiro evento ou importe uma planilha Excel
                </p>
                <Button className="mt-4" onClick={handleImportClick}>
                  Importar Planilha
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Empresa</th>
                      <th className="text-left p-2">Evento</th>
                      <th className="text-left p-2">Período</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Shopping</th>
                      <th className="text-left p-2">UF</th>
                      <th className="text-left p-2">Rede</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendaList.map((item: any) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{item.company_id}</td>
                        <td className="p-2">{item.event_id}</td>
                        <td className="p-2">{item.period}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-2">{item.shopping || "-"}</td>
                        <td className="p-2">{item.state || "-"}</td>
                        <td className="p-2">{item.network || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Importação */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Eventos via Excel/CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Selecionar Arquivo</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={isImporting}
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Formato esperado do Excel:</p>
              <p className="text-xs text-muted-foreground">
                <strong>Colunas:</strong> EMPRESA, EVENTO, ANO, PERIODO, STATUS, SHOPPING, UF, REDE, CLASSIFICACAO, ALUGUEL
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Obrigatórias:</strong> EMPRESA, EVENTO, ANO, PERIODO, STATUS
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadModel}
                disabled={isImporting}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Modelo
              </Button>
              <Button
                onClick={handleImport}
                disabled={!excelFile || isImporting}
                className="flex-1"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FinancialDashboardLayout>
  );
}
