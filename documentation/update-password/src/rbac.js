/**
 * functions/_shared/rbac.js
 *
 * Sistema RBAC para Appwrite Functions
 *
 * IMPORTANTE: Mantener sincronizado con src/lib/rbac.ts
 *
 * Uso:
 * import { Permission, requirePermission, getUserProfile } from '../_shared/rbac.js';
 */

/**
 * Permisos del sistema (sincronizado con frontend)
 */
export const Permission = {
  // Help/Documentación
  HELP_VIEW: "HELP_VIEW",

  // Dashboard
  DASHBOARD_VIEW_GLOBAL: "DASHBOARD_VIEW_GLOBAL",
  DASHBOARD_VIEW_OWN: "DASHBOARD_VIEW_OWN",

  // Reportes
  REPORTS_VIEW: "REPORTS_VIEW",
  REPORTS_EXPORT: "REPORTS_EXPORT",

  // Usuarios
  USERS_VIEW: "USERS_VIEW",
  USERS_MANAGE: "USERS_MANAGE",

  // Vales (Vouchers)
  VOUCHER_VIEW: "VOUCHER_VIEW",
  VOUCHER_CREATE: "VOUCHER_CREATE",
  VOUCHER_UPDATE: "VOUCHER_UPDATE",
  VOUCHER_DELETE: "VOUCHER_DELETE",
  VOUCHER_CANCEL: "VOUCHER_CANCEL",

  // Flujo de Salida
  QR_SCAN: "QR_SCAN",
  EXIT_REQUEST_APPROVAL: "EXIT_REQUEST_APPROVAL",
  EXIT_APPROVE: "EXIT_APPROVE",
  EXIT_REJECT: "EXIT_REJECT",
  EXIT_CLOSE_USED: "EXIT_CLOSE_USED",

  // Catálogos: Clientes
  CLIENTS_VIEW: "CLIENTS_VIEW",
  CLIENTS_CREATE: "CLIENTS_CREATE",
  CLIENTS_UPDATE: "CLIENTS_UPDATE",
  CLIENTS_DELETE: "CLIENTS_DELETE",

  // Catálogos: Materiales
  MATERIALS_VIEW: "MATERIALS_VIEW",
  MATERIALS_CREATE: "MATERIALS_CREATE",
  MATERIALS_UPDATE: "MATERIALS_UPDATE",
  MATERIALS_DELETE: "MATERIALS_DELETE",

  // Catálogos: Vehículos
  VEHICLES_VIEW: "VEHICLES_VIEW",
  VEHICLES_CREATE: "VEHICLES_CREATE",
  VEHICLES_UPDATE: "VEHICLES_UPDATE",
  VEHICLES_DELETE: "VEHICLES_DELETE",

  // Catálogos: Transportistas
  CARRIERS_VIEW: "CARRIERS_VIEW",
  CARRIERS_CREATE: "CARRIERS_CREATE",
  CARRIERS_UPDATE: "CARRIERS_UPDATE",
  CARRIERS_DELETE: "CARRIERS_DELETE",

  // Auditoría
  AUDIT_VIEW_MODULE: "AUDIT_VIEW_MODULE",
};

/**
 * Mapeo de permisos por rol
 */
