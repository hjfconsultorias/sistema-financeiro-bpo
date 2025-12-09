/**
 * Hook para verificar permissões do usuário em módulos
 * Usa tRPC para buscar permissões do backend
 */

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

export type ModuleId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface ModulePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
}

/**
 * Hook para verificar permissões do usuário em um módulo específico
 */
export function usePermissions(moduleId: ModuleId): ModulePermissions & { isLoading: boolean } {
  const { user } = useAuth();
  
  // Se não estiver autenticado, retornar sem permissões
  if (!user) {
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canExport: false,
      isLoading: false,
    };
  }
  
  // Administradores têm TODAS as permissões
  if (user.profile === "administrador") {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canExport: true,
      isLoading: false,
    };
  }
  
  // Buscar permissões do usuário no módulo
  const { data: permissions, isLoading } = trpc.permissions.getUserModulePermissions.useQuery({
    userId: user.id,
    moduleId,
  });
  
  if (isLoading || !permissions) {
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canExport: false,
      isLoading,
    };
  }
  
  return {
    canView: permissions.canView === 1,
    canCreate: permissions.canCreate === 1,
    canEdit: permissions.canEdit === 1,
    canDelete: permissions.canDelete === 1,
    canApprove: permissions.canApprove === 1,
    canExport: permissions.canExport === 1,
    isLoading: false,
  };
}

/**
 * IDs dos módulos do sistema
 */
export const MODULE_IDS = {
  FINANCEIRO: 1,
  AGENDA: 2,
  IA_SOPHIA: 3,
  RH: 4,
  DEPT_PESSOAL: 5,
  PROCESSOS: 6,
  OPERACOES: 7,
  COMPRAS: 8,
} as const;
