import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getWeeklyActivity, exportTasks, exportGoals, exportVelocity, getDashboardStats } from '../controllers/reportController.js';

const router = express.Router();

// @desc    Get comprehensive dashboard stats
// @route   GET /api/reports/dashboard-stats
router.get('/dashboard-stats', authenticate, getDashboardStats);

// @desc    Get weekly task activity 
// @route   GET /api/reports/weekly-activity
router.get('/weekly-activity', authenticate, getWeeklyActivity);

// @desc    Export tasks as CSV
// @route   GET /api/reports/export-tasks
router.get('/export-tasks', authenticate, exportTasks);

// @desc    Export goals as CSV
// @route   GET /api/reports/export-goals
router.get('/export-goals', authenticate, exportGoals);

// @desc    Export velocity stats as CSV
// @route   GET /api/reports/export-velocity
router.get('/export-velocity', authenticate, exportVelocity);

export default router;
