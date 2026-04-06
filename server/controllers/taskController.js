import { Task, Goal, User, ActivityLog, Project, Team, TaskHistory, Automation } from '../models/index.js';
import { createNotification } from './notificationController.js';
import { getIo } from '../config/socket.js';
import { notifySlack } from '../utils/slack.js';
import { logTaskHistory, triggerAutomations } from '../utils/workflow.js';

// Get Tasks (Role based)
export const getTasks = async (req, res) => {
    const { role, id } = req.user;

    try {
        let tasks;
        const populateOptions = [
            { path: 'goals' },
            { path: 'assignedTo', select: 'id name profilePicture' },
            { path: 'createdBy', select: 'id name' },
            { path: 'project', select: 'name status' },
            { path: 'parentTask', select: 'title status' },
            { path: 'dependencies', select: 'title status' },
            { path: 'subtasks', select: 'title status priority assignedTo' },
            {
                path: 'assignment.targetId',
                select: 'name icon color',
                // We use a manual check or virtual for dynamic refs in real world, 
                // but let's try direct populate with model hint if possible or handle in controller.
            }
        ];

        if (role === 'admin') {
            // Admin sees all tasks
            tasks = await Task.find({ isArchived: { $ne: true } })
                .populate(populateOptions)
                .sort({ createdAt: -1 });
        } else {
            // Normal user sees assigned tasks
            tasks = await Task.find({ assignedTo: id, isArchived: { $ne: true } })
                .populate(populateOptions)
                .sort({ priority: -1, endDate: 1 });
        }

        res.json(tasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Failed to fetch tasks' });
    }
};

// Create Task (Admin only)
export const createTask = async (req, res) => {
    const { 
        title, description, priority, startDate, endDate, 
        assignedToId, assignment, goals, project, rewardPoints,
        parentTask, dependencies, estimatedHours, tags
    } = req.body;

    try {
        const newTask = new Task({
            title,
            description,
            priority,
            startDate,
            endDate,
            assignedTo: assignedToId || (assignment?.type === 'individual' ? assignment.targetId : undefined),
            assignment: assignment ? {
                type: assignment.type,
                targetId: assignment.targetId,
                targetModel: assignment.type === 'team' ? 'Team' : 'User',
                strategy: assignment.strategy || 'synchronous'
            } : undefined,
            project,
            parentTask: parentTask || null,
            dependencies: dependencies || [],
            estimatedHours: estimatedHours || 0,
            tags: tags || [],
            rewardPoints: rewardPoints || 0,
            createdBy: req.user.id
        });

        await newTask.save();

        // If this is a subtask, link it to the parent task
        if (parentTask) {
            await Task.findByIdAndUpdate(parentTask, { $push: { subtasks: newTask._id } });
        }

        // Link Task to Project if provided
        if (project) {
            await Project.findByIdAndUpdate(project, { $push: { tasks: newTask._id } });
        }

        // Update User Workload Score
        if (newTask.assignedTo) {
            await User.findByIdAndUpdate(newTask.assignedTo, { $inc: { workloadScore: 10 } });
        }

        // Create Goals if provided
        if (goals && goals.length > 0) {
            const goalData = goals
                .filter(g => g.title) // valid title required
                .map(g => ({
                    ...g,
                    deadline: g.deadline ? new Date(g.deadline) : null,
                    task: newTask._id,
                    user: newTask.assignedTo || req.user.id
                }));
            const createdGoals = await Goal.insertMany(goalData);

            // Link goals to task
            newTask.goals = createdGoals.map(g => g._id);
            await newTask.save();
        }

        // Log Activity
        await ActivityLog.create({
            action: 'TASK_CREATED',
            user: req.user.id,
            details: JSON.stringify({ taskId: newTask.id, title: newTask.title }),
            ipAddress: req.ip
        });

        // Send Notification if assigned to someone else
        if (newTask.assignedTo && newTask.assignedTo.toString() !== req.user.id.toString()) {
            await createNotification({
                recipient: newTask.assignedTo,
                type: 'assignment',
                title: 'New Task Assigned',
                message: `You have been assigned: ${newTask.title}`,
                relatedTask: newTask._id,
                actionUrl: '/tasks'
            });
        }

        try { getIo().emit('tasks_refresh'); } catch(e){}
        res.status(201).json({ message: 'Task created successfully', task: newTask });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Failed to create task' });
    }
};

// Update Task (Admin only - full edit)
export const updateTask = async (req, res) => {
    const { id } = req.params;
    const { title, description, priority, startDate, endDate, assignedToId, rewardPoints, tags, estimatedHours } = req.body;

    try {
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Only admin can fully edit tasks
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can edit task details' });
        }

        const oldAssignee = task.assignedTo?.toString();

        if (title !== undefined && title !== task.title) {
            await logTaskHistory({ taskId: task._id, userId: req.user.id, action: 'UPDATE_TITLE', field: 'title', oldValue: task.title, newValue: title });
            task.title = title;
        }
        if (description !== undefined && description !== task.description) {
            await logTaskHistory({ taskId: task._id, userId: req.user.id, action: 'UPDATE_DESCRIPTION', field: 'description', oldValue: task.description, newValue: description });
            task.description = description;
        }
        if (priority !== undefined && priority !== task.priority) {
            await logTaskHistory({ taskId: task._id, userId: req.user.id, action: 'UPDATE_PRIORITY', field: 'priority', oldValue: task.priority, newValue: priority });
            task.priority = priority;
            await triggerAutomations(task._id, 'priority_change', 'priority', priority, req.user);
        }
        if (startDate !== undefined) task.startDate = startDate;
        if (endDate !== undefined) task.endDate = endDate;
        if (rewardPoints !== undefined) task.rewardPoints = rewardPoints;
        if (tags !== undefined) task.tags = tags;
        if (estimatedHours !== undefined && estimatedHours !== task.estimatedHours) {
            await logTaskHistory({ taskId: task._id, userId: req.user.id, action: 'UPDATE_ESTIMATED_HOURS', field: 'estimatedHours', oldValue: task.estimatedHours, newValue: estimatedHours });
            task.estimatedHours = estimatedHours;
        }

        if (assignedToId !== undefined && assignedToId !== oldAssignee) {
            // Adjust workload scores on reassignment
            if (oldAssignee) await User.findByIdAndUpdate(oldAssignee, { $inc: { workloadScore: -10 } });
            if (assignedToId) await User.findByIdAndUpdate(assignedToId, { $inc: { workloadScore: 10 } });
            task.assignedTo = assignedToId || null;

            // Notify new assignee
            if (assignedToId && assignedToId !== req.user.id) {
                await createNotification({
                    recipient: assignedToId,
                    type: 'assignment',
                    title: 'Task Reassigned to You',
                    message: `You have been assigned: ${task.title}`,
                    relatedTask: task._id,
                    actionUrl: '/tasks'
                });
            }
        }

        await task.save();

        await ActivityLog.create({
            action: 'TASK_UPDATED',
            user: req.user.id,
            details: JSON.stringify({ taskId: task.id, title: task.title, fields: Object.keys(req.body) }),
            ipAddress: req.ip
        });

        const updatedTask = await Task.findById(id)
            .populate('assignedTo', 'id name')
            .populate('createdBy', 'id name')
            .populate('goals')
            .populate('project', 'name status');

        try { getIo().emit('tasks_refresh'); } catch(e){}
        res.json({ message: 'Task updated successfully', task: updatedTask });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Failed to update task' });
    }
};

