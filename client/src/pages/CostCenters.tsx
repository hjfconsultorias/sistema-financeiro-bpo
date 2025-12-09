import FinancialDashboardLayout from "@/components/FinancialDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImportExportCSV } from "@/components/ImportExportCSV";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions, MODULE_IDS } from "@/hooks/usePermissions";

export default function CostCenters() {
  const { canCreate, canEdit, canDelete, canExport } = usePermissions(MODULE_IDS.FINANCEIRO);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", companyId: "" });

  const utils = trpc.useUtils();
  const { data: events = [], isLoading } = trpc.events.list.useQuery();
  const { data: companies = [] } = trpc.companies.list.useQuery();
  const { data: exportCostCenters = [] } = trpc.events.exportCSV.useQuery();
  const importMutation = trpc.events.importCSV.useMutation();
  const createMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      utils.events.list.invalidate();
      setDialogOpen(false);
      setFormData({ name: "", description: "", companyId: "" });
      toast.success("Centro de custo criado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar centro de custo");
    },
  });

  const updateMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      utils.events.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
      setFormData({ name: "", description: "", companyId: "" });
      toast.success("Centro de custo atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar centro de custo");
    },
  });

  const deleteMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      utils.events.list.invalidate();
      toast.success("Centro de custo desativado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desativar centro de custo");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      name: formData.name,
      description: formData.description,
      companyId: parseInt(formData.companyId)
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (event: any) => {
    setEditingId(event.id);
    setFormData({ 
      name: event.name, 
      description: event.description || "",
      companyId: event.companyId?.toString() || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja desativar este centro de custo?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData({ name: "", description: "", companyId: "" });
  };

  return (
    <FinancialDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Eventos</h1>
            <p className="text-slate-600 mt-2">Gerencie suas operações e unidades de negócio</p>
          </div>
          <div className="flex gap-2">
            <ImportExportCSV
              entityName="Eventos"
              entityNameSingular="Evento"
              columns={[
                { key: "name", label: "Nome", example: "Loja Shopping ABC" },
                { key: "description", label: "Descrição", example: "Operação de stand no shopping ABC" },
              ]}
              data={exportCostCenters}
              onImport={(data) => importMutation.mutateAsync({ data })}
              onImportSuccess={() => utils.events.list.invalidate()}
              fileName="centros_de_custo"
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            {canCreate && (
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: "", description: "", companyId: "" });
                  }}
                  className="bg-gradient-primary hover:opacity-90 shadow-soft glow-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Evento
                </Button>
              </DialogTrigger>
            )}
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar" : "Novo"} Evento</DialogTitle>
                  <DialogDescription>
                    {editingId ? "Atualize as informações" : "Preencha os dados"} do centro de custo.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyId">Empresa (CNPJ) *</Label>
                    <Select
                      value={formData.companyId}
                      onValueChange={(value) => setFormData({ ...formData, companyId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.tradeName || company.name} - {company.cnpj}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Loja Shopping ABC"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Informações adicionais sobre o centro de custo"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    {editingId ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-slate-500">Carregando...</p>
            </CardContent>
          </Card>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-slate-500 mb-4">Nenhum centro de custo cadastrado</p>
                <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Evento
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <Card key={event.id} className={event.active === 0 ? "opacity-50" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">{event.name}</CardTitle>
                      {event.description && (
                        <CardDescription className="mt-2 line-clamp-2">{event.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                          disabled={event.active === 0}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-slate-500">
                    <p>Criado em: {new Date(event.createdAt).toLocaleDateString("pt-BR")}</p>
                    <p className="mt-1">
                      Status:{" "}
                      <span className={event.active === 1 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                        {event.active === 1 ? "Ativo" : "Inativo"}
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
