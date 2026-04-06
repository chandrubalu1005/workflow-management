import express from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getSettings);
router.put('/', requireAdmin, updateSettings);

export default router;