// Update Task Status (User or Admin)
export const updateTaskStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Permission check
        // Note: task.assignedTo is an ObjectId, convert to string for comparison
        // Logic for Team Tasks vs Individual Tasks
        const priorStatus = task.status;

        if (task.assignment?.type === 'team') {
            const teamId = task.assignment.targetId;
            const strategy = task.assignment.strategy || 'synchronous';
            const team = await (await import('../models/Team.js')).default.findById(teamId);
            const teamSize = team?.members?.length || 1;

            if (status === 'completed') {
                if (!task.acknowledgedBy.includes(req.user.id)) {
                    task.acknowledgedBy.push(req.user.id);
                }

                const votes = task.acknowledgedBy.length;
                let shouldComplete = strategy === 'first-to-finish' ? true :
                                    strategy === 'majority' ? votes > teamSize / 2 :
                                    votes >= teamSize;

                if (shouldComplete) {
                    task.status = req.user.role === 'admin' ? 'completed' : 'review';
                } else {
                    task.status = 'in-progress';
                }
            } else {
                task.status = status;
            }
        } else {
            if (status === 'completed' && req.user.role !== 'admin') {
                task.status = 'review';
            } else {
                task.status = status;
            }
        }

        const newStatus = task.status;

        // History Logging & Automations
        if (newStatus !== priorStatus) {
            await logTaskHistory({
                taskId: task._id,
                userId: req.user.id,
                action: 'STATUS_UPDATE',
                field: 'status',
                oldValue: priorStatus,
                newValue: newStatus,
                details: `Status changed from ${priorStatus} to ${newStatus}`
            });

            await triggerAutomations(task._id, 'status_change', 'status', newStatus, req.user);
        }

        if (newStatus === 'completed' && priorStatus !== 'completed') {
            task.completedAt = new Date();
        } else if (newStatus !== 'completed') {
            task.completedAt = null;
        }

        await task.save();

        // Update Workload Score
        if ((newStatus === 'completed' || newStatus === 'review') && (priorStatus !== 'completed' && priorStatus !== 'review')) {
            if (task.assignedTo) await User.findByIdAndUpdate(task.assignedTo, { $inc: { workloadScore: -10 } });
        } else if ((newStatus !== 'completed' && newStatus !== 'review') && (priorStatus === 'completed' || priorStatus === 'review')) {
            if (task.assignedTo) await User.findByIdAndUpdate(task.assignedTo, { $inc: { workloadScore: 10 } });
        }

        // Update Workload Score on completion or reopening
        if (task.status === 'completed' || task.status === 'review') {
            if (task.assignedTo && priorStatus !== 'completed' && priorStatus !== 'review') {
                // Decrement score when task is newly completed
                await User.findByIdAndUpdate(task.assignedTo, { $inc: { workloadScore: -10 } });
            }
        } else if (task.status !== 'completed' && task.status !== 'review') {
            if (priorStatus === 'completed' || priorStatus === 'review') {
                // Task was reopened (was completed, now in-progress/pending)
                // Re-increment the workload score
                if (task.assignedTo) {
                    await User.findByIdAndUpdate(task.assignedTo, { $inc: { workloadScore: 10 } });
                }
            }
        }

        // Log if completed (or pending approval)
        if (status === 'completed') {
            await ActivityLog.create({
                action: 'TASK_COMPLETED',
                user: req.user.id,
                details: JSON.stringify({ taskId: task.id, title: task.title }),
                ipAddress: req.ip
            });

            // Notify admins/creators if it's not them doing it
            if (task.createdBy && task.createdBy.toString() !== req.user.id.toString()) {
                await createNotification({
                    recipient: task.createdBy,
                    type: 'completion',
                    title: 'Task Completed',
                    message: `Task "${task.title}" has been marked completed by a user.`,
                    relatedTask: task._id,
                    actionUrl: '/admin/tasks'
                });
            }
            // Slack Hook
            notifySlack(task, req.user);
        }

        try { getIo().emit('tasks_refresh'); } catch(e){}
        res.json({ message: 'Task updated', task });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update task' });
    }
};

