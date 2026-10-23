import express from 'express';
import { waterController } from '../controllers/waterController.js';

const router = express.Router();

router.get('/tanks', waterController.getTanks);
router.patch('/tanks/:id', waterController.updateTankLevel);
router.get('/usage', waterController.getUsage);
router.get('/harvesting', waterController.getHarvesting);

export default router;
