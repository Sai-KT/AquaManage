/**
 * authorization.js — Role-based Authorization & Permission Engine
 */

export const ROLES = {
  ADMIN: 'admin',
  MAINTENANCE: 'maintenance',
  STUDENT: 'student',
};

export const PERMISSIONS = {
  // Complaints & Reports
  CREATE_REPORT: [ROLES.STUDENT, ROLES.MAINTENANCE, ROLES.ADMIN],
  VIEW_ALL_REPORTS: [ROLES.MAINTENANCE, ROLES.ADMIN],
  VIEW_OWN_REPORTS: [ROLES.STUDENT, ROLES.MAINTENANCE, ROLES.ADMIN],
  UPDATE_REPORT_STATUS: [ROLES.MAINTENANCE, ROLES.ADMIN],
  ASSIGN_REPORT: [ROLES.ADMIN],
  DELETE_REPORT: [ROLES.ADMIN],

  // Work Logs
  CREATE_WORK_LOG: [ROLES.MAINTENANCE, ROLES.ADMIN],
  VIEW_WORK_LOGS: [ROLES.STUDENT, ROLES.MAINTENANCE, ROLES.ADMIN],

  // System & Tank Management
  UPDATE_TANK_TELEMETRY: [ROLES.MAINTENANCE, ROLES.ADMIN],
  VIEW_CAMPUS_ANALYTICS: [ROLES.ADMIN],
  MANAGE_CAMPUS_ZONES: [ROLES.ADMIN],
  BROADCAST_ALERTS: [ROLES.ADMIN],
};

export const authorization = {
  /**
   * Check if a given user role possesses a specific permission
   */
  hasPermission(userRole, permission) {
    if (!userRole) return false;
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(userRole);
  },

  /**
   * Verify whether the active session satisfies required role(s)
   */
  requireRole(user, allowedRoles = []) {
    if (!user || !user.role) {
      return {
        authorized: false,
        error: 'Authentication required. No active user session.',
      };
    }
    const rolesList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (rolesList.length > 0 && !rolesList.includes(user.role)) {
      return {
        authorized: false,
        error: `Access denied. Role "${user.role}" does not have permission for this action.`,
      };
    }
    return {
      authorized: true,
      user,
    };
  },
};

export default authorization;
