import FinancialDashboardLayout from "@/components/FinancialDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImportExportCSV } from "@/components/ImportExportCSV";
import { usePermissions, MODULE_IDS } from "@/hooks/usePermissions";

export default function Clients() {
  const { canCreate, canEdit, canDelete, canExport } = usePermissions(MODULE_IDS.FINANCEIRO);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
  });

  const utils = trpc.useUtils();
  const { data: clients = [], isLoading } = trpc.clients.list.useQuery();
  const { data: exportClients = [] } = trpc.clients.exportCSV.useQuery();
  const importMutation = trpc.clients.importCSV.useMutation();

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      handleDialogClose();
      toast.success("Cliente criado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar cliente");
    },
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      handleDialogClose();
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar cliente");
    },
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      toast.success("Cliente desativado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desativar cliente");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (client: any) => {
    setEditingId(client.id);
    setFormData({
      name: client.name,
      cnpj: client.cnpj || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja desativar este cliente?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData({ name: "", cnpj: "", email: "", phone: "", address: "" });
  };

  return (
    <FinancialDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
            <p className="text-slate-600 mt-2">Gerencie seus clientes (Shoppings)</p>
          </div>
          <div className="flex gap-2">
            {(canCreate || canExport) && (
              <ImportExportCSV
                entityName="Clientes"
                entityNameSingular="Cliente"
                columns={[
                  { key: "name", label: "Nome", example: "Shopping Exemplo" },
                  { key: "cnpj", label: "CNPJ", example: "00.000.000/0000-00" },
                  { key: "email", label: "Email", example: "contato@shopping.com" },
                  { key: "phone", label: "Telefone", example: "(11) 99999-9999" },
                  { key: "address", label: "Endereço", example: "Av. Exemplo, 123" },
                ]}
                data={exportClients}
                onImport={(data) => importMutation.mutateAsync({ data })}
                onImportSuccess={() => utils.clients.list.invalidate()}
                fileName="clientes"
              />
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            {canCreate && (
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: "",
                    cnpj: "",
                    email: "",
                    phone: "",
                    address: "",
                  });
                }}
                className="bg-gradient-primary hover:opacity-90 shadow-soft glow-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar" : "Novo"} Cliente</DialogTitle>
                  <DialogDescription>
                    {editingId ? "Atualize as informações" : "Preencha os dados"} do cliente.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Shopping ABC"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contato@shopping.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(00) 0000-0000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Endereço completo"
                      rows={2}
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

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-8 text-center text-slate-500">Carregando...</div>
            ) : clients.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500 mb-4">Nenhum cliente cadastrado</p>
                {canCreate && (
                  <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Cliente
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(client => (
                    <TableRow key={client.id} className={client.active === 0 ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.cnpj || "-"}</TableCell>
                      <TableCell>{client.email || "-"}</TableCell>
                      <TableCell>{client.phone || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            client.active === 1
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {client.active === 1 ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                            disabled={client.active === 0}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </FinancialDashboardLayout>
  );
}
