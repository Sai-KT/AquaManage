import express from 'express';
import { waterController } from '../controllers/waterController.js';
import { requireAuth } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';

const router = express.Router();

router.get('/tanks', waterController.getTanks);
router.patch('/tanks/:id', requireAuth, requireRole('admin', 'maintenance'), waterController.updateTankLevel);
router.get('/usage', waterController.getUsage);
router.get('/harvesting', waterController.getHarvesting);

export default router;
