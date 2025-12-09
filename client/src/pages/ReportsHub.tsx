import { Link } from "wouter";
import FinancialDashboardLayout from "@/components/FinancialDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, FileText } from "lucide-react";

export default function ReportsHub() {
  const reports = [
    {
      title: "DRE - Demonstração do Resultado",
      description: "Análise completa de receitas, despesas e resultado operacional por empresa",
      icon: BarChart3,
      path: "/relatorios/dre",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Relatório de Receitas Diárias",
      description: "Análise detalhada por empresa, evento e formas de pagamento com previsibilidade",
      icon: DollarSign,
      path: "/relatorios/receitas-diarias",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Tendências e Projeções",
      description: "Análise de tendências históricas e projeções futuras (em desenvolvimento)",
      icon: TrendingUp,
      path: "#",
      color: "from-purple-500 to-purple-600",
      disabled: true
    },
    {
      title: "Relatórios Personalizados",
      description: "Crie relatórios customizados com filtros avançados (em desenvolvimento)",
      icon: FileText,
      path: "#",
      color: "from-orange-500 to-orange-600",
      disabled: true
    }
  ];

  return (
    <FinancialDashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-2">
            Acesse análises detalhadas e relatórios gerenciais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => {
            const Icon = report.icon;
            const content = (
              <Card className={`glass-card shadow-soft-lg hover:shadow-soft-xl transition-all ${report.disabled ? 'opacity-60' : 'hover:scale-105 cursor-pointer'}`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${report.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{report.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {report.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {report.disabled && (
                  <CardContent>
                    <span className="text-xs text-muted-foreground italic">
                      Em breve
                    </span>
                  </CardContent>
                )}
              </Card>
            );

            if (report.disabled) {
              return <div key={report.title}>{content}</div>;
            }

            return (
              <Link key={report.title} href={report.path}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </FinancialDashboardLayout>
  );
}
