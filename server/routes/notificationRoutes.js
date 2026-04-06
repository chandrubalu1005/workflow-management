import express from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import {
    getNotifications,
    getUnreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    clearAll
} from '../controllers/notificationController.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markRead);
router.put('/read-all', markAllRead);
router.delete('/clear-all', clearAll);
router.delete('/:id', deleteNotification);

export default router;
