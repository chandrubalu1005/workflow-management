import Goal from '../models/Goal.js';

// @desc    Get all goals for logged in user
// @route   GET /api/goals
export const getGoals = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.user = req.user._id;
        }

        const goals = await Goal.find(query).populate('task', 'title status').sort({ createdAt: -1 });
        res.status(200).json(goals);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ message: 'Server Error fetching goals' });
    }
};

// @desc    Create a new goal
// @route   POST /api/goals
export const createGoal = async (req, res) => {
    try {
        const { title, deadline, task } = req.body;

        const goal = new Goal({
            title,
            user: req.user._id,
            deadline: deadline || null,
            task: task || null
        });

        const createdGoal = await goal.save();
        res.status(201).json(createdGoal);
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ message: 'Server Error creating goal' });
    }
};

// @desc    Toggle goal completion status
// @route   PUT /api/goals/:id/toggle
export const toggleGoalCompletion = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        // Verify ownership (or admin)
        const goalUserId = goal.user ? goal.user.toString() : null;
        const currentUserId = req.user && req.user._id ? req.user._id.toString() : null;

        if (goalUserId !== currentUserId && req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this goal' });
        }

        goal.isCompleted = !goal.isCompleted;
        goal.completedAt = goal.isCompleted ? new Date() : null;

        if (goal.isCompleted && goal.deadline) {
            const completedDate = new Date(goal.completedAt);
            completedDate.setHours(0,0,0,0);
            const deadlineDate = new Date(goal.deadline);
            deadlineDate.setHours(23,59,59,999);
            
            if (completedDate <= deadlineDate) {
                const pts = goal.rewardPoints || 0;
                if (pts > 0) {
                    await (await import('../models/User.js')).default.findByIdAndUpdate(goal.user, {
                        $inc: { totalRewardPoints: pts },
                        $push: {
                            rewardHistory: {
                                taskId: goal.task || null,
                                taskTitle: `Goal: ${goal.title}`,
                                pointsAwarded: pts,
                                awardedBy: req.user._id,
                                awardedAt: new Date()
                            }
                        }
                    });
                }
            }
        }

        const updatedGoal = await goal.save();
        res.status(200).json(updatedGoal);
    } catch (error) {
        console.error('Error toggling goal status:', error);
        res.status(500).json({ message: 'Server Error updating goal' });
    }
};

// @desc    Update a goal
// @route   PUT /api/goals/:id
export const updateGoal = async (req, res) => {
    try {
        const { title, deadline, task } = req.body;
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        // Verify ownership
        if (goal.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this goal' });
        }

        goal.title = title || goal.title;
        if (deadline !== undefined) goal.deadline = deadline;
        if (task !== undefined) goal.task = task;

        const updatedGoal = await goal.save();
        res.status(200).json(updatedGoal);
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ message: 'Server Error updating goal' });
    }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
export const deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        // Verify ownership
        if (goal.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this goal' });
        }

        await goal.deleteOne();
        res.status(200).json({ message: 'Goal removed successfully' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ message: 'Server Error deleting goal' });
    }
};
