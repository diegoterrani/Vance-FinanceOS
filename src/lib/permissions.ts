import { UserRole } from '../types';

export interface RolePermissions {
  canCreateRegistry: boolean;
  canDeleteRegistry: boolean;
  canImportDocument: boolean;
  canReconcile: boolean;
  canUploadCnab: boolean;
  canForceBankSync: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canDeleteTransactions: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canCreateRegistry: true,
    canDeleteRegistry: true,
    canImportDocument: true,
    canReconcile: true,
    canUploadCnab: true,
    canForceBankSync: true,
    canManageUsers: true,
    canManageSettings: true,
    canDeleteTransactions: true,
  },
  diretor: {
    canCreateRegistry: true,
    canDeleteRegistry: true,
    canImportDocument: true,
    canReconcile: true,
    canUploadCnab: true,
    canForceBankSync: true,
    canManageUsers: false,
    canManageSettings: true,
    canDeleteTransactions: true,
  },
  gerencia: {
    canCreateRegistry: true,
    canDeleteRegistry: false,
    canImportDocument: true,
    canReconcile: true,
    canUploadCnab: true,
    canForceBankSync: true,
    canManageUsers: false,
    canManageSettings: false,
    canDeleteTransactions: false,
  },
  tesouraria: {
    canCreateRegistry: true,
    canDeleteRegistry: false,
    canImportDocument: true,
    canReconcile: true,
    canUploadCnab: true,
    canForceBankSync: true,
    canManageUsers: false,
    canManageSettings: false,
    canDeleteTransactions: false,
  },
  analista: {
    canCreateRegistry: true,
    canDeleteRegistry: false,
    canImportDocument: true,
    canReconcile: false,
    canUploadCnab: true,
    canForceBankSync: false,
    canManageUsers: false,
    canManageSettings: false,
    canDeleteTransactions: false,
  },
  viewer: {
    canCreateRegistry: false,
    canDeleteRegistry: false,
    canImportDocument: false,
    canReconcile: false,
    canUploadCnab: false,
    canForceBankSync: false,
    canManageUsers: false,
    canManageSettings: false,
    canDeleteTransactions: false,
  },
};

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrador Geral';
    case 'diretor':
      return 'Diretor';
    case 'gerencia':
      return 'Gerente Financeiro';
    case 'tesouraria':
      return 'Tesoureiro Líder';
    case 'analista':
      return 'Analista Técnico';
    case 'viewer':
      return 'Observador (Leitura)';
    default:
      return role;
  }
}
