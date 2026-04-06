import { Task, User, Team, Project, Notification, ActivityLog } from '../models/index.js';

// GET /api/analytics/overview
export const getOverview = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const taskQuery = isAdmin ? {} : { assignedTo: req.user._id };

        const [tasks, users, teams] = await Promise.all([
            Task.find(taskQuery).lean(),
            User.find({ role: { $ne: 'admin' }, status: 'active' }).lean(),
            Team.find().lean()
        ]);

        const total = tasks.length || 0;
        const completed = tasks.filter(t => t.status === 'completed').length || 0;
        const inProgress = tasks.filter(t => t.status === 'in-progress').length || 0;
        const blocked = tasks.filter(t => t.status === 'blocked').length || 0;

        const now = new Date();
        const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length || 0;
        const dueToday = tasks.filter(t => {
            if (!t.endDate || t.status === 'completed') return false;
            return new Date(t.endDate).toDateString() === now.toDateString();
        }).length || 0;
        const overdue = tasks.filter(t => {
            if (!t.endDate || t.status === 'completed') return false;
            return new Date(t.endDate) < now;
        }).length || 0;

        const overloadedUsers = users.filter(u => (u.workloadScore || 0) > 70);
        const utilizationAvg = users.length > 0
            ? Math.round(users.reduce((s, u) => s + (u.workloadScore || 0), 0) / users.length)
            : 0;

        const deadlineRisk = tasks.filter(t => {
            if (!t.endDate || t.status === 'completed') return false;
            const daysLeft = Math.ceil((new Date(t.endDate) - now) / 86400000);
            return daysLeft <= 2 && daysLeft >= 0;
        }).length || 0;

        const radarData = [
            { metric: 'Speed', value: total > 0 ? Math.round((completed / total) * 100) : 0 },
            { metric: 'Accuracy', value: total > 0 ? Math.round(((total - blocked) / total) * 100) : 100 },
            { metric: 'Collaboration', value: total > 0 ? Math.round((tasks.filter(t => t.assignment?.type === 'team').length / total) * 100) : 0 },
            { metric: 'Deadline', value: total > 0 ? Math.round((1 - tasks.filter(t => t.endDate && new Date(t.endDate) < now && t.status !== 'completed').length / total) * 100) : 100 },
            { metric: 'Utilization', value: utilizationAvg || 0 },
        ];

        res.json({
            total, completed, inProgress, blocked,
            highPriority, dueToday, overdue,
            overloadedCount: overloadedUsers.length || 0,
            utilizationAvg: utilizationAvg || 0,
            deadlineRisk,
            totalUsers: users.length || 0,
            totalTeams: teams.length || 0,
            totalProjects: (await Project.countDocuments()) || 0,
            radarData
        });
    } catch (err) {
        console.error('Analytics overview error:', err);
        res.status(500).json({ message: err.message });
    }
};

// GET /api/analytics/completion-trend?days=30
export const getCompletionTrend = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const isAdmin = req.user.role === 'admin';
        const query = { createdAt: { $gte: since } };
        if (!isAdmin) query.assignedTo = req.user._id;

        const tasks = await Task.find(query).lean();
        const buckets = {};

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            buckets[key] = { date: label, created: 0, completed: 0 };
        }

        tasks.forEach(t => {
            const createdKey = new Date(t.createdAt).toISOString().split('T')[0];
            if (buckets[createdKey]) buckets[createdKey].created++;
            if (t.status === 'completed') {
                const completedKey = new Date(t.updatedAt).toISOString().split('T')[0];
                if (buckets[completedKey]) buckets[completedKey].completed++;
            }
        });

        res.json(Object.values(buckets));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/analytics/task-aging
