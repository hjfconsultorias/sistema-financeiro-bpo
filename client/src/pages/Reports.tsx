import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, FileText } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Reports() {
  const [companyId, setCompanyId] = useState("");
  const [eventId, setEventId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [reportType, setReportType] = useState<"dre">("dre");

  const { data: companies } = trpc.companies.list.useQuery();
  const { data: allEvents } = trpc.events.list.useQuery();
  const events = companyId ? allEvents?.filter(e => e.companyId === parseInt(companyId)) : [];
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: subcategories } = trpc.subcategories.listByCategory.useQuery(
    { categoryId: parseInt(categoryId) },
    { enabled: !!categoryId }
  );

  const { data: dreData, isLoading } = trpc.reports.getDREData.useQuery(
    {
      companyId: companyId ? parseInt(companyId) : undefined,
      eventId: eventId ? parseInt(eventId) : undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      subcategoryId: subcategoryId ? parseInt(subcategoryId) : undefined,
    },
    { enabled: !!companyId || !!eventId }
  );

  const handleCompanyChange = (value: string) => {
    setCompanyId(value);
    setEventId("");
  };

  const handleClearFilters = () => {
    setCompanyId("");
    setEventId("");
    setCategoryId("");
    setSubcategoryId("");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

  // Preparar dados para gráficos
  const expensesByCategory = dreData?.expensesByCategory.map((item, index) => ({
    name: item.categoryName,
    value: item.total / 100,
    color: COLORS[index % COLORS.length],
  })) || [];
  const expensesByEvent = dreData?.expensesByEvent.map((event: any) => ({
    name: event.eventName,
    receitas: event.revenues / 100,
    despesas: event.expenses / 100,
    resultado: (event.revenues - event.expenses) / 100,
  })) || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Relatórios Financeiros
            </h1>
          </div>
          <p className="text-gray-600">Análise detalhada de resultados e performance financeira</p>
        </div>

        {/* Seletor de Tipo de Relatório */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-100">
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">Tipo de Relatório</label>
            <div className="flex gap-3">
              <Button
                variant={reportType === "dre" ? "default" : "outline"}
                onClick={() => setReportType("dre")}
                className="flex-1"
              >
                DRE - Demonstração do Resultado
              </Button>
              <Button variant="outline" disabled className="flex-1 opacity-50">
                Fluxo de Caixa (Em breve)
              </Button>
              <Button variant="outline" disabled className="flex-1 opacity-50">
                Balanço Patrimonial (Em breve)
              </Button>
            </div>
          </div>
        </Card>

        {/* Filtros */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Empresa</label>
              <Select value={companyId} onValueChange={handleCompanyChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      <span className="truncate block max-w-[250px]" title={company.tradeName || ""}>
                        {company.tradeName}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Evento</label>
              <Select value={eventId} onValueChange={setEventId} disabled={!companyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os eventos" />
                </SelectTrigger>
                <SelectContent>
                  {events?.map((event: any) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Categoria</label>
              <Select value={categoryId} onValueChange={(val) => { setCategoryId(val); setSubcategoryId(""); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Subcategoria</label>
              <Select value={subcategoryId} onValueChange={setSubcategoryId} disabled={!categoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as subcategorias" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories?.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="outline" onClick={handleClearFilters} className="w-full md:w-auto">
              Limpar Filtros
            </Button>
          </div>
        </Card>

        {/* Conteúdo do Relatório DRE */}
        {dreData && (companyId || eventId) ? (
          <div className="space-y-6">
            {/* Cards de Resumo Executivo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Receitas */}
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Receitas</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(dreData.totalRevenue)}</p>
                    <p className="text-xs text-green-600 mt-2">{dreData.revenues.length} lançamento(s)</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>

              {/* Despesas */}
              <Card className="p-6 bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-1">Despesas</p>
                    <p className="text-3xl font-bold text-red-600">{formatCurrency(dreData.totalExpense)}</p>
                    <p className="text-xs text-red-600 mt-2">{dreData.expenses.length} lançamento(s)</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </Card>

              {/* Resultado */}
              <Card className={`p-6 bg-gradient-to-br ${dreData.result >= 0 ? 'from-blue-50 to-cyan-50 border-blue-200' : 'from-orange-50 to-red-50 border-orange-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Resultado</p>
                    <p className={`text-3xl font-bold ${dreData.result >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {formatCurrency(dreData.result)}
                    </p>
                    <p className={`text-xs mt-2 ${dreData.result >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {dreData.result >= 0 ? 'Lucro' : 'Prejuízo'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${dreData.result >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                    <DollarSign className={`w-6 h-6 ${dreData.result >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabela DRE Estruturada */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-100">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Demonstração do Resultado do Exercício</h3>
              <div className="space-y-3">
                {/* Receitas */}
                <div className="border-b border-gray-200 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">RECEITAS OPERACIONAIS</span>
                    <span className="font-semibold text-green-600">{formatCurrency(dreData.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 mt-1 ml-4">
                    <span>Receitas Diárias</span>
                    <span>{formatCurrency(dreData.totalRevenue)}</span>
                  </div>
                </div>

                {/* Despesas por Categoria */}
                <div className="border-b border-gray-200 pb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800">(-) CUSTOS E DESPESAS</span>
                    <span className="font-semibold text-red-600">{formatCurrency(dreData.totalExpense)}</span>
                  </div>
                  {dreData.expensesByCategory.map((category) => (
                    <div key={category.categoryName} className="flex justify-between items-center text-sm text-gray-600 ml-4 mt-1">
                      <span>{category.categoryName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">
                          {((category.total / dreData.totalExpense) * 100).toFixed(1)}%
                        </span>
                        <span className="w-32 text-right">{formatCurrency(category.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resultado */}
                <div className="pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-800">(=) RESULTADO OPERACIONAL</span>
                    <span className={`font-bold text-lg ${dreData.result >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {formatCurrency(dreData.result)}
                    </span>
                  </div>
                </div>

                {/* Indicadores */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Indicadores de Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Margem Bruta</p>
                      <p className={`text-xl font-bold ${dreData.result >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {dreData.totalRevenue > 0 ? ((dreData.result / dreData.totalRevenue) * 100).toFixed(2) : '0.00'}%
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Margem Operacional</p>
                      <p className={`text-xl font-bold ${dreData.result >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {dreData.totalRevenue > 0 ? ((dreData.result / dreData.totalRevenue) * 100).toFixed(2) : '0.00'}%
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Margem Líquida</p>
                      <p className={`text-xl font-bold ${dreData.result >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {dreData.totalRevenue > 0 ? ((dreData.result / dreData.totalRevenue) * 100).toFixed(2) : '0.00'}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Pizza - Despesas por Categoria */}
              {expensesByCategory.length > 0 && (
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-100">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Composição de Despesas</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expensesByCategory.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value, entry: any) => {
                          const percent = ((entry.payload.value / expensesByCategory.reduce((sum: number, item: any) => sum + item.value, 0)) * 100).toFixed(1);
                          return `${value}: ${percent}%`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Gráfico de Barras - Comparação entre Eventos */}
              {expensesByEvent.length > 0 && !eventId && (
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-100">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Comparação entre Eventos</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={expensesByEvent} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={120}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        wrapperStyle={{ paddingBottom: '10px' }}
                      />
                      <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                      <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                      <Bar dataKey="resultado" fill="#3b82f6" name="Resultado" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center bg-white/80 backdrop-blur-sm border-blue-100">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              Selecione uma empresa ou evento para visualizar o relatório DRE
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
