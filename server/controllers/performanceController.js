import { Task, User } from '../models/index.js';

// GET /api/performance?month=2025-01
export const getPerformanceReport = async (req, res) => {
    try {
        const { month } = req.query;
        let startDate, endDate;

        if (month) {
            const [y, m] = month.split('-').map(Number);
            startDate = new Date(y, m - 1, 1);
            endDate = new Date(y, m, 1);
        } else {
            startDate = new Date();
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(1);
        }

        const users = await User.find({ status: 'active' })
            .select('name role position totalRewardPoints workloadScore')
            .lean();

        // Tasks overlapping this month (either created before the end, and not completed before the start)
        const allTasks = await Task.find({
            createdAt: { $lt: endDate },
            $or: [
                { status: { $ne: 'completed' } },
                { updatedAt: { $gte: startDate } }
            ]
        }).lean();

        // --- PREVIOUS MONTH CALCULATION (for trends) ---
        const prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        const prevEndDate = new Date(startDate); // Up to the start of this month

        const prevTasks = await Task.find({
            createdAt: { $lt: prevEndDate },
            $or: [
                { status: { $ne: 'completed' } },
                { updatedAt: { $gte: prevStartDate } }
            ]
        }).lean();

        const result = users.map(u => {
            // CURRENT MONTH METRICS
            const myTasks = allTasks.filter(t =>
                t.assignedTo?.toString() === u._id.toString() ||
                t.assignment?.members?.some(m => m.userId?.toString() === u._id.toString())
            );
            const completed = myTasks.filter(t => t.status === 'completed').length;
            const overdue = myTasks.filter(t => t.endDate && new Date(t.endDate) < endDate && t.status !== 'completed').length;
            const completionRate = myTasks.length > 0 ? Math.round((completed / myTasks.length) * 100) : 0;
            const teamTasks = myTasks.filter(t => t.assignment?.type === 'team').length;
            const teamContribution = myTasks.length > 0 ? Math.round((teamTasks / myTasks.length) * 100) : 0;
            const overloadFreq = Math.min(100, (u.workloadScore || 0));
            const efficiency = Math.min(100, Math.round((completionRate * 0.5) + (teamContribution * 0.2) + ((100 - overloadFreq) * 0.3)));

            // PREVIOUS MONTH METRICS
            const myPrevTasks = prevTasks.filter(t =>
                t.assignedTo?.toString() === u._id.toString() ||
                t.assignment?.members?.some(m => m.userId?.toString() === u._id.toString())
            );
            const prevCompleted = myPrevTasks.filter(t => t.status === 'completed').length;
            const prevCompletionRate = myPrevTasks.length > 0 ? Math.round((prevCompleted / myPrevTasks.length) * 100) : 0;
            const prevTeamTasks = myPrevTasks.filter(t => t.assignment?.type === 'team').length;
            const prevTeamContribution = myPrevTasks.length > 0 ? Math.round((prevTeamTasks / myPrevTasks.length) * 100) : 0;
            const prevEfficiency = Math.min(100, Math.round((prevCompletionRate * 0.5) + (prevTeamContribution * 0.2) + ((100 - overloadFreq) * 0.3)));

            // DETERMINE TREND
            let trend = 'neutral';
            if (efficiency > prevEfficiency) trend = 'up';
            else if (efficiency < prevEfficiency) trend = 'down';

            return {
                _id: u._id,
                name: u.name,
                position: u.position,
                totalTasks: myTasks.length,
                completedTasks: completed,
                overdueTasks: overdue,
                completionRate,
                teamContribution,
                overloadFrequency: overloadFreq,
                efficiencyScore: efficiency,
                prevEfficiencyScore: prevEfficiency,
                trend,
                rewardPoints: u.totalRewardPoints || 0
            };
        });

        res.json(result.sort((a, b) => b.efficiencyScore - a.efficiencyScore));
    } catch (err) {
        console.error('Performance error:', err);
        res.status(500).json({ message: err.message });
    }
};
