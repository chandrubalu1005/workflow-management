import { TaskHistory, Automation, User, Task, Notification } from '../models/index.js';
import { createNotification } from '../controllers/notificationController.js';
import { getIo } from '../config/socket.js';

/**
 * Logs a change to a task's history
 */
export const logTaskHistory = async ({ taskId, userId, action, field, oldValue, newValue, details }) => {
    try {
        await TaskHistory.create({
            taskId,
            user: userId,
            action,
            field,
            oldValue,
            newValue,
            details
        });
    } catch (error) {
        console.error('Failed to log task history:', error);
    }
};

/**
 * Checks and executes automations based on a trigger
 */
export const triggerAutomations = async (taskId, triggerType, field, value, reqUser) => {
    try {
        const automations = await Automation.find({ 
            isActive: true, 
            'trigger.type': triggerType,
            $or: [
                { 'trigger.field': field, 'trigger.value': value },
                { 'trigger.field': { $exists: false } } // for task_created
            ]
        });

        if (automations.length === 0) return;

        const task = await Task.findById(taskId).populate('assignedTo createdBy');
        if (!task) return;

        for (const auto of automations) {
            for (const action of auto.actions) {
                try {
                    if (action.type === 'assign_user') {
                        task.assignedTo = action.targetId;
                        await task.save();
                        await logTaskHistory({
                            taskId: task._id,
                            userId: reqUser?.id || auto.createdBy,
                            action: 'AUTOMATION_ASSIGN',
                            details: `Auto-assigned via logic relay: ${auto.name}`
                        });
                    } 
                    else if (action.type === 'change_status') {
                        task.status = action.value;
                        await task.save();
                        await logTaskHistory({
                            taskId: task._id,
                            userId: reqUser?.id || auto.createdBy,
                            action: 'AUTOMATION_STATUS',
                            details: `Status auto-changed to ${action.value} via node: ${auto.name}`
                        });
                    }
                    else if (action.type === 'set_priority') {
                        task.priority = action.value;
                        await task.save();
                        await logTaskHistory({
                            taskId: task._id,
                            userId: reqUser?.id || auto.createdBy,
                            action: 'AUTOMATION_PRIORITY',
                            details: `Priority recalibrated to ${action.value} via relay: ${auto.name}`
                        });
                    }
                    else if (action.type === 'notify_user') {
                        const targetRecipient = action.targetId || task.assignedTo || task.createdBy;
                        if (targetRecipient) {
                            await createNotification({
                                recipient: targetRecipient,
                                type: 'automation',
                                title: 'Neural Flow Triggered',
                                message: `Execution of "${auto.name}" on task: ${task.title}`,
                                relatedTask: task._id,
                                actionUrl: '/tasks'
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Action execution in ${auto.name} failed:`, err);
                }
            }
        }

        try { getIo().emit('tasks_refresh'); } catch(e){}
    } catch (error) {
        console.error('Trigger automations error:', error);
    }
};
