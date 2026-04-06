import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getPerformanceReport } from '../controllers/performanceController.js';

const router = express.Router();
router.use(authenticate);

// GET /api/performance?userId=xxx&month=2025-01
router.get('/', getPerformanceReport);

export default router;
