import { useMemo, useState } from "react";
import FinancialDashboardLayout from "@/components/FinancialDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const PAYMENT_COLORS = {
  cash: '#10b981',
  debit: '#3b82f6',
  credit: '#f59e0b',
  pix: '#ef4444'
};

// Componente de Previsibilidade CORRIGIDO
interface ForecastSectionProps {
  revenues: any[];
  filteredRevenues: any[];
  startDate: string;
  endDate: string;
  selectedCompanyId: string;
  allEvents: any[];
}

function ForecastSection({ revenues, filteredRevenues, startDate, endDate, selectedCompanyId, allEvents }: ForecastSectionProps) {
  // Calcular média por dia da semana baseado no histórico REAL
  const averageByDayOfWeek = useMemo(() => {
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Dom, Seg, Ter, Qua, Qui, Sex, Sáb
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    
    revenues.forEach((revenue) => {
      if (selectedCompanyId !== "all") {
        const event = allEvents.find(e => e.id === revenue.eventId);
        if (!event || event.companyId !== parseInt(selectedCompanyId)) return;
      }
      
      const date = new Date(revenue.date);
      const dayOfWeek = date.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
      
      dayTotals[dayOfWeek] += revenue.totalAmount;
      dayCounts[dayOfWeek]++;
    });
    
    return dayTotals.map((total, index) => 
      dayCounts[index] > 0 ? total / dayCounts[index] : 0
    );
  }, [revenues, selectedCompanyId, allEvents]);
  
  // Separar período em Real (com dados) e Estimativa (dias futuros)
  const periodAnalysis = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Criar mapa de datas com faturamento real
    const realDatesMap = new Map();
    filteredRevenues.forEach(revenue => {
      const dateKey = new Date(revenue.date).toISOString().split('T')[0];
      realDatesMap.set(dateKey, (realDatesMap.get(dateKey) || 0) + revenue.totalAmount);
    });
    
    let realTotal = 0;
    let estimatedTotal = 0;
    let realDays = 0;
    let estimatedDays = 0;
    let firstEstimatedDate: Date | null = null;
    let lastEstimatedDate: Date | null = null;
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      if (realDatesMap.has(dateKey)) {
        // Dia com faturamento real
        realTotal += realDatesMap.get(dateKey);
        realDays++;
      } else if (date > today) {
        // Dia futuro sem dados - usar estimativa
        const avgForDay = averageByDayOfWeek[dayOfWeek];
        estimatedTotal += avgForDay;
        estimatedDays++;
        
        if (!firstEstimatedDate) firstEstimatedDate = new Date(date);
        lastEstimatedDate = new Date(date);
      }
    }
    
    return {
      realTotal,
      estimatedTotal,
      totalPrevisto: realTotal + estimatedTotal,
      realDays,
      estimatedDays,
      firstEstimatedDate,
      lastEstimatedDate
    };
  }, [filteredRevenues, startDate, endDate, averageByDayOfWeek]);
  
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  
  return (
    <div className="glass-card p-4 md:p-6 shadow-soft-lg">
      <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-4">Previsibilidade de Faturamento</h3>
      <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
        Baseado em média histórica por dia da semana
      </p>
      
      {/* Resumo Principal */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-sm text-muted-foreground">Faturamento Real:</span>
              <span className="text-xl md:text-2xl font-bold text-foreground">{formatCurrency(periodAnalysis.realTotal)}</span>
            </div>
            
            {periodAnalysis.estimatedDays > 0 && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  Estimativa ({periodAnalysis.firstEstimatedDate?.toLocaleDateString('pt-BR')} a {periodAnalysis.lastEstimatedDate?.toLocaleDateString('pt-BR')}):
                </span>
                <span className="text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {formatCurrency(periodAnalysis.estimatedTotal)}
                </span>
              </div>
            )}
            
            <div className="pt-3 border-t border-gray-300 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-base md:text-lg font-semibold text-foreground">Total Previsto:</span>
                <span className="text-2xl md:text-3xl font-bold text-green-600">
                  {formatCurrency(periodAnalysis.totalPrevisto)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Médias por Dia da Semana */}
      <div className="p-4 rounded-lg bg-white/40">
        <h4 className="font-semibold text-foreground mb-3 text-sm md:text-base">📊 Média Histórica por Dia da Semana</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
          {dayNames.map((day, index) => (
            <div key={day} className="text-center p-2 rounded bg-gray-50 dark:bg-gray-800">
              <div className="text-xs text-muted-foreground mb-1 truncate">{day}</div>
              <div className="text-sm md:text-base font-semibold text-foreground break-words">
                {formatCurrency(averageByDayOfWeek[index])}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DailyRevenuesReport() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date("2025-11-01");
    return date.toISOString().split("T")[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const date = new Date("2025-12-01");
    return date.toISOString().split("T")[0];
  });
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [shouldGenerate, setShouldGenerate] = useState(false);

  const { data: companies } = trpc.companies.list.useQuery();
  const { data: events } = trpc.events.list.useQuery();
  const { data: revenues } = trpc.dailyRevenues.list.useQuery();

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (selectedCompanyId === "all") return events;
    return events.filter(event => event.companyId === parseInt(selectedCompanyId));
  }, [events, selectedCompanyId]);

  const filteredRevenues = useMemo(() => {
    if (!revenues || !shouldGenerate) return [];
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return revenues.filter(revenue => {
      const revenueDate = new Date(revenue.date);
      const inDateRange = revenueDate >= start && revenueDate <= end;
      
      if (!inDateRange) return false;
      
      if (selectedCompanyId !== "all") {
        const event = events?.find(e => e.id === revenue.eventId);
        if (!event || event.companyId !== parseInt(selectedCompanyId)) return false;
      }
      
      if (selectedEventId !== "all" && revenue.eventId !== parseInt(selectedEventId)) {
        return false;
      }
      
      return true;
    });
  }, [revenues, startDate, endDate, selectedCompanyId, selectedEventId, events, shouldGenerate]);

  const totalRevenue = useMemo(() => {
    return filteredRevenues.reduce((sum, revenue) => sum + revenue.totalAmount, 0);
  }, [filteredRevenues]);

  const paymentDistribution = useMemo(() => {
    const totals = {
      cash: 0,
      debit: 0,
      credit: 0,
      pix: 0
    };
    
    filteredRevenues.forEach(revenue => {
      totals.cash += revenue.cashAmount;
      totals.debit += revenue.debitCardAmount;
      totals.credit += revenue.creditCardAmount;
      totals.pix += revenue.pixAmount;
    });
    
    return [
      { name: 'Dinheiro', value: totals.cash, color: PAYMENT_COLORS.cash },
      { name: 'Débito', value: totals.debit, color: PAYMENT_COLORS.debit },
      { name: 'Crédito', value: totals.credit, color: PAYMENT_COLORS.credit },
      { name: 'PIX', value: totals.pix, color: PAYMENT_COLORS.pix }
    ];
  }, [filteredRevenues]);

  const revenueByCompany = useMemo(() => {
    const companyMap = new Map();
    
    filteredRevenues.forEach(revenue => {
      const event = events?.find(e => e.id === revenue.eventId);
      if (!event) return;
      
      const company = companies?.find(c => c.id === event.companyId);
      if (!company) return;
      
      if (!companyMap.has(company.id)) {
        companyMap.set(company.id, {
          name: company.tradeName || company.name,
          total: 0,
          cash: 0,
          debit: 0,
          credit: 0,
          pix: 0,
          count: 0
        });
      }
      
      const data = companyMap.get(company.id);
      data.total += revenue.totalAmount;
      data.cash += revenue.cashAmount;
      data.debit += revenue.debitCardAmount;
      data.credit += revenue.creditCardAmount;
      data.pix += revenue.pixAmount;
      data.count++;
    });
    
    return Array.from(companyMap.values()).sort((a, b) => b.total - a.total);
  }, [filteredRevenues, events, companies]);

  const topEvents = useMemo(() => {
    const eventMap = new Map();
    
    filteredRevenues.forEach(revenue => {
      const event = events?.find(e => e.id === revenue.eventId);
      if (!event) return;
      
      if (!eventMap.has(event.id)) {
        eventMap.set(event.id, {
          name: event.name,
          total: 0
        });
      }
      
      eventMap.get(event.id).total += revenue.totalAmount;
    });
    
    return Array.from(eventMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredRevenues, events]);

  return (
    <FinancialDashboardLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Relatório de Receitas Diárias
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Análise detalhada por empresa, evento e formas de pagamento
          </p>
        </div>

        {/* Filtros */}
        <Card className="glass-card shadow-soft-lg">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm">Empresa</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger id="company" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {companies?.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.tradeName || company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event" className="text-sm">Evento</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger id="event" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {filteredEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Button 
                onClick={() => setShouldGenerate(true)}
                className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 text-sm md:text-base"
              >
                📈 Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        {!shouldGenerate && (
          <Card className="glass-card shadow-soft-lg">
            <CardContent className="pt-6">
              <p className="text-center text-sm md:text-base text-muted-foreground">
                📋 Selecione os filtros acima e clique em "Gerar Relatório" para visualizar a análise detalhada.
              </p>
            </CardContent>
          </Card>
        )}

        {shouldGenerate && (
          <>
            {/* Resumo do Período */}
            <div className="glass-card p-4 md:p-6 shadow-soft-lg">
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-4">Resumo do Período</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Lançamentos</p>
                  <p className="text-3xl md:text-4xl font-bold text-foreground">{filteredRevenues.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Faturamento Total</p>
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Distribuição por Forma de Pagamento */}
            <div className="glass-card p-4 md:p-6 shadow-soft-lg">
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-4">Distribuição por Forma de Pagamento</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius="80%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {paymentDistribution.map((item) => (
                    <div key={item.name} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 p-3 rounded-lg bg-white/40">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                        <span className="font-medium text-sm md:text-base">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base md:text-lg">{formatCurrency(item.value)}</div>
                        <div className="text-xs text-muted-foreground">
                          {totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Faturamento por Empresa */}
            <div className="glass-card p-4 md:p-6 shadow-soft-lg">
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-4">Faturamento por Empresa</h3>
              <div className="space-y-4">
                {revenueByCompany.map((company) => (
                  <div key={company.name} className="p-4 rounded-lg bg-white/40">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                      <h4 className="font-semibold text-base md:text-lg">{company.name}</h4>
                      <div className="text-right">
                        <p className="text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                          {formatCurrency(company.total)}
                        </p>
                        <p className="text-xs text-muted-foreground">{company.count} lançamentos</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                      <div className="text-center p-2 rounded bg-green-50 dark:bg-green-900/20">
                        <p className="text-xs text-muted-foreground mb-1">Dinheiro</p>
                        <p className="text-sm md:text-base font-semibold break-words">{formatCurrency(company.cash)}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-xs text-muted-foreground mb-1">Débito</p>
                        <p className="text-sm md:text-base font-semibold break-words">{formatCurrency(company.debit)}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-orange-50 dark:bg-orange-900/20">
                        <p className="text-xs text-muted-foreground mb-1">Crédito</p>
                        <p className="text-sm md:text-base font-semibold break-words">{formatCurrency(company.credit)}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-red-50 dark:bg-red-900/20">
                        <p className="text-xs text-muted-foreground mb-1">PIX</p>
                        <p className="text-sm md:text-base font-semibold break-words">{formatCurrency(company.pix)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Previsibilidade */}
            <ForecastSection
              revenues={revenues || []}
              filteredRevenues={filteredRevenues}
              startDate={startDate}
              endDate={endDate}
              selectedCompanyId={selectedCompanyId}
              allEvents={events || []}
            />

            {/* Top 10 Eventos */}
            <div className="glass-card p-4 md:p-6 shadow-soft-lg">
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-4">Top 10 Eventos</h3>
              <div className="space-y-2">
                {topEvents.map((event, index) => (
                  <div key={event.name} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-lg bg-white/40">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-xs md:text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-sm md:text-base break-words">{event.name}</span>
                    </div>
                    <div className="text-right sm:text-left">
                      <p className="text-base md:text-lg font-bold">{formatCurrency(event.total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {totalRevenue > 0 ? ((event.total / totalRevenue) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </FinancialDashboardLayout>
  );
}
