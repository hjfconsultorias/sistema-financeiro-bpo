import { useState } from "react";
import FinancialDashboardLayout from "@/components/FinancialDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, DollarSign, CreditCard, Smartphone, Banknote, FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import CSVImportDialog from "@/components/CSVImportDialog";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
  return Math.round(parseFloat(cleaned || "0") * 100);
}

export default function DailyRevenues() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estados dos filtros
  const [filterCompanyId, setFilterCompanyId] = useState<string>("all");
  const [filterEventId, setFilterEventId] = useState<string>("all");
  const [filterDayOfWeek, setFilterDayOfWeek] = useState<string>("all");
  const [filterDayOfMonth, setFilterDayOfMonth] = useState<string>("all");

  const { data: revenues = [], refetch } = trpc.dailyRevenues.list.useQuery();
  const { data: companies = [] } = trpc.companies.list.useQuery();
  const { data: allEvents = [] } = trpc.events.listActive.useQuery();
  const { data: categories = [] } = trpc.revenueCategories.listActive.useQuery();
  
  // Filtrar receitas
  const filteredRevenues = revenues.filter((revenue) => {
    // Filtro por empresa (via evento)
    if (filterCompanyId && filterCompanyId !== "all") {
      const event = allEvents.find(e => e.id === revenue.eventId);
      if (!event || event.companyId !== parseInt(filterCompanyId)) return false;
    }
    
    // Filtro por evento
    if (filterEventId && filterEventId !== "all" && revenue.eventId !== parseInt(filterEventId)) return false;
    
    // Filtro por dia da semana (0=domingo, 1=segunda, etc.)
    if (filterDayOfWeek && filterDayOfWeek !== "all") {
      const date = new Date(revenue.date);
      if (date.getDay().toString() !== filterDayOfWeek) return false;
    }
    
    // Filtro por dia do mês
    if (filterDayOfMonth && filterDayOfMonth !== "all") {
      const date = new Date(revenue.date);
      if (date.getDate().toString() !== filterDayOfMonth) return false;
    }
    
    return true;
  });

  const createMutation = trpc.dailyRevenues.create.useMutation({
    onSuccess: () => {
      toast.success("Receita lançada com sucesso!");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao lançar receita: ${error.message}`);
    },
  });

  const updateMutation = trpc.dailyRevenues.update.useMutation({
    onSuccess: () => {
      toast.success("Receita atualizada com sucesso!");
      refetch();
      setIsDialogOpen(false);
      setEditingId(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar receita: ${error.message}`);
    },
  });

  const deleteMutation = trpc.dailyRevenues.delete.useMutation({
    onSuccess: () => {
      toast.success("Receita excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir receita: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    companyId: "",
    eventId: "",
    revenueCategoryId: "",
    cashAmount: "",
    debitCardAmount: "",
    creditCardAmount: "",
    pixAmount: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      companyId: "",
      eventId: "",
      revenueCategoryId: "",
      cashAmount: "",
      debitCardAmount: "",
      creditCardAmount: "",
      pixAmount: "",
      notes: "",
    });
  };

  const handleExport = () => {
    try {
      if (!revenues || revenues.length === 0) {
        toast.error("Nenhuma receita para exportar");
        return;
      }
      
      // Create CSV content
      const headers = ["Data", "Evento", "Categoria", "Dinheiro", "Cart\u00e3o D\u00e9bito", "Cart\u00e3o Cr\u00e9dito", "PIX", "Total", "Observa\u00e7\u00f5es"];
      const rows = revenues.map((item: any) => [
        new Date(item.date).toLocaleDateString("pt-BR"),
        item.event?.name || "",
        item.revenueCategory?.name || "",
        (item.cashAmount / 100).toFixed(2),
        (item.debitCardAmount / 100).toFixed(2),
        (item.creditCardAmount / 100).toFixed(2),
        (item.pixAmount / 100).toFixed(2),
        (item.totalAmount / 100).toFixed(2),
        item.notes || "",
      ]);
      
      const csvContent = [headers, ...rows]
        .map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(","))
        .join("\n");
      
      // Download CSV
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `receitas_diarias_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      
      toast.success("Receitas exportadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar receitas");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      date: formData.date,
      eventId: parseInt(formData.eventId),
      revenueCategoryId: parseInt(formData.revenueCategoryId),
      cashAmount: parseCurrency(formData.cashAmount),
      debitCardAmount: parseCurrency(formData.debitCardAmount),
      creditCardAmount: parseCurrency(formData.creditCardAmount),
      pixAmount: parseCurrency(formData.pixAmount),
      notes: formData.notes,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (revenue: any) => {
    setEditingId(revenue.id);
    // Find the event to get its companyId
    const event = allEvents.find(e => e.id === revenue.eventId);
    setFormData({
      date: new Date(revenue.date).toISOString().split("T")[0],
      companyId: event?.companyId?.toString() || "",
      eventId: revenue.eventId.toString(),
      revenueCategoryId: revenue.revenueCategoryId.toString(),
      cashAmount: (revenue.cashAmount / 100).toFixed(2).replace(".", ","),
      debitCardAmount: (revenue.debitCardAmount / 100).toFixed(2).replace(".", ","),
      creditCardAmount: (revenue.creditCardAmount / 100).toFixed(2).replace(".", ","),
      pixAmount: (revenue.pixAmount / 100).toFixed(2).replace(".", ","),
      notes: revenue.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta receita?")) {
      deleteMutation.mutate({ id });
    }
  };

  const calculateTotal = () => {
    return (
      parseCurrency(formData.cashAmount) +
      parseCurrency(formData.debitCardAmount) +
      parseCurrency(formData.creditCardAmount) +
      parseCurrency(formData.pixAmount)
    );
  };

  return (
    <FinancialDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">Receitas Diárias</h1>
            <p className="text-muted-foreground mt-2 text-lg">Lançamento de receitas por forma de pagamento</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExport}
              variant="outline"
              className="glass-card"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button
              onClick={() => setIsImportDialogOpen(true)}
              variant="outline"
              className="glass-card"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingId(null); resetForm(); }} className="bg-gradient-primary hover:opacity-90 shadow-soft glow-primary">
                <Plus className="w-4 h-4 mr-2" />
                Nova Receita
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {editingId ? "Editar Receita" : "Nova Receita Diária"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="glass-card"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa (CNPJ) *</Label>
                    <Select 
                      value={formData.companyId} 
                      onValueChange={(value) => setFormData({ ...formData, companyId: value, eventId: "" })}
                    >
                      <SelectTrigger className="glass-card">
                        <SelectValue placeholder="Selecione a empresa..." />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.filter(c => c.active === 1).map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.tradeName || company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event">Evento *</Label>
                    <Select 
                      value={formData.eventId} 
                      onValueChange={(value) => setFormData({ ...formData, eventId: value })}
                      disabled={!formData.companyId}
                    >
                      <SelectTrigger className="glass-card">
                        <SelectValue placeholder={formData.companyId ? "Selecione o evento..." : "Selecione empresa primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {allEvents
                          .filter(e => e.companyId?.toString() === formData.companyId)
                          .map((event) => (
                            <SelectItem key={event.id} value={event.id.toString()}>
                              {event.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={formData.revenueCategoryId} onValueChange={(value) => setFormData({ ...formData, revenueCategoryId: value })}>
                    <SelectTrigger className="glass-card">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="glass-card p-6 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Formas de Pagamento
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cash" className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        Dinheiro
                      </Label>
                      <Input
                        id="cash"
                        type="text"
                        placeholder="0,00"
                        value={formData.cashAmount}
                        onChange={(e) => setFormData({ ...formData, cashAmount: e.target.value })}
                        className="glass-card"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="debit" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        Cartão Débito
                      </Label>
                      <Input
                        id="debit"
                        type="text"
                        placeholder="0,00"
                        value={formData.debitCardAmount}
                        onChange={(e) => setFormData({ ...formData, debitCardAmount: e.target.value })}
                        className="glass-card"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="credit" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-purple-600" />
                        Cartão Crédito
                      </Label>
                      <Input
                        id="credit"
                        type="text"
                        placeholder="0,00"
                        value={formData.creditCardAmount}
                        onChange={(e) => setFormData({ ...formData, creditCardAmount: e.target.value })}
                        className="glass-card"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pix" className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-teal-600" />
                        PIX
                      </Label>
                      <Input
                        id="pix"
                        type="text"
                        placeholder="0,00"
                        value={formData.pixAmount}
                        onChange={(e) => setFormData({ ...formData, pixAmount: e.target.value })}
                        className="glass-card"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    type="text"
                    placeholder="Observações adicionais..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="glass-card"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-gradient-primary hover:opacity-90 shadow-soft glow-primary">
                    {editingId ? "Atualizar" : "Lançar Receita"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingId(null);
                      resetForm();
                    }}
                    className="glass-card"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* CSV Import Dialog */}
        <CSVImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onSuccess={() => {
            refetch();
            setIsImportDialogOpen(false);
          }}
        />

        {/* Filtros */}
        <div className="glass-card p-6 shadow-soft-lg">
          <h3 className="text-lg font-semibold text-foreground mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro por Empresa */}
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={filterCompanyId} onValueChange={setFilterCompanyId}>
                <SelectTrigger className="glass-card">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.tradeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro por Evento */}
            <div className="space-y-2">
              <Label>Evento</Label>
              <Select value={filterEventId} onValueChange={setFilterEventId}>
                <SelectTrigger className="glass-card">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {allEvents
                    .filter(event => filterCompanyId === "all" || event.companyId === parseInt(filterCompanyId))
                    .map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro por Dia da Semana */}
            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <Select value={filterDayOfWeek} onValueChange={setFilterDayOfWeek}>
                <SelectTrigger className="glass-card">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="0">Domingo</SelectItem>
                  <SelectItem value="1">Segunda-feira</SelectItem>
                  <SelectItem value="2">Terça-feira</SelectItem>
                  <SelectItem value="3">Quarta-feira</SelectItem>
                  <SelectItem value="4">Quinta-feira</SelectItem>
                  <SelectItem value="5">Sexta-feira</SelectItem>
                  <SelectItem value="6">Sábado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro por Dia do Mês */}
            <div className="space-y-2">
              <Label>Dia do Mês</Label>
              <Select value={filterDayOfMonth} onValueChange={setFilterDayOfMonth}>
                <SelectTrigger className="glass-card">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Botão Limpar Filtros */}
          {(filterCompanyId !== "all" || filterEventId !== "all" || filterDayOfWeek !== "all" || filterDayOfMonth !== "all") && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterCompanyId("all");
                  setFilterEventId("all");
                  setFilterDayOfWeek("all");
                  setFilterDayOfMonth("all");
                }}
                className="glass-card"
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
        
        {/* Lista de Receitas */}
        <div className="glass-card p-6 shadow-soft-lg">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-foreground">Lançamentos Recentes</h3>
            <p className="text-sm text-muted-foreground mt-1">Histórico de receitas diárias ({filteredRevenues.length} {filteredRevenues.length === 1 ? 'registro' : 'registros'})</p>
          </div>

          {filteredRevenues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {revenues.length === 0 ? 'Nenhuma receita lançada ainda' : 'Nenhum registro encontrado com os filtros aplicados'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRevenues.map((revenue) => {
                const event = allEvents.find((cc) => cc.id === revenue.eventId);
                const category = categories.find((cat) => cat.id === revenue.revenueCategoryId);

                return (
                  <div
                    key={revenue.id}
                    className="p-5 rounded-xl bg-white/40 hover:bg-white/60 transition-all duration-200 border border-border/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-muted-foreground">
                            {new Date(revenue.date).toLocaleDateString("pt-BR", { 
                              weekday: "long", 
                              year: "numeric", 
                              month: "2-digit", 
                              day: "2-digit" 
                            })}
                          </span>
                          <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                            {category?.name}
                          </span>
                        </div>
                        <p className="font-semibold text-foreground mb-3">{event?.name}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {revenue.cashAmount > 0 && (
                            <div className="flex items-center gap-2">
                              <Banknote className="w-4 h-4 text-emerald-600" />
                              <span className="text-muted-foreground">Dinheiro:</span>
                              <span className="font-semibold">{formatCurrency(revenue.cashAmount)}</span>
                            </div>
                          )}
                          {revenue.debitCardAmount > 0 && (
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-blue-600" />
                              <span className="text-muted-foreground">Débito:</span>
                              <span className="font-semibold">{formatCurrency(revenue.debitCardAmount)}</span>
                            </div>
                          )}
                          {revenue.creditCardAmount > 0 && (
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-purple-600" />
                              <span className="text-muted-foreground">Crédito:</span>
                              <span className="font-semibold">{formatCurrency(revenue.creditCardAmount)}</span>
                            </div>
                          )}
                          {revenue.pixAmount > 0 && (
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-teal-600" />
                              <span className="text-muted-foreground">PIX:</span>
                              <span className="font-semibold">{formatCurrency(revenue.pixAmount)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            {formatCurrency(revenue.totalAmount)}
                          </p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(revenue)}
                            className="hover:bg-primary/10"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(revenue.id)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Dialog de Importação */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Receitas Diárias via Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Faça upload de um arquivo Excel (.xlsx) com as colunas: Evento, Data, Dia da Semana, DINHEIRO, CARTÃO DEBITO, CARTÃO DE CREDITO, PIX, Total Faturamento
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const csv = "Evento,Data,Dia da Semana,DINHEIRO,CART\u00c3O DEBITO,CART\u00c3O DE CREDITO,PIX,Total Faturamento\nSitio Kids,01/12/2025,segunda-feira,190.50,476.25,190.50,95.25,952.50";
                  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'modelo-receitas-diarias.csv';
                  link.click();
                  toast.success("Modelo baixado com sucesso!");
                }}
                className="flex-1"
              >
                <FileUp className="w-4 h-4 mr-2" />
                Baixar Modelo CSV
              </Button>
            </div>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  toast.info("Importação via interface em desenvolvimento. Use o script import-revenues.mjs");
                  setIsImportDialogOpen(false);
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </FinancialDashboardLayout>
  );
}
