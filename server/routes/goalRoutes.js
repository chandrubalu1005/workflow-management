import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getGoals, createGoal, updateGoal, deleteGoal, toggleGoalCompletion } from '../controllers/goalController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// List and Create
router.route('/')
    .get(getGoals)
    .post(createGoal);

// Toggle completion explicitly
router.route('/:id/toggle')
    .put(toggleGoalCompletion);

// Update and Delete
router.route('/:id')
    .put(updateGoal)
    .delete(deleteGoal);

export default router;
