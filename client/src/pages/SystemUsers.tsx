import { useState, useEffect } from "react";
import FinancialDashboardLayout from "@/components/FinancialDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, Users, Shield, Building2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import ModulePermissionsManager from "@/components/ModulePermissionsManager";

const PROFILE_LABELS: Record<string, string> = {
  administrador: "Administrador",
  gerente_geral: "Gerente Geral",
  gerente_regional: "Gerente Regional",
  lider_financeiro: "Líder Financeiro",
  lider_rh: "Líder RH",
  lider_processos: "Líder de Processos",
  lider_operacional: "Líder Operacional",
  lider_evento: "Líder de Evento",
  sublider_evento: "Sublíder de Evento",
  caixa_entrada: "Caixa de Entrada",
  caixa_saida: "Caixa de Saída",
  monitor: "Monitor",
};

const PROFILE_COLORS: Record<string, string> = {
  administrador: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  gerente_geral: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  gerente_regional: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  lider_financeiro: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  lider_rh: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  lider_processos: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  lider_operacional: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  lider_evento: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  sublider_evento: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  caixa_entrada: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  caixa_saida: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  monitor: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export default function SystemUsers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: users = [], refetch } = trpc.systemUsers.list.useQuery();
  const { data: companies = [] } = trpc.companies.listActive.useQuery();
  const { data: events = [] } = trpc.events.listActive.useQuery();

  const updatePermissionsMutation = trpc.permissions.updateUserPermissions.useMutation();

  const createMutation = trpc.systemUsers.create.useMutation({
    onSuccess: async (result) => {
      // Salvar permissões após criar usuário
      if (formData.modulePermissions.length > 0) {
        try {
          await updatePermissionsMutation.mutateAsync({
            userId: result.id,
            permissions: formData.modulePermissions,
          });
        } catch (error) {
          console.error("Erro ao salvar permissões:", error);
        }
      }
      toast.success("Usuário criado com sucesso!");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar usuário: ${error.message}`);
    },
  });

  const updateMutation = trpc.systemUsers.update.useMutation({
    onSuccess: async () => {
      // Salvar permissões após atualizar usuário
      if (editingId) {
        try {
          await updatePermissionsMutation.mutateAsync({
            userId: editingId,
            permissions: formData.modulePermissions,
          });
        } catch (error) {
          console.error("Erro ao salvar permissões:", error);
        }
      }
      toast.success("Usuário atualizado com sucesso!");
      refetch();
      setIsDialogOpen(false);
      setEditingId(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
    },
  });

  const deleteMutation = trpc.systemUsers.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir usuário: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    profile: "",
    selectedCompanies: [] as number[],
    selectedEvents: [] as number[],
    modulePermissions: [] as Array<{
      moduleId: number;
      canView: number;
      canCreate: number;
      canEdit: number;
      canDelete: number;
      canApprove: number;
      canExport: number;
    }>,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      password: "",
      profile: "",
      selectedCompanies: [],
      selectedEvents: [],
      modulePermissions: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      phone: formData.phone || undefined,
      email: formData.email,
      password: formData.password || undefined,
      profile: formData.profile as any,
      companyIds: formData.selectedCompanies.length > 0 ? formData.selectedCompanies : undefined,
      eventIds: formData.selectedEvents.length > 0 ? formData.selectedEvents : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const permissionsQuery = trpc.systemUsers.getUserPermissions.useQuery(
    { id: editingId || 0 },
    { enabled: !!editingId }
  );

  const userModulePermissionsQuery = trpc.permissions.getAllUserPermissions.useQuery(
    { userId: editingId || 0 },
    { enabled: !!editingId }
  );

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      phone: user.phone || "",
      email: user.email,
      password: "", // Não preencher senha ao editar
      profile: user.profile,
      selectedCompanies: [],
      selectedEvents: [],
      modulePermissions: [], // Será carregado via useEffect
    });
    setIsDialogOpen(true);
  };

  // Atualizar formData quando permissões forem carregadas
  useEffect(() => {
    if (editingId && permissionsQuery.data) {
      setFormData(prev => ({
        ...prev,
        selectedCompanies: permissionsQuery.data.companies.map((c: any) => c.companyId),
        selectedEvents: permissionsQuery.data.events.map((e: any) => e.eventId),
      }));
    }
  }, [editingId, permissionsQuery.data]);

  // Carregar permissões de módulos do usuário
  useEffect(() => {
    if (editingId && userModulePermissionsQuery.data) {
      setFormData(prev => ({
        ...prev,
        modulePermissions: userModulePermissionsQuery.data.map((p: any) => ({
          moduleId: p.moduleId,
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
          canApprove: p.canApprove,
          canExport: p.canExport,
        })),
      }));
    }
  }, [editingId, userModulePermissionsQuery.data]);

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteMutation.mutate({ id });
    }
  };

  const toggleCompany = (companyId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedCompanies: prev.selectedCompanies.includes(companyId)
        ? prev.selectedCompanies.filter(id => id !== companyId)
        : [...prev.selectedCompanies, companyId],
    }));
  };

  const toggleEvent = (eventId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedEvents: prev.selectedEvents.includes(eventId)
        ? prev.selectedEvents.filter(id => id !== eventId)
        : [...prev.selectedEvents, eventId],
    }));
  };

  // Filtrar eventos por empresas selecionadas
  const filteredEvents = formData.selectedCompanies.length > 0
    ? events.filter(e => formData.selectedCompanies.includes(e.companyId))
    : events;

  return (
    <FinancialDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">Usuários do Sistema</h1>
            <p className="text-muted-foreground mt-2 text-lg">Gerenciamento de usuários e permissões</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingId(null); resetForm(); }} className="bg-gradient-primary hover:opacity-90 shadow-soft glow-primary">
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-card">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {editingId ? "Editar Usuário" : "Novo Usuário"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="glass-card"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 98765-4321"
                      className="glass-card"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="glass-card"
                      disabled={!!editingId} // Não permitir editar email
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {editingId ? "Nova Senha (deixe vazio para manter)" : "Senha *"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingId}
                      placeholder={editingId ? "••••••" : "Mínimo 6 caracteres"}
                      className="glass-card"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile">Perfil *</Label>
                  <Select value={formData.profile} onValueChange={(value) => setFormData({ ...formData, profile: value })}>
                    <SelectTrigger className="glass-card">
                      <SelectValue placeholder="Selecione o perfil..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROFILE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.profile && formData.profile !== "administrador" && (
                  <>
                    <div className="glass-card p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Empresas Vinculadas</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Selecione as empresas que este usuário pode acessar
                      </p>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {companies.map((company) => (
                          <div key={company.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`company-${company.id}`}
                              checked={formData.selectedCompanies.includes(company.id)}
                              onCheckedChange={() => toggleCompany(company.id)}
                            />
                            <label
                              htmlFor={`company-${company.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {company.tradeName || company.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Eventos Vinculados</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Selecione os eventos que este usuário pode acessar
                        {formData.selectedCompanies.length > 0 && " (filtrado pelas empresas selecionadas)"}
                      </p>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {filteredEvents.map((event) => (
                          <div key={event.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`event-${event.id}`}
                              checked={formData.selectedEvents.includes(event.id)}
                              onCheckedChange={() => toggleEvent(event.id)}
                            />
                            <label
                              htmlFor={`event-${event.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {event.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Módulos e Permissões */}
                <ModulePermissionsManager
                  userId={editingId || undefined}
                  initialPermissions={formData.modulePermissions}
                  onChange={(permissions) => setFormData({ ...formData, modulePermissions: permissions })}
                />

                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="glass-card">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-primary hover:opacity-90 shadow-soft">
                    {editingId ? "Atualizar" : "Criar"} Usuário
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Usuários Cadastrados
            </CardTitle>
            <CardDescription>Lista de todos os usuários do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Nenhum usuário cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="glass-card p-4 flex items-center justify-between hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PROFILE_COLORS[user.profile]}`}>
                          {PROFILE_LABELS[user.profile]}
                        </span>
                        {user.active === 0 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>📧 {user.email}</span>
                        {user.phone && <span>📱 {user.phone}</span>}
                        {user.lastLogin && (
                          <span>🕐 Último acesso: {new Date(user.lastLogin).toLocaleString("pt-BR")}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="glass-card"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        className="glass-card hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FinancialDashboardLayout>
  );
}
