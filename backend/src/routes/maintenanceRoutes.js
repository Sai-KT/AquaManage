import express from 'express';
import { maintenanceController } from '../controllers/maintenanceController.js';
import { requireAuth } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('maintenance', 'admin'));

router.get('/tasks', maintenanceController.getAssignedTasks);
router.get('/completed', maintenanceController.getCompletedTasks);
router.patch('/tasks/:id/status', maintenanceController.updateStatus);
router.post('/tasks/:id/logs', maintenanceController.addWorkLog);

export default router;
