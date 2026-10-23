import express from 'express';
import { studentController } from '../controllers/studentController.js';
import { requireAuth } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('student', 'admin'));

router.post(
  '/reports',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  studentController.submitReport
);

router.get('/reports', studentController.getMyReports);
router.get('/reports/:id/history', studentController.getReportHistory);

export default router;
