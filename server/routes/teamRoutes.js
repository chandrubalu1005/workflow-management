import express from 'express';
import { getTeams, createTeam, updateTeam, deleteTeam, addMembers, removeMember } from '../controllers/teamController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

// List all teams (anyone authenticated)
router.get('/', getTeams);

// Create team (admin only)
router.post('/', requireAdmin, createTeam);

// Update team (admin only)
router.put('/:id', requireAdmin, updateTeam);

// Delete team (admin only)
router.delete('/:id', requireAdmin, deleteTeam);

// Add members to team (admin only)
router.post('/:id/members', requireAdmin, addMembers);

// Remove member from team (admin only)
router.delete('/:id/members/:userId', requireAdmin, removeMember);

export default router;
