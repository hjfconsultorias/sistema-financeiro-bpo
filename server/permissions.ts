/**
 * Sistema de Verificação de Permissões
 * Verifica se um usuário tem permissão para executar ações específicas em módulos
 */

import * as db from "./db";
import { TRPCError } from "@trpc/server";

export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve" | "export";

/**
 * Mapeia nomes de módulos para IDs
 */
export const MODULE_IDS = {
  financeiro: 1,
  agenda: 2,
  ia_sophia: 3,
  rh: 4,
  dept_pessoal: 5,
  processos: 6,
  operacoes: 7,
  compras: 8,
} as const;

/**
 * Verifica se um usuário tem uma permissão específica em um módulo
 */
export async function checkPermission(
  userId: number,
  moduleId: number,
  action: PermissionAction
): Promise<boolean> {
  // Buscar dados do usuário
  const user = await db.getSystemUserById(userId);
  
  if (!user) {
    return false;
  }
  
  // Administradores têm TODAS as permissões
  if (user.profile === "administrador") {
    return true;
  }
  
  // Buscar permissões do usuário no módulo
  const permissions = await db.getUserPermissionsForModule(userId, moduleId);
  
  if (!permissions) {
    return false;
  }
  
  // Mapear ação para campo de permissão
  switch (action) {
    case "view":
      return permissions.canView === 1;
    case "create":
      return permissions.canCreate === 1;
    case "edit":
      return permissions.canEdit === 1;
    case "delete":
      return permissions.canDelete === 1;
    case "approve":
      return permissions.canApprove === 1;
    case "export":
      return permissions.canExport === 1;
    default:
      return false;
  }
}

/**
 * Middleware para verificar permissão antes de executar ação
 * Lança erro FORBIDDEN se usuário não tiver permissão
 */
export async function requirePermission(
  userId: number,
  moduleId: number,
  action: PermissionAction
): Promise<void> {
  const hasPermission = await checkPermission(userId, moduleId, action);
  
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Você não tem permissão para ${getActionLabel(action)} neste módulo.`,
    });
  }
}

/**
 * Retorna todas as permissões de um usuário em um módulo
 */
export async function getUserModulePermissions(
  userId: number,
  moduleId: number
): Promise<{
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
}> {
  // Buscar dados do usuário
  const user = await db.getSystemUserById(userId);
  
  // Administradores têm TODAS as permissões
  if (user && user.profile === "administrador") {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canExport: true,
    };
  }
  
  // Buscar permissões do usuário no módulo
  const permissions = await db.getUserPermissionsForModule(userId, moduleId);
  
  if (!permissions) {
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canExport: false,
    };
  }
  
  return {
    canView: permissions.canView === 1,
    canCreate: permissions.canCreate === 1,
    canEdit: permissions.canEdit === 1,
    canDelete: permissions.canDelete === 1,
    canApprove: permissions.canApprove === 1,
    canExport: permissions.canExport === 1,
  };
}

/**
 * Retorna label amigável para cada ação
 */
function getActionLabel(action: PermissionAction): string {
  const labels: Record<PermissionAction, string> = {
    view: "visualizar",
    create: "criar",
    edit: "editar",
    delete: "excluir",
    approve: "aprovar",
    export: "exportar",
  };
  
  return labels[action];
}
