import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { requireAuth } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/reports', adminController.getAllReports);
router.get('/maintenance-staff', adminController.getMaintenanceStaff);
router.patch('/reports/:id/assign', adminController.assignReport);
router.patch('/reports/:id/status', adminController.updateReportStatus);
router.get('/alerts', adminController.getAlerts);
router.patch('/alerts/mark-read', adminController.markAllAlertsRead);
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);

export default router;
