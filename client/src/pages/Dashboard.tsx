import FinancialDashboardLayout from "../components/FinancialDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { trpc } from "../lib/trpc";
import { TrendingUp, TrendingDown, Receipt, DollarSign, Building2, Calendar } from "lucide-react";

export default function Dashboard() {
  const { data: companies } = trpc.companies.list.useQuery();
  const { data: events } = trpc.events.list.useQuery();
  const { data: accountsPayable } = trpc.accountsPayable.list.useQuery();
  const { data: accountsReceivable } = trpc.accountsReceivable.list.useQuery();
  const { data: dailyRevenues } = trpc.dailyRevenues.list.useQuery();

  // Calcular totais
  const totalPayable = accountsPayable?.reduce((sum, acc) => sum + acc.amount, 0) || 0;
  const totalReceivable = accountsReceivable?.reduce((sum, acc) => sum + acc.amount, 0) || 0;
  const totalDailyRevenue = dailyRevenues?.reduce((sum, rev) => sum + rev.totalAmount, 0) || 0;

  // Contas pendentes
  const pendingPayable = accountsPayable?.filter(acc => acc.status === "pending").length || 0;
  const pendingReceivable = accountsReceivable?.filter(acc => acc.status === "pending").length || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  return (
    <FinancialDashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Dashboard Financeiro
          </h1>
          <p className="text-muted-foreground text-lg">
            Visão geral do sistema de gestão financeira
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Contas a Pagar */}
          <Card className="glass-card hover:shadow-soft-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPayable)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingPayable} contas pendentes
              </p>
            </CardContent>
          </Card>



          {/* Receitas Diárias */}
          <Card className="glass-card hover:shadow-soft-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas Diárias</CardTitle>
              <Receipt className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalDailyRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dailyRevenues?.length || 0} lançamentos
              </p>
            </CardContent>
          </Card>


        </div>

        {/* Cards de Informações Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Empresas e Eventos */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Empresas e Eventos
              </CardTitle>
              <CardDescription>Estrutura organizacional cadastrada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Empresas</span>
                <span className="text-2xl font-bold text-blue-600">{companies?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Eventos</span>
                <span className="text-2xl font-bold text-cyan-600">{events?.length || 0}</span>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Mensagem de Boas-vindas */}
        <Card className="glass-card bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-200">
          <CardHeader>
            <CardTitle className="text-xl">Bem-vindo ao Sistema Financeiro EK</CardTitle>
            <CardDescription>
              Sistema completo de gestão financeira com controle de empresas, eventos, contas a pagar/receber e receitas diárias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Estou sendo desenvolvido, porém em breve todas as minhas funcionalidades vão estar no ar.
            </p>
          </CardContent>
        </Card>
      </div>
    </FinancialDashboardLayout>
  );
}
