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
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SupplierImportExport } from "@/components/SupplierImportExport";
import { usePermissions, MODULE_IDS } from "@/hooks/usePermissions";

export default function Suppliers() {
  const { canCreate, canEdit, canDelete, canExport } = usePermissions(MODULE_IDS.FINANCEIRO);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    cnpjCpf: "",
    email: "",
    phone: "",
    address: "",
    pix: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: suppliers = [], isLoading } = trpc.suppliers.list.useQuery();

  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      utils.suppliers.list.invalidate();
      handleDialogClose();
      toast.success("Fornecedor criado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar fornecedor");
    },
  });

  const updateMutation = trpc.suppliers.update.useMutation({
    onSuccess: () => {
      utils.suppliers.list.invalidate();
      handleDialogClose();
      toast.success("Fornecedor atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar fornecedor");
    },
  });

  const deleteMutation = trpc.suppliers.delete.useMutation({
    onSuccess: () => {
      utils.suppliers.list.invalidate();
      toast.success("Fornecedor desativado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desativar fornecedor");
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

  const handleEdit = (supplier: any) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name,
      cnpjCpf: supplier.cnpjCpf || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      pix: supplier.pix || "",
      notes: supplier.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja desativar este fornecedor?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      cnpjCpf: "",
      email: "",
      phone: "",
      address: "",
      pix: "",
      notes: "",
    });
  };

  return (
    <FinancialDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Fornecedores
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Gerencie seus fornecedores</p>
          </div>
          <div className="flex gap-2">
            <SupplierImportExport onImportSuccess={() => utils.suppliers.list.invalidate()} />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            {canCreate && (
              <DialogTrigger asChild>
                <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: "",
                    cnpjCpf: "",
                    email: "",
                    phone: "",
                    address: "",
                    pix: "",
                    notes: "",
                  });
                }}
                className="bg-gradient-primary hover:opacity-90 shadow-soft glow-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Fornecedor
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="glass-card max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {editingId ? "Editar Fornecedor" : "Novo Fornecedor"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do fornecedor abaixo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome do Fornecedor <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="glass-card"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cnpjCpf">
                      CNPJ/CPF <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cnpjCpf"
                      value={formData.cnpjCpf}
                      onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
                      placeholder="00.000.000/0000-00 ou 000.000.000-00"
                      required
                      className="glass-card"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pix" className="flex items-center gap-2">
                      Chave PIX
                      <span className="text-amber-500 flex items-center gap-1 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        Importante
                      </span>
                    </Label>
                    <Input
                      id="pix"
                      value={formData.pix}
                      onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                      placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                      className="glass-card"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recomendamos cadastrar a chave PIX para facilitar pagamentos
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="glass-card"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="glass-card"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="glass-card"
                      rows={2}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">
                      Observação
                      <span className="text-xs text-muted-foreground ml-2">
                        (máx. 200 caracteres)
                      </span>
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      maxLength={200}
                      className="glass-card"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.notes.length}/200
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose} className="glass-card">
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {editingId ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card className="glass-card shadow-soft-lg">
          <CardContent className="p-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground">Carregando...</p>
            ) : suppliers.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum fornecedor cadastrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ/CPF</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>PIX</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="border-border/30 hover:bg-white/10">
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.cnpjCpf}</TableCell>
                      <TableCell>{supplier.email || "-"}</TableCell>
                      <TableCell>{supplier.phone || "-"}</TableCell>
                      <TableCell>
                        {supplier.pix ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(supplier)}
                              className="hover:bg-white/20"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(supplier.id)}
                              className="hover:bg-red-500/20 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
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
