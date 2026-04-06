import Task from '../models/Task.js';
import User from '../models/User.js';

// GET /api/reports/dashboard-stats
export const getDashboardStats = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.assignedTo = req.user._id;
        }

        const tasks = await Task.find(query).populate('assignedTo', 'name totalRewardPoints');

        // 1. High-Level KPIs
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'review');
        const completionRate = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

        let totalCompletionTime = 0;
        let completedCountWithDates = 0;
        completedTasks.forEach(t => {
            if (t.createdAt && t.updatedAt) {
                totalCompletionTime += (new Date(t.updatedAt) - new Date(t.createdAt)) / (1000 * 60 * 60 * 24);
                completedCountWithDates++;
            }
        });
        const avgCompletionTime = completedCountWithDates ? (totalCompletionTime / completedCountWithDates).toFixed(1) : 0;

        const overdueRisk = tasks.filter(t => t.status !== 'completed' && t.endDate && new Date(t.endDate) < new Date()).length;

        // 2. Status Distribution (Donut Chart)
        const statusCounts = { pending: 0, 'in-progress': 0, review: 0, completed: 0, blocked: 0 };
        tasks.forEach(t => {
            if (statusCounts[t.status] !== undefined) {
                statusCounts[t.status]++;
            } else {
                statusCounts['pending']++;
            }
        });
        const statusDistribution = Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] }));

        // 3. Priority Breakdown
        const priorityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
        tasks.forEach(t => { 
            if(priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
            else priorityCounts['medium']++;
        });
        const priorityBreakdown = Object.keys(priorityCounts).map(k => ({ name: k, value: priorityCounts[k] }));

        // 4. Task Velocity Trend (30 Days)
        const velocityTrend = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            
            const nextDay = new Date(d);
            nextDay.setDate(d.getDate() + 1);

            const created = tasks.filter(t => new Date(t.createdAt) >= d && new Date(t.createdAt) < nextDay).length;
            const completed = completedTasks.filter(t => new Date(t.updatedAt) >= d && new Date(t.updatedAt) < nextDay).length;

            velocityTrend.push({ 
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
                created, 
                completed 
            });
        }

        // 5. Team Workload Distribution
        const workloadMap = {};
        tasks.filter(t => t.status !== 'completed').forEach(t => {
            if (t.assignedTo) {
                const name = t.assignedTo.name;
                workloadMap[name] = (workloadMap[name] || 0) + 1;
            } else {
                workloadMap['Unassigned'] = (workloadMap['Unassigned'] || 0) + 1;
            }
        });
        const teamWorkload = Object.keys(workloadMap).map(k => ({ name: k, tasks: workloadMap[k] }));

        // 6. Top Performers (from top 5 users by rewardPoints)
        let topPerformers = [];
        if (req.user.role === 'admin') {
            const users = await User.find().sort({ totalRewardPoints: -1 }).limit(5);
            topPerformers = users.map(u => ({ name: u.name, points: u.totalRewardPoints || 0 }));
        } else {
            // Normal user just sees their own points vs goal
            const me = await User.findById(req.user._id);
            topPerformers = [{ name: me.name, points: me.totalRewardPoints || 0 }];
        }

        res.json({
            kpis: {
                completionRate,
                avgCompletionTime,
                overdueRisk
            },
            statusDistribution,
            priorityBreakdown,
            velocityTrend,
            teamWorkload,
            topPerformers
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server Error fetching dashboard stats' });
    }
};

// GET /api/reports/weekly-activity
export const getWeeklyActivity = async (req, res) => {
    try {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            last7Days.push(d);
        }

        const activityData = await Promise.all(last7Days.map(async (date) => {
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);

            let query = {
                createdAt: {
                    $gte: date,
                    $lt: nextDay
                }
            };

            if (req.user.role !== 'admin') {
                query.assignedTo = req.user._id;
            }

            const count = await Task.countDocuments(query);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            return { name: dayName, tasks: count };
        }));

        res.json(activityData);
    } catch (error) {
        console.error('Error fetching weekly activity:', error);
        res.status(500).json({ message: 'Server Error fetching report data' });
    }
};

