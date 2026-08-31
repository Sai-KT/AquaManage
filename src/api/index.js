/**
 * AquaManage — Core Backend / API Layer
 * Exports clean API controllers, validation, and authorization utilities.
 */

export { authApi } from './authApi';
export { reportsApi } from './reportsApi';
export { maintenanceApi } from './maintenanceApi';
export { waterApi } from './waterApi';
export { alertsApi } from './alertsApi';
export { adminApi } from './adminApi';
export { validation } from './validation';
export { authorization, ROLES, PERMISSIONS } from './authorization';

import authApi from './authApi';
import reportsApi from './reportsApi';
import maintenanceApi from './maintenanceApi';
import waterApi from './waterApi';
import alertsApi from './alertsApi';
import adminApi from './adminApi';
import validation from './validation';
import authorization from './authorization';

export const api = {
  auth: authApi,
  reports: reportsApi,
  maintenance: maintenanceApi,
  water: waterApi,
  alerts: alertsApi,
  admin: adminApi,
  validation,
  authorization,
};

export default api;
