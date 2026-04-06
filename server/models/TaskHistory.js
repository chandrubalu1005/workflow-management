import mongoose from 'mongoose';

const taskHistorySchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String, // e.g., "STATUS_UPDATE", "PRIORITY_CHANGE", "ASSIGNMENT"
        required: true
    },
    field: {
        type: String // The field that was changed
    },
    oldValue: {
        type: mongoose.Schema.Types.Mixed
    },
    newValue: {
        type: mongoose.Schema.Types.Mixed
    },
    details: {
        type: String // Human readable summary
    }
}, {
    timestamps: true
});

const TaskHistory = mongoose.model('TaskHistory', taskHistorySchema);
export default TaskHistory;