export const RolePermissions = {
  ADMIN: [
    Permission.HELP_VIEW,
    Permission.DASHBOARD_VIEW_GLOBAL,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.USERS_VIEW,
    Permission.USERS_MANAGE,
    Permission.VOUCHER_VIEW,
    Permission.VOUCHER_CREATE,
    Permission.VOUCHER_UPDATE,
    Permission.VOUCHER_CANCEL,
    Permission.VOUCHER_DELETE,
    Permission.QR_SCAN,
    Permission.EXIT_REQUEST_APPROVAL,
    Permission.EXIT_APPROVE,
    Permission.EXIT_REJECT,
    Permission.EXIT_CLOSE_USED,
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_CREATE,
    Permission.CLIENTS_UPDATE,
    Permission.CLIENTS_DELETE,
    Permission.MATERIALS_VIEW,
    Permission.MATERIALS_CREATE,
    Permission.MATERIALS_UPDATE,
    Permission.MATERIALS_DELETE,
    Permission.VEHICLES_VIEW,
    Permission.VEHICLES_CREATE,
    Permission.VEHICLES_UPDATE,
    Permission.VEHICLES_DELETE,
    Permission.CARRIERS_VIEW,
    Permission.CARRIERS_CREATE,
    Permission.CARRIERS_UPDATE,
    Permission.CARRIERS_DELETE,
  ],

  CATALOG_MANAGER: [
    Permission.HELP_VIEW,
    Permission.DASHBOARD_VIEW_OWN,
    Permission.VOUCHER_VIEW,
    Permission.VOUCHER_CREATE,
    Permission.VOUCHER_UPDATE,
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_CREATE,
    Permission.CLIENTS_UPDATE,
    Permission.MATERIALS_VIEW,
    Permission.MATERIALS_CREATE,
    Permission.MATERIALS_UPDATE,
    Permission.VEHICLES_VIEW,
    Permission.VEHICLES_CREATE,
    Permission.VEHICLES_UPDATE,
    Permission.CARRIERS_VIEW,
    Permission.CARRIERS_CREATE,
    Permission.CARRIERS_UPDATE,
  ],

  SCALE_OPERATOR: [
    Permission.HELP_VIEW,
    Permission.DASHBOARD_VIEW_OWN,
    Permission.VOUCHER_VIEW,
    Permission.VOUCHER_CREATE,
    Permission.VOUCHER_UPDATE,
    Permission.VOUCHER_CANCEL,
    Permission.QR_SCAN,
    Permission.EXIT_REQUEST_APPROVAL,
    Permission.EXIT_APPROVE,
    Permission.EXIT_REJECT,
    Permission.EXIT_CLOSE_USED,
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_CREATE,
    Permission.CLIENTS_UPDATE,
    Permission.CLIENTS_DELETE,
    Permission.MATERIALS_VIEW,
    Permission.MATERIALS_CREATE,
    Permission.MATERIALS_UPDATE,
    Permission.MATERIALS_DELETE,
    Permission.VEHICLES_VIEW,
    Permission.VEHICLES_CREATE,
    Permission.VEHICLES_UPDATE,
    Permission.VEHICLES_DELETE,
    Permission.CARRIERS_VIEW,
    Permission.CARRIERS_CREATE,
    Permission.CARRIERS_UPDATE,
    Permission.CARRIERS_DELETE,
  ],

  OPERATOR: [
    Permission.HELP_VIEW,
    Permission.DASHBOARD_VIEW_OWN,
    Permission.VOUCHER_VIEW,
    Permission.VOUCHER_CREATE,
    Permission.QR_SCAN,
    Permission.EXIT_REQUEST_APPROVAL,
  ],

  EXIT_GUARD: [
    Permission.HELP_VIEW,
    Permission.QR_SCAN,
    Permission.EXIT_REQUEST_APPROVAL,
  ],
};

/**
 * Verifica si un rol tiene un permiso específico
 *
 * @param {string} role - Rol del usuario (ADMIN, CATALOG_MANAGER, etc.)
 * @param {string} permission - Permiso a verificar
 * @param {boolean} isPlatformAdmin - Flag is_platform_admin (ROOT)
 * @returns {boolean} true si tiene el permiso
 */
export function hasPermission(role, permission, isPlatformAdmin = false) {
  // ROOT tiene todos los permisos
  if (isPlatformAdmin) return true;

  const rolePerms = RolePermissions[role] || [];
  return rolePerms.includes(permission);
}

