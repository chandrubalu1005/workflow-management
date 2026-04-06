import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    action: {
        type: String, // e.g., "LOGIN", "TASK_CREATED", "GOAL_COMPLETED"
        required: true
    },
    details: {
        type: String // JSON string or human readable text
    },
    ipAddress: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
