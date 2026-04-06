import Notification from '../models/Notification.js';

// GET /api/notifications — paginated for current user
export const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const filter = { recipient: req.user._id };
        if (req.query.type) filter.type = req.query.type;
        if (req.query.unread === 'true') filter.read = false;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .populate('relatedTask', 'title status')
                .populate('relatedProject', 'name')
                .populate('relatedTeam', 'name'),
            Notification.countDocuments(filter),
            Notification.countDocuments({ recipient: req.user._id, read: false })
        ]);

        res.json({ notifications, total, page, pages: Math.ceil(total / limit), unreadCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/notifications/:id/read
export const markRead = async (req, res) => {
    try {
        const notif = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { read: true },
            { new: true }
        );
        if (!notif) return res.status(404).json({ message: 'Notification not found' });
        res.json(notif);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/notifications/read-all
export const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
        res.json({ message: 'All marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/notifications/clear-all
export const clearAll = async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.user._id });
        res.json({ message: 'Cleared all notifications' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Internal helper — called from other controllers
export const createNotification = async ({ recipient, type, title, message, relatedTask, relatedProject, relatedTeam, actionUrl, io }) => {
    try {
        const notif = await Notification.create({ recipient, type, title, message, relatedTask, relatedProject, relatedTeam, actionUrl });
        if (io) io.to(recipient.toString()).emit('notification:new', notif);
        return notif;
    } catch (err) {
        console.error('Failed to create notification:', err.message);
    }
};