// Add Time Log properly updating task loggedHours
export const addTimeLog = async (req, res) => {
    const { id } = req.params;
    const { hours, description } = req.body;

    try {
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // User must be authorized (admin, creator, or assignee)
        if (
            req.user.role !== 'admin' &&
            task.createdBy.toString() !== req.user.id.toString() &&
            task.assignedTo?.toString() !== req.user.id.toString()
        ) {
            return res.status(403).json({ message: 'Not authorized to log time on this task' });
        }

        task.loggedHours += parseFloat(hours);
        await task.save();

        // Log the time activity
        await ActivityLog.create({
            action: 'TIME_LOGGED',
            user: req.user.id,
            details: JSON.stringify({ taskId: task.id, title: task.title, hoursLogged: hours, description }),
            ipAddress: req.ip
        });

        res.json({ message: 'Time logged successfully', loggedHours: task.loggedHours, task });
    } catch (error) {
        console.error('Add time log error:', error);
        res.status(500).json({ message: 'Failed to log time' });
    }
};

// Toggle Goal Status
export const toggleGoal = async (req, res) => {
    const { goalId } = req.params;

    try {
        const goal = await Goal.findById(goalId).populate('task');
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        // Permission check
        const task = goal.task;
        if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Toggle status
        goal.isCompleted = !goal.isCompleted;
        goal.completedAt = goal.isCompleted ? new Date() : null;
        await goal.save();

        if (goal.isCompleted && goal.deadline) {
            const completedDate = new Date(goal.completedAt);
            completedDate.setHours(0,0,0,0);
            const deadlineDate = new Date(goal.deadline);
            deadlineDate.setHours(23,59,59,999);
            
            if (completedDate <= deadlineDate) {
                const pts = goal.rewardPoints || 0;
                if (pts > 0 && !goal.pointsAwarded) {
                    await User.findByIdAndUpdate(goal.user, {
                        $inc: { totalRewardPoints: pts },
                        $push: {
                            rewardHistory: {
                                taskId: goal.task._id,
                                taskTitle: `Goal: ${goal.title}`,
                                pointsAwarded: pts,
                                awardedBy: req.user.id,
                                awardedAt: new Date()
                            }
                        }
                    });
                    goal.pointsAwarded = true;
                    await goal.save();
                }
            }
        } else if (!goal.isCompleted && goal.pointsAwarded) {
            // Un-checked: deduct the points to fix the infinite glitch
            const pts = goal.rewardPoints || 0;
            if (pts > 0) {
                await User.findByIdAndUpdate(goal.user, {
                    $inc: { totalRewardPoints: -pts },
                    // Optionally remove the history log or add a negative one
                    $push: {
                        rewardHistory: {
                            taskId: goal.task._id,
                            taskTitle: `Unchecked Goal: ${goal.title}`,
                            pointsAwarded: -pts,
                            awardedBy: req.user.id,
                            awardedAt: new Date()
                        }
                    }
                });
                goal.pointsAwarded = false;
                await goal.save();
            }
        }

        // Check overall task status
        // We act on goal.task._id because goal.task is the populated Task document
        const allGoals = await Goal.find({ task: goal.task._id });
        const allCompleted = allGoals.length > 0 && allGoals.every(g => g.isCompleted);

        let taskStatus = task.status;
        if (allCompleted) {
            taskStatus = 'completed';

            // Log Task Completion only if it wasn't already completed
            if (task.status !== 'completed') {
                await ActivityLog.create({
                    action: 'TASK_COMPLETED',
                    user: req.user.id,
                    details: JSON.stringify({ taskId: goal.task._id, title: goal.task.title, method: 'auto-goal-complete' }),
                    ipAddress: req.ip
                });
                notifySlack(goal.task, req.user);
            }
        } else {
            // If task was completed but now isn't, revert to in-progress
            if (task.status === 'completed') {
                taskStatus = 'in-progress';
            } else if (task.status === 'pending' && goal.isCompleted) {
                // If checking the first goal, move to in-progress
                taskStatus = 'in-progress';
            }
        }

        // Update task status if changed
        if (taskStatus !== task.status) {
            const updateFields = { status: taskStatus };
            if (taskStatus === 'completed') updateFields.completedAt = new Date();
            else updateFields.completedAt = null;
            await Task.findByIdAndUpdate(goal.task._id, updateFields);
        }

        // Log Goal Action
        await ActivityLog.create({
            action: goal.isCompleted ? 'GOAL_COMPLETED' : 'GOAL_UNCOMPLETED',
            user: req.user.id,
            details: JSON.stringify({ goalId: goal.id, title: goal.title }),
            ipAddress: req.ip
        });

        try { getIo().emit('tasks_refresh'); } catch(e){}
        res.json({
            message: goal.isCompleted ? 'Goal completed! Great job! 🙂' : 'Goal status updated',
            goal,
            taskStatus
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update goal' });
    }
};

// Decompose Task (Magic Wand)
export const decomposeTask = async (req, res) => {
    const { id } = req.params;

    try {
        const task = await Task.findById(id).populate('goals');
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Logic to generate sub-tasks based on title
        const title = task.title.toLowerCase();
        let suggestions = [
            'Initial research and planning',
            'Draft first version',
            'Review and refine',
            'Final polish and verification'
        ];

        if (title.includes('landing') || title.includes('page') || title.includes('ui')) {
            suggestions = [
                'Analyze target audience & goals',
                'Create wireframes and layout sketch',
                'Design visual assets and components',
                'Implement responsive HTML/CSS',
                'Add interactive animations and transitions',
                'Cross-browser testing and optimization'
            ];
        } else if (title.includes('api') || title.includes('backend') || title.includes('database')) {
            suggestions = [
                'Design database schema and relationships',
                'Implement core API endpoints',
                'Add validation and error handling',
                'Write unit tests for business logic',
                'Document API endpoints (Swagger)',
                'Performance profiling and indexing'
            ];
        } else if (title.includes('fix') || title.includes('bug') || title.includes('issue')) {
            suggestions = [
                'Reproduce the issue in local environment',
                'Identify root cause in codebase',
                'Implement fix and verify locally',
                'Regression testing related features',
                'Submit PR and update documentation'
            ];
        }

        // Only add goals that don't already exist (simple check)
        const existingTitles = new Set(task.goals.map(g => g.title.toLowerCase()));
        const newGoals = suggestions.filter(s => !existingTitles.has(s.toLowerCase()));

        if (newGoals.length === 0) {
            return res.json({ message: 'Task is already well-defined!', task });
        }

        const goalData = newGoals.map(g => ({
            title: g,
            task: task.id,
            isCompleted: false
        }));

        const createdGoals = await Goal.insertMany(goalData);

        // Use $push to add new goal IDs to the task
        await Task.findByIdAndUpdate(id, {
            $push: { goals: { $each: createdGoals.map(g => g.id) } }
        });

        // Log Activity
        await ActivityLog.create({
            action: 'TASK_DECOMPOSED',
            user: req.user.id,
            details: JSON.stringify({ taskId: task.id, title: task.title, subTasks: newGoals.length }),
            ipAddress: req.ip
        });

        const updatedTask = await Task.findById(id).populate('goals');
        res.json({ message: `Magically added ${newGoals.length} sub-tasks! ✨`, task: updatedTask });

    } catch (error) {
        console.error('Decompose task error:', error);
        res.status(500).json({ message: 'The magic wand failed to cast its spell.' });
    }
};

export const awardPoints = async (req, res) => {
    const { taskId } = req.params;
    const { points } = req.body;

    try {
        const task = await Task.findById(taskId).populate('assignedTo');
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (task.status === 'completed' && task.rewardPoints > 0) {
            // Check if already awarded? 
            // We can check user history, but for now relies on status transition.
            // If already completed, admin might be re-awarding or adjusting.
            // Let's assume this strictly approves pending tasks or forcefully completion.
        }

        // Update task
        task.status = 'completed';
        task.completedAt = new Date();
        const finalPoints = points !== undefined ? points : task.rewardPoints;
        task.rewardPoints = finalPoints; // Update if changed by admin
        await task.save();

        // Update User
        if (task.assignedTo) {
            const userId = task.assignedTo._id || task.assignedTo;
            const user = await User.findById(userId);
            if (user) {
                user.totalRewardPoints = (user.totalRewardPoints || 0) + finalPoints;
                user.rewardHistory.push({
                    taskId: task._id,
                    taskTitle: task.title,
                    pointsAwarded: finalPoints,
                    awardedBy: req.user.id,
                    awardedAt: new Date()
                });
                await user.save();

                // Log Activity
                await ActivityLog.create({
                    action: 'POINTS_AWARDED',
                    user: req.user.id,
                    details: JSON.stringify({ taskId: task.id, userId: user.id, points: finalPoints }),
                    ipAddress: req.ip
                });

                try { getIo().emit('tasks_refresh'); } catch(e){}
                notifySlack(task, req.user);
                return res.json({ message: 'Points awarded successfully', task, totalPoints: user.totalRewardPoints });
            }
        }

        try { getIo().emit('tasks_refresh'); } catch(e){}
        notifySlack(task, req.user);
        res.json({ message: 'Task marked complete, but no user to award points to.', task });

    } catch (error) {
        console.error('Award points error:', error);
        res.status(500).json({ message: 'Failed to award points' });
    }
};

// Delete Task (Admin only)
export const deleteTask = async (req, res) => {
    const { id } = req.params;

    try {
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Decrement workload score if not completed
        if (task.status !== 'completed' && task.assignedTo) {
            await User.findByIdAndUpdate(task.assignedTo, { $inc: { workloadScore: -10 } });
        }

        await task.deleteOne();

        // Remove Task from Project if linked
        if (task.project) {
            await (await import('../models/Project.js')).default.findByIdAndUpdate(task.project, { $pull: { tasks: id } });
        }

        // Log Activity
        await ActivityLog.create({
            action: 'TASK_DELETED',
            user: req.user.id,
            details: JSON.stringify({ taskId: id, title: task.title }),
            ipAddress: req.ip
        });

        try { getIo().emit('tasks_refresh'); } catch(e){}
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Failed to delete task' });
    }
};

// Get Task By ID
export const getTaskById = async (req, res) => {
    const { id } = req.params;
    try {
        const task = await Task.findById(id)
            .populate('assignedTo', 'id name profilePicture')
            .populate('createdBy', 'id name')
            .populate('goals')
            .populate('project', 'name status');
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Failed to fetch task' });
    }
};

// Bulk Reassign Tasks (Admin)
export const bulkReassign = async (req, res) => {
    const { fromUserId, toUserId } = req.body;
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can perform bulk operations' });
        }
        
        const tasksToReassign = await Task.find({ assignedTo: fromUserId, status: { $ne: 'completed' }});
        
        if (tasksToReassign.length > 0) {
            await Task.updateMany({ assignedTo: fromUserId, status: { $ne: 'completed' } }, { assignedTo: toUserId });
            
            // Adjust workload score (rough estimate: 10 per active task)
            const tasksCount = tasksToReassign.length;
            await User.findByIdAndUpdate(fromUserId, { $inc: { workloadScore: - (tasksCount * 10) } });
            await User.findByIdAndUpdate(toUserId, { $inc: { workloadScore: tasksCount * 10 } });

            await (await import('../models/ActivityLog.js')).default.create({
                action: 'TASK_UPDATED',
                user: req.user.id,
                details: JSON.stringify({ action: 'bulk-reassign', from: fromUserId, to: toUserId, count: tasksCount }),
                ipAddress: req.ip
            });
            try { getIo().emit('tasks_refresh'); } catch(e){}
        }

        res.json({ message: `Successfully reassigned ${tasksToReassign.length} tasks.` });
    } catch (error) {
        console.error('Bulk reassign error:', error);
        res.status(500).json({ message: 'Failed to bulk reassign tasks' });
    }
};