export const getTaskAging = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const query = { status: { $ne: 'completed' } };
        if (!isAdmin) query.assignedTo = req.user._id;

        const tasks = await Task.find(query).lean();
        const now = new Date();
        const buckets = {
            '0-3d': 0, '4-7d': 0, '1-2w': 0, '2-4w': 0, '>1mo': 0
        };
        tasks.forEach(t => {
            const age = Math.floor((now - new Date(t.createdAt)) / 86400000);
            if (age <= 3) buckets['0-3d']++;
            else if (age <= 7) buckets['4-7d']++;
            else if (age <= 14) buckets['1-2w']++;
            else if (age <= 28) buckets['2-4w']++;
            else buckets['>1mo']++;
        });
        res.json(Object.entries(buckets).map(([name, count]) => ({ name, count })));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/analytics/role-distribution
export const getRoleDistribution = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' }, status: 'active' }, 'position').lean();
        const counts = {};
        users.forEach(u => {
            const pos = u.position || 'Unassigned';
            counts[pos] = (counts[pos] || 0) + 1;
        });
        res.json(Object.entries(counts).map(([name, value]) => ({ name, value })));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/analytics/performance (for all users - admin filtered)
export const getPerformance = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' }, status: 'active' })
            .select('name position workloadScore totalRewardPoints')
            .lean();

        const taskCounts = await Task.aggregate([
            { $group: { _id: '$assignedTo', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
        ]);
        const tcMap = {};
        taskCounts.forEach(tc => { tcMap[tc._id?.toString()] = tc; });

        const result = users.map(u => {
            const tc = tcMap[u._id?.toString()] || { total: 0, completed: 0 };
            const completionRate = tc.total > 0 ? Math.round((tc.completed / tc.total) * 100) : 0;
            const efficiency = Math.min(100, Math.round((completionRate * 0.6) + (Math.min(100, u.totalRewardPoints || 0) * 0.4)));
            return {
                ...u,
                totalTasks: tc.total,
                completedTasks: tc.completed,
                completionRate,
                efficiencyScore: efficiency,
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/analytics/workload - detailed workload overview
export const getWorkloadOverview = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' }, status: 'active' })
            .select('name position workloadScore')
            .lean();

        const taskCounts = await Task.aggregate([
            { $match: { status: { $ne: 'completed' } } },
            { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
        ]);
        const tcMap = {};
        taskCounts.forEach(tc => { tcMap[tc._id?.toString()] = tc.count; });

        const result = users.map(u => ({
            ...u,
            activeTasks: tcMap[u._id?.toString()] || 0,
            load: u.workloadScore || 0,
            status: (u.workloadScore || 0) > 80 ? 'overloaded' : (u.workloadScore || 0) > 50 ? 'moderate' : 'available'
        })).sort((a, b) => b.load - a.load);

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/analytics/activity - real-time action feed
export const getRecentActivity = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const limit = 20;

        // 1. Get recent explicitly logged actions
        const logQuery = isAdmin ? {} : { user: req.user._id };
        const logs = await ActivityLog.find(logQuery)
            .sort('-createdAt')
            .limit(limit)
            .populate('user', 'name avatar')
            .lean();

        // 2. Get recent task updates that might not be in logs
        const taskQuery = isAdmin ? {} : { assignedTo: req.user._id };
        const taskUpdates = await Task.find(taskQuery)
            .sort('-updatedAt')
            .limit(limit)
            .populate('assignedTo', 'name avatar')
            .lean();

        // Format and merge
        const combined = [
            ...logs.map(l => ({
                id: l._id,
                type: 'system',
                action: l.action,
                message: l.details,
                user: l.user?.name || 'System',
                timestamp: l.createdAt
            })),
            ...taskUpdates.map(t => ({
                id: t._id,
                type: 'task',
                action: t.status === 'completed' ? 'TASK_COMPLETED' : 'TASK_UPDATED',
                message: `Task: ${t.title}`,
                user: t.assignedTo?.name || 'Unassigned',
                timestamp: t.updatedAt
            }))
        ]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

        res.json(combined);
    } catch (err) {
        console.error('Activity feed error:', err);
        res.status(500).json({ message: err.message });
    }
};