/**
 * Valida que el usuario tenga un permiso requerido
 *
 * Si NO tiene el permiso, retorna una respuesta HTTP 403.
 * Si SÍ tiene el permiso, retorna null (continuar ejecución).
 *
 * @param {string} role - Rol del usuario
 * @param {string} permission - Permiso requerido
 * @param {boolean} isPlatformAdmin - Flag is_platform_admin (ROOT)
 * @param {object} res - Response object de Appwrite Function
 * @returns {object|null} Response con error 403 o null si tiene permisos
 *
 * @example
 * const permissionError = requirePermission(
 *   profile.role,
 *   Permission.VOUCHER_CANCEL,
 *   profile.is_platform_admin,
 *   res
 * );
 * if (permissionError) return permissionError;
 */
export function requirePermission(role, permission, isPlatformAdmin, res) {
  if (!hasPermission(role, permission, isPlatformAdmin)) {
    return res.json(
      {
        success: false,
        error: "No tiene permisos para realizar esta acción",
        permission: permission,
        role: role,
        code: "FORBIDDEN",
      },
      403
    );
  }
  return null;
}

/**
 * Obtiene el perfil completo de un usuario
 *
 * @param {object} databases - Appwrite Databases instance
 * @param {string} userId - ID del usuario (userAuthId)
 * @returns {Promise<object>} Documento del perfil
 *
 * @example
 * const profile = await getUserProfile(databases, userId);
 * console.log(profile.role, profile.is_platform_admin);
 */
export async function getUserProfile(databases, userId) {
  const profile = await databases.getDocument(
    process.env.APPWRITE_DATABASE_ID,
    "users_profiles",
    userId
  );
  return profile;
}

/**
 * Valida autenticación básica
 *
 * @param {object} req - Request object de Appwrite Function
 * @param {object} res - Response object
 * @returns {string|null} userId si está autenticado, o null (ya respondió 401)
 *
 * @example
 * const userId = requireAuth(req, res);
 * if (!userId) return; // Ya respondió con 401
 */
export function requireAuth(req, res) {
  const userId = req.headers["x-appwrite-user-id"];
  if (!userId) {
    res.json(
      {
        success: false,
        error: "No autenticado",
        code: "UNAUTHORIZED",
      },
      401
    );
    return null;
  }
  return userId;
}

/**
 * Valida que el usuario puede modificar un recurso propio
 *
 * Solo el mismo usuario o usuarios con permiso USERS_MANAGE pueden editar
 *
 * @param {string} userId - ID del usuario autenticado
 * @param {string} targetUserId - ID del usuario a modificar
 * @param {string} role - Rol del usuario autenticado
 * @param {boolean} isPlatformAdmin - Flag is_platform_admin
 * @param {object} res - Response object
 * @returns {object|null} Response con error 403 o null si tiene permisos
 */
export function requireOwnerOrAdmin(
  userId,
  targetUserId,
  role,
  isPlatformAdmin,
  res
) {
  // Mismo usuario: permitir
  if (userId === targetUserId) return null;

  // Usuario diferente: requiere USERS_MANAGE
  if (!hasPermission(role, Permission.USERS_MANAGE, isPlatformAdmin)) {
    return res.json(
      {
        success: false,
        error: "No autorizado para modificar otro usuario",
        code: "FORBIDDEN",
      },
      403
    );
  }

  return null;
}

/**
 * Registra un evento en audit_log
 *
 * @param {object} databases - Appwrite Databases instance
 * @param {string} action - Acción realizada (ej: "CREATED_VOUCHER")
 * @param {string} userId - ID del usuario que realiza la acción
 * @param {string} folio - Folio del vale (opcional)
 * @param {string} details - Detalles adicionales (opcional)
 * @param {object} metadata - Metadata adicional (se convierte a JSON string)
 * @returns {Promise<object>} Documento creado en audit_log
 */
export async function logAuditEvent(
  databases,
  action,
  userId,
  folio = null,
  details = null,
  metadata = null
) {
  return await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID,
    "audit_log",
    "unique()",
    {
      action,
      user_id: userId,
      folio,
      details,
      metadata: metadata ? JSON.stringify(metadata) : null,
      enabled: true,
    }
  );
}
