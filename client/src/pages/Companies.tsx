import { useState } from "react";
import { trpc } from "../lib/trpc";
import FinancialDashboardLayout from "../components/FinancialDashboardLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Plus, Pencil, Trash2, Building2, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { usePermissions, MODULE_IDS } from "../hooks/usePermissions";

export default function Companies() {
  const utils = trpc.useUtils();
  const { canCreate, canEdit, canDelete, canExport, isLoading: permissionsLoading } = usePermissions(MODULE_IDS.FINANCEIRO);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    tradeName: "",
    cnpj: "",
    stateRegistration: "",
    municipalRegistration: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const { data: companies = [], isLoading } = trpc.companies.list.useQuery();
  const { data: exportCompanies = [] } = trpc.companies.exportCSV.useQuery();

  const createMutation = trpc.companies.create.useMutation({
    onSuccess: () => {
      utils.companies.list.invalidate();
      handleDialogClose();
      toast.success("Empresa criada com sucesso.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.companies.update.useMutation({
    onSuccess: () => {
      utils.companies.list.invalidate();
      handleDialogClose();
      toast.success("Empresa atualizada com sucesso.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.companies.delete.useMutation({
    onSuccess: () => {
      utils.companies.list.invalidate();
      toast.success("Empresa excluída com sucesso.");
    },
  });

  const handleEdit = (company: any) => {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      tradeName: company.tradeName || "",
      cnpj: company.cnpj,
      stateRegistration: company.stateRegistration || "",
      municipalRegistration: company.municipalRegistration || "",
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      zipCode: company.zipCode || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta empresa?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      tradeName: "",
      cnpj: "",
      stateRegistration: "",
      municipalRegistration: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    });
  };

  const handleExport = () => {
    const headers = ["Razão Social", "Nome Fantasia", "CNPJ", "Inscrição Estadual", "Inscrição Municipal", "Email", "Telefone", "Endereço", "Cidade", "Estado", "CEP"];
    const rows = exportCompanies.map(company => [
      company.name,
      company.tradeName || "",
      company.cnpj,
      company.stateRegistration || "",
      company.municipalRegistration || "",
      company.email || "",
      company.phone || "",
      company.address || "",
      company.city || "",
      company.state || "",
      company.zipCode || "",
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `empresas_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success(`${exportCompanies.length} empresas exportadas com sucesso.`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());
    
    if (lines.length < 2) {
      toast.error("Arquivo CSV vazio ou inválido");
      return;
    }

    const rows = lines.slice(1).map(line => {
      const values = line.match(/"([^"]*)"|([^,]+)/g)?.map(v => v.replace(/^"|"$/g, "").trim()) || [];
      return {
        name: String(values[0] || ""),
        tradeName: String(values[1] || ""),
        cnpj: String(values[2] || ""),
        stateRegistration: String(values[3] || ""),
        municipalRegistration: String(values[4] || ""),
        email: String(values[5] || ""),
        phone: String(values[6] || ""),
        address: String(values[7] || ""),
        city: String(values[8] || ""),
        state: String(values[9] || ""),
        zipCode: String(values[10] || ""),
      };
    });

    setPreviewData(rows);
  };

  const importMutation = trpc.companies.importCSV.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.success} empresas importadas com sucesso!`);
      if (result.errors && result.errors.length > 0) {
        toast.warning(`${result.errors.length} empresas com erro foram ignoradas.`);
      }
      utils.companies.list.invalidate();
      setImportDialogOpen(false);
      setCsvFile(null);
      setPreviewData([]);
    },
    onError: (error) => {
      toast.error(`Erro ao importar: ${error.message}`);
    },
  });

  const handleImport = () => {
    if (previewData.length === 0) {
      toast.error("Nenhum dado para importar");
      return;
    }
    importMutation.mutate({ data: previewData });
  };

  return (
    <FinancialDashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
            Empresas (CNPJs)
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie as empresas do grupo</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Importar
            </Button>
          )}
          {canExport && (
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          )}

          {canCreate && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2 glass-button">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-card">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Nova"} Empresa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Razão Social *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Gestão de Parques Ltda"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="tradeName">Nome Fantasia</Label>
                <Input
                  id="tradeName"
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  placeholder="Ex: GP1"
                />
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  required
                  placeholder="00.000.000/0001-00"
                  maxLength={18}
                />
              </div>

              <div>
                <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
                <Input
                  id="stateRegistration"
                  value={formData.stateRegistration}
                  onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })}
                  placeholder="123.456.789.012"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="municipalRegistration">Inscrição Municipal</Label>
                <Input
                  id="municipalRegistration"
                  value={formData.municipalRegistration}
                  onChange={(e) => setFormData({ ...formData, municipalRegistration: e.target.value })}
                  placeholder="123456"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@empresa.com.br"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, complemento"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <Label htmlFor="state">Estado (UF)</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Cancelar
              </Button>
              <Button type="submit" className="glass-button">
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
          <DialogHeader>
            <DialogTitle>Importar Empresas via CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Selecione um arquivo CSV com as empresas
              </p>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto"
              />
            </div>

            {previewData.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Preview: {previewData.length} empresas encontradas
                  </p>
                  <Button
                    onClick={handleImport}
                    disabled={importMutation.isPending}
                    className="glass-button"
                  >
                    {importMutation.isPending ? "Importando..." : `Importar ${previewData.length} Empresas`}
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Razão Social</th>
                        <th className="p-2 text-left">CNPJ</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Cidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((company, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{company.name}</td>
                          <td className="p-2">{company.cnpj}</td>
                          <td className="p-2">{company.email}</td>
                          <td className="p-2">{company.city}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        </div>
      ) : companies.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma empresa cadastrada</p>
            <Button onClick={() => setDialogOpen(true)} className="glass-button">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Empresa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className={`glass-card ${company.active === 0 ? "opacity-50" : ""}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate" title={company.name}>{company.name}</CardTitle>
                    {company.tradeName && (
                      <CardDescription className="mt-1">{company.tradeName}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(company)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(company.id)}
                        disabled={company.active === 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{company.cnpj}</p>
                </div>
                {company.stateRegistration && (
                  <div>
                    <p className="text-muted-foreground">Inscrição Estadual</p>
                    <p className="font-medium">{company.stateRegistration}</p>
                  </div>
                )}
                {company.email && (
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium truncate">{company.email}</p>
                  </div>
                )}
                {company.phone && (
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p className="font-medium">{company.phone}</p>
                  </div>
                )}
                {company.city && company.state && (
                  <div>
                    <p className="text-muted-foreground">Localização</p>
                    <p className="font-medium">{company.city} - {company.state}</p>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Criado em: {new Date(company.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-xs mt-1">
                    <span className={company.active === 1 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                      {company.active === 1 ? "Ativa" : "Inativa"}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </FinancialDashboardLayout>
  );
}