// Get Archived Tasks (Role based)
export const getArchivedTasks = async (req, res) => {
    const { role, id } = req.user;

    try {
        let tasks;
        const populateOptions = [
            { path: 'assignedTo', select: 'id name profilePicture' },
            { path: 'createdBy', select: 'id name' },
            { path: 'project', select: 'name status' }
        ];

        if (role === 'admin') {
            tasks = await Task.find({ isArchived: true })
                .populate(populateOptions)
                .sort({ archivedAt: -1 });
        } else {
            tasks = await Task.find({ assignedTo: id, isArchived: true })
                .populate(populateOptions)
                .sort({ archivedAt: -1 });
        }

        res.json(tasks);
    } catch (error) {
        console.error('Get archived tasks error:', error);
        res.status(500).json({ message: 'Failed to fetch archived tasks' });
    }
};

// Archive Task Manually (Admin only)
export const archiveTask = async (req, res) => {
    const { id } = req.params;

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can archive tasks.' });
        }

        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        
        if (task.status !== 'completed') {
            return res.status(400).json({ message: 'Only completed tasks can be archived.' });
        }

        task.isArchived = true;
        task.archivedAt = new Date();
        task.archiveType = 'manual';
        await task.save();

        await ActivityLog.create({
            action: 'TASK_ARCHIVED',
            user: req.user.id,
            details: JSON.stringify({ taskId: task.id, title: task.title, archiveType: 'manual' }),
            ipAddress: req.ip
        });

        try { getIo().emit('tasks_refresh'); } catch(e){}
        res.json({ message: 'Task archived successfully', task });
    } catch (error) {
        console.error('Archive task error:', error);
        res.status(500).json({ message: 'Failed to archive task' });
    }
};

