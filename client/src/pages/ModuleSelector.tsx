import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Building2, Calendar, Bot, Users, UserCheck, GitBranch, Settings, ShoppingCart, Lock } from "lucide-react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

// Mapa de ícones
const iconMap: Record<string, any> = {
  Building2,
  Calendar,
  Bot,
  Users,
  UserCheck,
  GitBranch,
  Settings,
  ShoppingCart,
};

export default function ModuleSelector() {
  const [, setLocation] = useLocation();
  // Buscar apenas módulos que o usuário tem permissão
  const { data: modules, isLoading } = trpc.modules.getMyModules.useQuery();

  const handleModuleClick = (module: any) => {
    if (!module.available) {
      toast.info(`${module.displayName} estará disponível em breve!`);
      return;
    }

    // Redireciona para o módulo
    setLocation(module.route);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-950 dark:via-cyan-950 dark:to-blue-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-slate-600 dark:text-slate-400">Carregando módulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-950 dark:via-cyan-950 dark:to-blue-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-5xl font-bold text-white">EK</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            BPO EK
          </h1>
          <p className="text-2xl font-semibold bg-gradient-to-r from-slate-700 via-blue-600 to-cyan-600 bg-clip-text text-transparent animate-fade-in">
            Selecione um módulo para começar
          </p>
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules?.map((module) => {
            const Icon = iconMap[module.icon || 'Building2'] || Building2;
            const isAvailable = module.available === 1;

            return (
              <button
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className={`
                  group relative overflow-hidden
                  rounded-2xl p-3.5
                  transition-all duration-300
                  ${
                    isAvailable
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 hover:scale-105 hover:shadow-2xl cursor-pointer"
                      : "bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 cursor-not-allowed opacity-60"
                  }
                `}
              >
                {/* Efeito de brilho no hover */}
                {isAvailable && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                )}

                {/* Conteúdo */}
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  {/* Ícone */}
                  <div className="relative">
                    <Icon className="w-7 h-7 text-white" />
                    {!isAvailable && (
                      <div className="absolute -top-1 -right-1 bg-slate-600 rounded-full p-1">
                        <Lock className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Título */}
                  <h3 className="text-white font-bold text-xs leading-tight">
                    {module.displayName}
                  </h3>

                  {/* Badge "Em breve" */}
                  {!isAvailable && (
                    <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">
                      Em breve
                    </span>
                  )}
                </div>

                {/* Efeito de partículas no hover (apenas para disponíveis) */}
                {isAvailable && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full animate-ping"></div>
                    <div className="absolute bottom-4 right-4 w-2 h-2 bg-white rounded-full animate-ping animation-delay-150"></div>
                    <div className="absolute top-1/2 right-8 w-1 h-1 bg-white rounded-full animate-ping animation-delay-300"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>


      </div>
    </div>
  );
}
