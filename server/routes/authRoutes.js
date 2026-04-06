import express from 'express';
import { login, changePassword, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', login);

router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

export default router;
