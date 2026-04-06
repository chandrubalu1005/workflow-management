import express from 'express';
import { getAllUsers, createUser, updateProfile, uploadAvatar, getRewards, getRewardStats } from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Self-update profile (Allowed for all authenticated users)
router.put('/profile', updateProfile);

import upload from '../middleware/uploadMiddleware.js';
router.post('/avatar', upload.single('avatar'), uploadAvatar);

// Get Rewards (Self)
router.get('/rewards', getRewards);

// --- Admin Only Routes ---
router.use(requireAdmin);

router.get('/', getAllUsers);
router.get('/reward-stats', getRewardStats);
router.post('/', createUser);

// Secure Enterprise Management
import { resetUserPassword, forceLogoutUser, toggleUserAccountStatus, getUserActivityLogs, adminUpdateUser, deleteUser } from '../controllers/userController.js';

router.post('/reset-password', resetUserPassword);
router.post('/:id/force-logout', forceLogoutUser);
router.patch('/:id/toggle-status', toggleUserAccountStatus);
router.get('/:id/logs', getUserActivityLogs);
router.put('/:id', adminUpdateUser);
router.delete('/:id', deleteUser);

export default router;
