import express from 'express';
import { 
    getTasks, getTaskById, createTask, updateTask, updateTaskStatus, 
    toggleGoal, awardPoints, decomposeTask, deleteTask, addTimeLog, 
    bulkReassign, getArchivedTasks, archiveTask, restoreTask,
    uploadTaskFile, deleteTaskFile, getTaskHistory,
    getAutomations, createAutomation, deleteAutomation
} from '../controllers/taskController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// Get all tasks (Admin) or assigned tasks (Normal)
router.get('/', getTasks);

// Get archived tasks
router.get('/archived', getArchivedTasks);

// Archive a task
router.put('/:id/archive', requireAdmin, archiveTask);

// Restore a task
router.put('/:id/restore', requireAdmin, restoreTask);

// Create Task (Admin only)
router.post('/', requireAdmin, createTask);

// Bulk Reassign (Admin only)
router.post('/bulk-reassign', requireAdmin, bulkReassign);

// Flow Automations
router.get('/automations', getAutomations);
router.post('/automations', requireAdmin, createAutomation);
router.delete('/automations/:id', requireAdmin, deleteAutomation);

// Award Points (Admin only)
router.post('/:taskId/award-points', requireAdmin, awardPoints);

// Update Task (full edit - Admin only)
router.patch('/:id', requireAdmin, updateTask);

// Update Status (any authenticated user)
router.patch('/:id/status', updateTaskStatus);


// Log Time Details
router.post('/:id/time', addTimeLog);

// Complete Goal
router.patch('/goals/:goalId/toggle', toggleGoal);

// Decompose Task (Magic Wand)
router.post('/:id/decompose', decomposeTask);

// The Chronicle (History)
router.get('/:id/history', getTaskHistory);

// File Vault (Attachments)
router.post('/:id/files', upload.single('file'), uploadTaskFile);
router.delete('/:id/files/:fileId', deleteTaskFile);

// Delete Task (Admin only)
router.delete('/:id', requireAdmin, deleteTask);

// Get specific Task By ID (Should be near bottom to avoid intercepting other /something like /bulk-reassign)
router.get('/:id', getTaskById);

export default router;