// Restore Archived Task (Admin only)
export const restoreTask = async (req, res) => {
    const { id } = req.params;

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can restore tasks.' });
        }

        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.isArchived = false;
        task.archivedAt = null;
        task.archiveType = null;
        await task.save();

        await ActivityLog.create({
            action: 'TASK_RESTORED',
            user: req.user.id,
            details: JSON.stringify({ taskId: task.id, title: task.title }),
            ipAddress: req.ip
        });

        try { getIo().emit('tasks_refresh'); } catch(e){}
        res.json({ message: 'Task restored successfully', task });
    } catch (error) {
        console.error('Restore task error:', error);
        res.status(500).json({ message: 'Failed to restore task' });
    }
};

// ── NEW: File Vault Controllers ──────────────────────────────

export const uploadTaskFile = async (req, res) => {
    const { id } = req.params;
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const attachment = {
            name: req.file.originalname,
            url: `/uploads/tasks/${req.file.filename}`,
            size: req.file.size,
            type: req.file.mimetype,
            uploadedBy: req.user.id
        };

        task.attachments.push(attachment);
        await task.save();

        await logTaskHistory({
            taskId: id,
            userId: req.user.id,
            action: 'FILE_UPLOAD',
            details: `Uploaded file: ${req.file.originalname}`
        });

        try { getIo().emit('tasks_refresh'); } catch(e){}
        res.status(201).json({ message: 'File uploaded successfully', attachment });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'Failed to upload file' });
    }
};

