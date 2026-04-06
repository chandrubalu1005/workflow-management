import express from 'express';
import { getLogs } from '../controllers/logController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', getLogs);

export default router;
