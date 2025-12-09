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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, CheckCircle, FileUp, FileDown, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default function AccountsPayable() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    dueDate: "",
    companyId: "",
    eventId: "",
    supplierId: "",
    categoryId: "",
    subcategoryId: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: accounts = [], isLoading } = trpc.accountsPayable.list.useQuery();
  const { data: companies = [] } = trpc.companies.list.useQuery();
  const { data: allEvents = [] } = trpc.events.listActive.useQuery();
  const { data: suppliers = [] } = trpc.suppliers.listActive.useQuery();
  const { data: allCategories = [] } = trpc.categories.list.useQuery();
  const { data: allSubcategories = [] } = trpc.subcategories.list.useQuery();

  // Filtrar eventos pela empresa selecionada
  const events = formData.companyId
    ? allEvents.filter(event => event.companyId === parseInt(formData.companyId))
    : allEvents;

  // Filtrar categorias de despesa
  const expenseCategories = allCategories.filter(c => c.type === "expense" && c.active === 1);

  // Filtrar subcategorias pela categoria selecionada
  const subcategories = formData.categoryId
    ? allSubcategories.filter(sub => sub.categoryId === parseInt(formData.categoryId) && sub.active === 1)
    : [];

  const createMutation = trpc.accountsPayable.create.useMutation({
    onSuccess: () => {
      utils.accountsPayable.list.invalidate();
      handleDialogClose();
      toast.success("Conta a pagar criada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar conta a pagar");
    },
  });

  const updateMutation = trpc.accountsPayable.update.useMutation({
    onSuccess: () => {
      utils.accountsPayable.list.invalidate();
      handleDialogClose();
      toast.success("Conta a pagar atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar conta a pagar");
    },
  });

  const deleteMutation = trpc.accountsPayable.delete.useMutation({
    onSuccess: () => {
      utils.accountsPayable.list.invalidate();
      toast.success("Conta a pagar excluída com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir conta a pagar");
    },
  });

  const markAsPaidMutation = trpc.accountsPayable.markAsPaid.useMutation({
    onSuccess: () => {
      utils.accountsPayable.list.invalidate();
      toast.success("Conta marcada como paga!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao marcar conta como paga");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountInCents = Math.round(parseFloat(formData.amount) * 100);
    const data = {
      description: formData.description,
      amount: amountInCents,
      dueDate: new Date(formData.dueDate),
      eventId: parseInt(formData.eventId),
      supplierId: formData.supplierId && formData.supplierId !== "none" ? parseInt(formData.supplierId) : undefined,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
      subcategoryId: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
      notes: formData.notes || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (account: any) => {
    setEditingId(account.id);
    // Buscar companyId do evento
    const event = allEvents.find(e => e.id === account.eventId);
    setFormData({
      description: account.description,
      amount: (account.amount / 100).toFixed(2),
      dueDate: new Date(account.dueDate).toISOString().split("T")[0],
      companyId: event?.companyId?.toString() || "",
      eventId: account.eventId.toString(),
      supplierId: account.supplierId?.toString() || "",
      categoryId: account.categoryId?.toString() || "",
      subcategoryId: account.subcategoryId?.toString() || "",
      notes: account.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta conta a pagar?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleMarkAsPaid = (id: number) => {
    markAsPaidMutation.mutate({ id, paymentDate: new Date() });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData({
      description: "",
      amount: "",
      dueDate: "",
      companyId: "",
      eventId: "",
      supplierId: "",
      categoryId: "",
      subcategoryId: "",
      notes: "",
    });
  };

  const getCostCenterName = (id: number) => {
    return events.find(c => c.id === id)?.name || "N/A";
  };

  const getSupplierName = (id: number | null) => {
    if (!id) return "-";
    return suppliers.find(s => s.id === id)?.name || "N/A";
  };

  const getCategoryName = (id: number | null | undefined) => {
    if (!id) return "-";
    return expenseCategories.find(c => c.id === id)?.name || "N/A";
  };

  const getSubcategoryName = (id: number | null | undefined) => {
    if (!id) return "-";
    return allSubcategories.find(s => s.id === id)?.name || "N/A";
  };

  return (
    <FinancialDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Contas a Pagar</h1>
            <p className="text-slate-600 mt-2">Gerencie suas despesas e pagamentos</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  toast.info("Gerando arquivo Excel...");
                  const result = await utils.client.accountsPayable.export.query();
                  
                  if (!result || !result.data) {
                    toast.error("Nenhum dado para exportar");
                    return;
                  }
                  
                  // Converter base64 para blob
                  const byteCharacters = atob(result.data);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                  
                  // Criar link de download
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = result.filename;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  
                  toast.success("Arquivo exportado com sucesso!");
                } catch (error) {
                  console.error("Erro ao exportar:", error);
                  toast.error("Erro ao exportar arquivo");
                }
              }}
              className="border-blue-200 hover:bg-blue-50"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="border-blue-200 hover:bg-blue-50"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    description: "",
                    amount: "",
                    dueDate: "",
                    companyId: "",
                    eventId: "",
                    supplierId: "",
                    categoryId: "",
                    subcategoryId: "",
                    notes: "",
                  });
                }}
                className="bg-gradient-primary hover:opacity-90 shadow-soft glow-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta a Pagar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar" : "Nova"} Conta a Pagar</DialogTitle>
                  <DialogDescription>
                    {editingId ? "Atualize as informações" : "Preencha os dados"} da conta a pagar.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Aluguel, Fornecedor XYZ, etc."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor (R$) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0,00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Data de Vencimento *</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyId">Empresa *</Label>
                      <Select 
                        value={formData.companyId} 
                        onValueChange={v => setFormData({ ...formData, companyId: v, eventId: "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa..." />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.filter(c => c.active === 1).map(company => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.tradeName || company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventId">Evento *</Label>
                      <Select 
                        value={formData.eventId} 
                        onValueChange={v => setFormData({ ...formData, eventId: v })}
                        disabled={!formData.companyId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.companyId ? "Selecione o evento..." : "Selecione empresa primeiro"} />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map(cc => (
                            <SelectItem key={cc.id} value={cc.id.toString()}>
                              {cc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplierId">Fornecedor</Label>
                      <Select value={formData.supplierId} onValueChange={v => setFormData({ ...formData, supplierId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryId">Categoria</Label>
                      <Select 
                        value={formData.categoryId} 
                        onValueChange={v => setFormData({ ...formData, categoryId: v, subcategoryId: "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {expenseCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subcategoryId">Subcategoria</Label>
                      <Select 
                        value={formData.subcategoryId} 
                        onValueChange={v => setFormData({ ...formData, subcategoryId: v })}
                        disabled={!formData.categoryId || formData.categoryId === "none"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.categoryId && formData.categoryId !== "none" ? "Selecione..." : "Selecione categoria primeiro"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {subcategories.map(sub => (
                            <SelectItem key={sub.id} value={sub.id.toString()}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Informações adicionais"
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
            ) : accounts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500 mb-4">Nenhuma conta a pagar cadastrada</p>
                <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Conta a Pagar
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="overflow-auto max-h-[600px]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Vencimento</TableHead>
                      <TableHead className="w-[180px]">Evento</TableHead>
                      <TableHead className="w-[150px]">Fornecedor</TableHead>
                      <TableHead className="w-[140px]">Categoria</TableHead>
                      <TableHead className="w-[140px]">Subcategoria</TableHead>
                      <TableHead className="w-[120px] text-right">Valor</TableHead>
                      <TableHead className="min-w-[200px]">Descrição</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[120px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map(account => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium text-slate-700">
                          {new Date(account.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          <div className="truncate" title={getCostCenterName(account.eventId)}>
                            {getCostCenterName(account.eventId)}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          <div className="truncate" title={getSupplierName(account.supplierId)}>
                            {getSupplierName(account.supplierId)}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          <div className="truncate" title={getCategoryName(account.categoryId)}>
                            {getCategoryName(account.categoryId)}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          <div className="truncate" title={getSubcategoryName(account.subcategoryId)}>
                            {getSubcategoryName(account.subcategoryId)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-semibold">
                          {formatCurrency(account.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px] truncate text-slate-700" title={account.description}>
                            {account.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              account.status === "paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : account.status === "overdue"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {account.status === "paid" ? "Pago" : account.status === "overdue" ? "Vencido" : "Pendente"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {account.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsPaid(account.id)}
                                title="Marcar como pago"
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(account)}
                              title="Editar"
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(account.id)}
                              title="Excluir"
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Importação */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Contas a Pagar via Excel</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo Excel (.xlsx) com as colunas: Vencimento, Evento, Fornecedor, Categoria, Subcategoria, Valor, Descrição, Status, Observações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const csv = "Vencimento,Evento,Fornecedor,Categoria,Subcategoria,Valor,Descri\u00e7\u00e3o,Status,Observa\u00e7\u00f5es\n26/11/2024,Circo -Bp,Fornecedor Exemplo,01 - Despesas FIXA,- ALUGUEL,15000.00,Exemplo de descri\u00e7\u00e3o,Pendente,Observa\u00e7\u00f5es exemplo";
                  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'modelo-contas-a-pagar.csv';
                  link.click();
                  toast.success("Modelo baixado com sucesso!");
                }}
                className="flex-1"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Baixar Modelo CSV
              </Button>
            </div>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  toast.info("Importação via interface em desenvolvimento. Use o script import-payables-clean.mjs");
                  setImportDialogOpen(false);
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Botão Scroll para Topo */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-3 bg-gradient-primary text-white rounded-full shadow-lg hover:opacity-90 transition-all duration-300 z-50 glow-primary"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </FinancialDashboardLayout>
  );
}