// GET /api/reports/export-tasks
export const exportTasks = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.assignedTo = req.user._id;
        }

        const tasks = await Task.find(query).populate('assignedTo', 'name email').populate('createdBy', 'name');

        // Manual CSV construction
        const fields = ['ID', 'Title', 'Status', 'Priority', 'Assigned To', 'Created By', 'Due Date', 'Created At'];
        let csv = fields.join(',') + '\n';

        tasks.forEach(task => {
            const row = [
                task._id,
                `"${task.title.replace(/"/g, '""')}"`, // Escape quotes
                task.status,
                task.priority,
                task.assignedTo ? task.assignedTo.name : 'Unassigned',
                task.createdBy ? task.createdBy.name : 'Unknown',
                task.endDate ? new Date(task.endDate).toLocaleDateString() : 'N/A',
                new Date(task.createdAt).toLocaleDateString()
            ];
            csv += row.join(',') + '\n';
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`tasks-export-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Error exporting tasks:', error);
        res.status(500).json({ message: 'Server Error exporting tasks' });
    }
};

// GET /api/reports/export-goals
export const exportGoals = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.user = req.user._id;
        }

        const Goal = (await import('../models/Goal.js')).default;
        const goals = await Goal.find(query).populate('user', 'name email').populate('task', 'title');

        const fields = ['ID', 'Title', 'Assigned To', 'Task Reference', 'Completed', 'Deadline', 'Completed At', 'Reward Points'];
        let csv = fields.join(',') + '\n';

        goals.forEach(goal => {
            const row = [
                goal._id,
                `"${goal.title.replace(/"/g, '""')}"`,
                goal.user ? goal.user.name : 'Unknown',
                goal.task ? `"${goal.task.title.replace(/"/g, '""')}"` : 'None',
                goal.isCompleted ? 'Yes' : 'No',
                goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'N/A',
                goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : 'N/A',
                goal.rewardPoints || 0
            ];
            csv += row.join(',') + '\n';
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`goals-export-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Error exporting goals:', error);
        res.status(500).json({ message: 'Server Error exporting goals' });
    }
};

// GET /api/reports/export-velocity
export const exportVelocity = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.assignedTo = req.user._id;
        }
        query.status = 'completed';

        const tasks = await Task.find(query).populate('assignedTo', 'name email');
        
        // Group by user
        const velocityMap = {};
        tasks.forEach(task => {
            const userId = task.assignedTo ? task.assignedTo._id.toString() : 'unassigned';
            const userName = task.assignedTo ? task.assignedTo.name : 'Unassigned';
            
            if (!velocityMap[userId]) {
                velocityMap[userId] = { name: userName, totalCompleted: 0, earlyCompletions: 0, lateCompletions: 0 };
            }
            
            velocityMap[userId].totalCompleted += 1;
            
            if (task.endDate && task.updatedAt) {
                if (new Date(task.updatedAt) <= new Date(task.endDate)) {
                    velocityMap[userId].earlyCompletions += 1;
                } else {
                    velocityMap[userId].lateCompletions += 1;
                }
            }
        });

        const fields = ['User Name', 'Total Completed Tasks', 'On-Time/Early Completions', 'Late Completions', 'Velocity Ratio (%)'];
        let csv = fields.join(',') + '\n';

        Object.values(velocityMap).forEach(stats => {
            const ratio = stats.totalCompleted > 0 ? ((stats.earlyCompletions / stats.totalCompleted) * 100).toFixed(1) : 0;
            const row = [
                stats.name,
                stats.totalCompleted,
                stats.earlyCompletions,
                stats.lateCompletions,
                `${ratio}%`
            ];
            csv += row.join(',') + '\n';
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`velocity-export-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Error exporting velocity:', error);
        res.status(500).json({ message: 'Server Error exporting velocity' });
    }
};
