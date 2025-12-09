import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Building2, Eye, Plus, Pencil, Trash2, CheckCircle, FileDown } from "lucide-react";

interface ModulePermission {
  moduleId: number;
  canView: number;
  canCreate: number;
  canEdit: number;
  canDelete: number;
  canApprove: number;
  canExport: number;
}

interface ModulePermissionsManagerProps {
  userId?: number;
  onChange: (permissions: ModulePermission[]) => void;
  initialPermissions?: ModulePermission[];
}

export default function ModulePermissionsManager({ 
  userId, 
  onChange, 
  initialPermissions = [] 
}: ModulePermissionsManagerProps) {
  const { data: modules = [] } = trpc.modules.list.useQuery();
  const [permissions, setPermissions] = useState<ModulePermission[]>(initialPermissions);

  useEffect(() => {
    setPermissions(initialPermissions);
  }, [initialPermissions]);

  const handleModuleToggle = (moduleId: number, checked: boolean) => {
    let newPermissions = [...permissions];
    
    if (checked) {
      // Adicionar módulo com permissão de visualização
      newPermissions.push({
        moduleId,
        canView: 1,
        canCreate: 0,
        canEdit: 0,
        canDelete: 0,
        canApprove: 0,
        canExport: 0,
      });
    } else {
      // Remover módulo
      newPermissions = newPermissions.filter(p => p.moduleId !== moduleId);
    }
    
    setPermissions(newPermissions);
    onChange(newPermissions);
  };

  const handlePermissionToggle = (
    moduleId: number, 
    permission: keyof Omit<ModulePermission, 'moduleId'>,
    checked: boolean
  ) => {
    const newPermissions = permissions.map(p => {
      if (p.moduleId === moduleId) {
        return { ...p, [permission]: checked ? 1 : 0 };
      }
      return p;
    });
    
    setPermissions(newPermissions);
    onChange(newPermissions);
  };

  const isModuleSelected = (moduleId: number) => {
    return permissions.some(p => p.moduleId === moduleId);
  };

  const getModulePermission = (moduleId: number) => {
    return permissions.find(p => p.moduleId === moduleId);
  };

  const PERMISSION_CONFIG = [
    { key: 'canView' as const, label: 'Visualizar', icon: Eye, description: 'Pode ver dados do módulo' },
    { key: 'canCreate' as const, label: 'Criar', icon: Plus, description: 'Pode criar novos registros' },
    { key: 'canEdit' as const, label: 'Editar', icon: Pencil, description: 'Pode editar registros existentes' },
    { key: 'canDelete' as const, label: 'Excluir', icon: Trash2, description: 'Pode excluir registros' },
    { key: 'canApprove' as const, label: 'Aprovar', icon: CheckCircle, description: 'Pode aprovar lançamentos' },
    { key: 'canExport' as const, label: 'Exportar', icon: FileDown, description: 'Pode exportar relatórios' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-500" />
          <CardTitle>Módulos e Permissões</CardTitle>
        </div>
        <CardDescription>
          Selecione os módulos que este usuário pode acessar e defina as permissões específicas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {modules.map((module) => {
          const isSelected = isModuleSelected(module.id);
          const modulePermission = getModulePermission(module.id);

          return (
            <div key={module.id} className="border rounded-lg p-4 space-y-4">
              {/* Cabeçalho do Módulo */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`module-${module.id}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleModuleToggle(module.id, checked as boolean)}
                />
                <Label 
                  htmlFor={`module-${module.id}`}
                  className="text-base font-semibold cursor-pointer flex-1"
                >
                  {module.displayName}
                </Label>
                {!module.available && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    Em breve
                  </span>
                )}
              </div>

              {/* Permissões Detalhadas */}
              {isSelected && (
                <div className="ml-7 pl-4 border-l-2 border-blue-200 space-y-3">
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecione as ações permitidas:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {PERMISSION_CONFIG.map(({ key, label, icon: Icon, description }) => (
                      <div key={key} className="flex items-start gap-2">
                        <Checkbox
                          id={`${module.id}-${key}`}
                          checked={modulePermission?.[key] === 1}
                          onCheckedChange={(checked) => 
                            handlePermissionToggle(module.id, key, checked as boolean)
                          }
                          disabled={key === 'canView'} // Visualizar é obrigatório
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={`${module.id}-${key}`}
                            className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {modules.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum módulo disponível
          </p>
        )}
      </CardContent>
    </Card>
  );
}
