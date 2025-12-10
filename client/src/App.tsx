import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Companies from "./pages/Companies";
import CostCenters from "./pages/CostCenters";
import Clients from "./pages/Clients";
import Suppliers from "./pages/Suppliers";
import AccountsPayable from "./pages/AccountsPayable";
import AccountsReceivable from "./pages/AccountsReceivable";
import DailyRevenues from "./pages/DailyRevenues";
import DailyRevenuesReport from "./pages/DailyRevenuesReport";
import ReportsHub from "./pages/ReportsHub";
import SystemUsers from "./pages/SystemUsers";
import Categories from "./pages/Categories";
import Agenda from "./pages/Agenda";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import ModuleSelector from "./pages/ModuleSelector";
import ProtectedRoute from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/modules">
        {() => <ProtectedRoute><ModuleSelector /></ProtectedRoute>}
      </Route>
      <Route path="/modules/financeiro">
        {() => <Redirect to="/dashboard" />}
      </Route>
      <Route path="/dashboard">
        {() => <ProtectedRoute><Dashboard /></ProtectedRoute>}
      </Route>
      <Route path="/empresas">
        {() => <ProtectedRoute><Companies /></ProtectedRoute>}
      </Route>
      <Route path="/centros-de-custo">
        {() => <ProtectedRoute><CostCenters /></ProtectedRoute>}
      </Route>
      <Route path="/clientes">
        {() => <ProtectedRoute><Clients /></ProtectedRoute>}
      </Route>
      <Route path="/fornecedores">
        {() => <ProtectedRoute><Suppliers /></ProtectedRoute>}
      </Route>
      <Route path="/contas-a-pagar">
        {() => <ProtectedRoute><AccountsPayable /></ProtectedRoute>}
      </Route>
      <Route path="/contas-a-receber">
        {() => <ProtectedRoute><AccountsReceivable /></ProtectedRoute>}
      </Route>
      <Route path="/receitas-diarias">
        {() => <ProtectedRoute><DailyRevenues /></ProtectedRoute>}
      </Route>
      <Route path="/relatorios/receitas-diarias">
        {() => <ProtectedRoute><DailyRevenuesReport /></ProtectedRoute>}
      </Route>
      <Route path="/relatorios/dre">
        {() => <ProtectedRoute><Reports /></ProtectedRoute>}
      </Route>
      <Route path="/relatorios">
        {() => <ProtectedRoute><ReportsHub /></ProtectedRoute>}
      </Route>
      <Route path="/usuarios">
        {() => <ProtectedRoute><SystemUsers /></ProtectedRoute>}
      </Route>
      <Route path="/categorias">
        {() => <ProtectedRoute><Categories /></ProtectedRoute>}
      </Route>
      <Route path="/modules/agenda">
        {() => <ProtectedRoute><Agenda /></ProtectedRoute>}
      </Route>
      <Route path="/relatorios">
        {() => <ProtectedRoute><Reports /></ProtectedRoute>}
      </Route>
      <Route path="/">
        {() => <Redirect to="/modules" />}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
