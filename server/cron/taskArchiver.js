import cron from 'node-cron';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';
import { getIo } from '../config/socket.js';

const initTaskArchiver = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('Running Task Archiver Job...');

            // 48 hours ago
            const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

            // Find completed, non-archived tasks with a completedAt older than 48 hours
            const tasksToArchive = await Task.find({
                status: 'completed',
                isArchived: { $ne: true },
                completedAt: { $lte: cutoffDate }
            });

            if (tasksToArchive.length > 0) {
                console.log(`Found ${tasksToArchive.length} tasks to auto-archive.`);

                let archivedCount = 0;
                for (const task of tasksToArchive) {
                    task.isArchived = true;
                    task.archivedAt = new Date();
                    task.archiveType = 'auto';
                    await task.save();

                    await ActivityLog.create({
                        action: 'TASK_ARCHIVED',
                        user: task.createdBy || task.assignedTo || null, // Auto action, so attribute loosely
                        details: JSON.stringify({ taskId: task.id, title: task.title, archiveType: 'auto' }),
                        ipAddress: 'cron-job'
                    });

                    archivedCount++;
                }

                console.log(`Successfully auto-archived ${archivedCount} tasks.`);

                try { 
                    getIo().emit('tasks_refresh');
                } catch(e) {
                    // Socket might not be available, safe to ignore
                }
            } else {
                console.log('No tasks met auto-archive criteria.');
            }
        } catch (error) {
            console.error('Error in Task Archiver Job:', error);
        }
    });

    console.log('Task Archiver cron job initialized.');
};

export default initTaskArchiver;