export const deleteTaskFile = async (req, res) => {
    const { id, fileId } = req.params;
    try {
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.attachments = task.attachments.filter(a => a._id.toString() !== fileId);
        await task.save();

        await logTaskHistory({
            taskId: id,
            userId: req.user.id,
            action: 'FILE_DELETED',
            details: `Deleted an attachment`
        });

        try { getIo().emit('tasks_refresh'); } catch(e){}
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete file' });
    }
};

// ── NEW: The Chronicle (Audit Trail) ─────────────────────────

export const getTaskHistory = async (req, res) => {
    const { id } = req.params;
    try {
        const history = await TaskHistory.find({ taskId: id })
            .populate('user', 'name profilePicture')
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch task history' });
    }
};

// ── NEW: Flow Automations ────────────────────────────────────

export const getAutomations = async (req, res) => {
    try {
        const automations = await Automation.find().populate('createdBy', 'name');
        res.json(automations);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch automations' });
    }
};

export const createAutomation = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const automation = new Automation({ ...req.body, createdBy: req.user.id });
        await automation.save();
        res.status(201).json(automation);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create automation' });
    }
};

export const deleteAutomation = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        await Automation.findByIdAndDelete(req.params.id);
        res.json({ message: 'Automation deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete automation' });
    }
};

