import FinancialDashboardLayout from "@/components/FinancialDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingDown, TrendingUp, Building2, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default function Home() {
  const { data: accountsPayable = [], isLoading: loadingPayable } = trpc.accountsPayable.list.useQuery();
  const { data: accountsReceivable = [], isLoading: loadingReceivable } = trpc.accountsReceivable.list.useQuery();
  const { data: events = [] } = trpc.events.list.useQuery();

  const totalPayable = accountsPayable
    .filter(a => a.status === "pending")
    .reduce((sum, account) => sum + account.amount, 0);

  const totalReceivable = accountsReceivable
    .filter(a => a.status === "pending")
    .reduce((sum, account) => sum + account.amount, 0);

  const overduePayable = accountsPayable.filter(
    a => a.status === "pending" && new Date(a.dueDate) < new Date()
  ).length;

  const overdueReceivable = accountsReceivable.filter(
    a => a.status === "pending" && new Date(a.dueDate) < new Date()
  ).length;

  const activeCostCenters = events.filter(c => c.active === 1).length;

  return (
    <FinancialDashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">Dashboard Financeiro</h1>
          <p className="text-muted-foreground mt-2 text-lg">Visão geral das suas finanças</p>
        </div>

        {/* Cards de Resumo com Glassmorphism */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card p-6 hover:shadow-soft-lg transition-all duration-300 group">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Contas a Pagar</h3>
              <div className="p-2 rounded-xl bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-destructive">{formatCurrency(totalPayable)}</div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" />
                {accountsPayable.filter(a => a.status === "pending").length} contas pendentes
              </p>
            </div>
          </div>

          <div className="glass-card p-6 hover:shadow-soft-lg transition-all duration-300 group">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Contas a Receber</h3>
              <div className="p-2 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-emerald-600">{formatCurrency(totalReceivable)}</div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                {accountsReceivable.filter(a => a.status === "pending").length} contas pendentes
              </p>
            </div>
          </div>

          <div className="glass-card p-6 hover:shadow-soft-lg transition-all duration-300 group bg-gradient-primary/5">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Saldo Previsto</h3>
              <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <div className={`text-3xl font-bold ${totalReceivable - totalPayable >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {formatCurrency(totalReceivable - totalPayable)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Receitas - Despesas pendentes</p>
            </div>
          </div>

          <div className="glass-card p-6 hover:shadow-soft-lg transition-all duration-300 group">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Eventos</h3>
              <div className="p-2 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold bg-gradient-secondary bg-clip-text text-transparent">{activeCostCenters}</div>
              <p className="text-xs text-muted-foreground mt-2">Operações ativas</p>
            </div>
          </div>
        </div>

        {/* Alertas com Glassmorphism */}
        {(overduePayable > 0 || overdueReceivable > 0) && (
          <div className="glass-card p-6 border-orange-300/50 bg-orange-50/30 shadow-soft-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-orange-500/20">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-orange-900">Atenção: Contas Vencidas</h3>
            </div>
            <div className="space-y-2 ml-11">
              {overduePayable > 0 && (
                <p className="text-sm text-orange-800 font-medium">
                  • {overduePayable} conta(s) a pagar vencida(s)
                </p>
              )}
              {overdueReceivable > 0 && (
                <p className="text-sm text-orange-800 font-medium">
                  • {overdueReceivable} conta(s) a receber vencida(s)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contas Recentes com Glassmorphism */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card p-6 shadow-soft-lg">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground">Contas a Pagar Recentes</h3>
              <p className="text-sm text-muted-foreground mt-1">Últimos lançamentos de despesas</p>
            </div>
            <div>
              {loadingPayable ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary"></div>
                </div>
              ) : accountsPayable.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhuma conta a pagar cadastrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accountsPayable.slice(0, 5).map(account => (
                    <div key={account.id} className="flex items-center justify-between p-4 rounded-xl bg-white/40 hover:bg-white/60 transition-all duration-200 border border-border/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{account.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vencimento: {new Date(account.dueDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-bold text-destructive">{formatCurrency(account.amount)}</p>
                        <p className={`text-xs font-medium mt-1 ${account.status === "paid" ? "text-emerald-600" : "text-orange-600"}`}>
                          {account.status === "paid" ? "Pago" : "Pendente"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6 shadow-soft-lg">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground">Contas a Receber Recentes</h3>
              <p className="text-sm text-muted-foreground mt-1">Últimos lançamentos de receitas</p>
            </div>
            <div>
              {loadingReceivable ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary"></div>
                </div>
              ) : accountsReceivable.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhuma conta a receber cadastrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accountsReceivable.slice(0, 5).map(account => (
                    <div key={account.id} className="flex items-center justify-between p-4 rounded-xl bg-white/40 hover:bg-white/60 transition-all duration-200 border border-border/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{account.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vencimento: {new Date(account.dueDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(account.amount)}</p>
                        <p className={`text-xs font-medium mt-1 ${account.status === "received" ? "text-emerald-600" : "text-orange-600"}`}>
                          {account.status === "received" ? "Recebido" : "Pendente"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FinancialDashboardLayout>
  );
}
