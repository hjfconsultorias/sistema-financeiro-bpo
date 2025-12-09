// import { useAuth } from "@/_core/hooks/useAuth"; // Substituído por AuthContext
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Building2,
  Users,
  Truck,
  TrendingDown,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Sparkles,
  Receipt,
  Shield,
  FolderTree,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Empresas", path: "/empresas", icon: <Sparkles className="w-5 h-5" />, adminOnly: true },
  { label: "Eventos", path: "/centros-de-custo", icon: <Building2 className="w-5 h-5" />, adminOnly: true },
  { label: "Receitas Diárias", path: "/receitas-diarias", icon: <Receipt className="w-5 h-5" /> },
  { label: "Clientes", path: "/clientes", icon: <Users className="w-5 h-5" /> },
  { label: "Fornecedores", path: "/fornecedores", icon: <Truck className="w-5 h-5" /> },
  { label: "Categorias", path: "/categorias", icon: <FolderTree className="w-5 h-5" />, adminOnly: true },
  { label: "Contas a Pagar", path: "/contas-a-pagar", icon: <TrendingDown className="w-5 h-5" /> },
  { label: "Contas a Receber", path: "/contas-a-receber", icon: <TrendingUp className="w-5 h-5" /> },
  { label: "Relatórios", path: "/relatorios", icon: <BarChart3 className="w-5 h-5" /> },
  { label: "Usuários", path: "/usuarios", icon: <Shield className="w-5 h-5" />, adminOnly: true },
];

export default function FinancialDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    logout();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-ethereal">
        <div className="text-center glass-card p-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto"></div>
            <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-6 text-foreground/70 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-ethereal px-4">
        <div className="text-center max-w-md w-full">
          <div className="glass-card p-12 shadow-soft-xl">
            <div className="mb-8 flex justify-center">
              <img src="/ek-logo-premium.png" alt="EK Logo" className="h-24 w-auto" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Sistema Financeiro
            </h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Faça login para acessar o sistema de gestão financeira.
            </p>
            <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft-lg glow-primary w-full text-lg py-6">
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const filteredNavItems = navItems.filter(item => !item.adminOnly || user?.profile === "administrador");

  return (
    <div className="min-h-screen bg-gradient-ethereal">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow pt-8 pb-4 overflow-y-auto glass-nav">
          <div className="flex items-center flex-shrink-0 px-8 mb-12">
            <img src="/ek-logo-premium.png" alt="EK Logo" className="h-12 w-auto mr-3" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Sistema Financeiro
              </h1>
              <p className="text-xs text-muted-foreground">Ek-Empreendimento</p>
            </div>
          </div>
          <nav className="mt-2 flex-1 px-4 space-y-2">
            {filteredNavItems.map(item => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`group flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-gradient-primary text-white shadow-soft-lg glow-primary"
                        : "text-foreground/70 hover:bg-white/50 hover:text-foreground hover:shadow-soft"
                    }`}
                  >
                    <div className={isActive ? "" : "group-hover:scale-110 transition-transform"}>
                      {item.icon}
                    </div>
                    <span className="ml-3">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="flex-shrink-0 flex border-t border-border/50 p-4 mx-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="glass-card p-4 hover:shadow-soft transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shadow-soft">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{user?.name || "Usuário"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.profile === "administrador" ? "Administrador" : "Usuário"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout} 
                    className="ml-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden glass-nav">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <img src="/ek-logo-premium.png" alt="EK Logo" className="h-8 w-auto mr-2" />
            <div>
              <h1 className="text-base font-bold bg-gradient-primary bg-clip-text text-transparent">
                Sistema Financeiro
              </h1>
              <p className="text-xs text-muted-foreground">Ek-Empreendimento</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="hover:bg-white/50"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-card mx-4 mt-2 mb-4 shadow-soft-lg">
          <nav className="px-2 pt-2 pb-3 space-y-2">
            {filteredNavItems.map(item => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center px-4 py-3 text-base font-medium rounded-xl cursor-pointer transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-primary text-white shadow-soft glow-primary"
                        : "text-foreground/70 hover:bg-white/50 hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border/50 pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shadow-soft">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-base font-semibold text-foreground truncate">{user?.name || "Usuário"}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user?.profile === "administrador" ? "Administrador" : "Usuário"}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-72 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
