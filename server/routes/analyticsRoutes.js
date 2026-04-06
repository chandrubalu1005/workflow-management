import express from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import {
    getOverview, getCompletionTrend, getTaskAging,
    getRoleDistribution, getPerformance, getWorkloadOverview,
    getRecentActivity
} from '../controllers/analyticsController.js';

const router = express.Router();
router.use(authenticate);

router.get('/overview', getOverview);
router.get('/completion-trend', getCompletionTrend);
router.get('/task-aging', getTaskAging);
router.get('/role-distribution', requireAdmin, getRoleDistribution);
router.get('/performance', getPerformance);
router.get('/workload', requireAdmin, getWorkloadOverview);
router.get('/activity', getRecentActivity);

export default router;
