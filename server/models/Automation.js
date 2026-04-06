import mongoose from 'mongoose';

const automationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    trigger: {
        type: {
            type: String,
            enum: ['status_change', 'priority_change', 'deadline_breached', 'task_created'],
            required: true
        },
        field: { type: String }, // e.g. "status"
        value: { type: mongoose.Schema.Types.Mixed } // e.g. "review"
    },
    actions: [{
        type: {
            type: String,
            enum: ['assign_user', 'change_status', 'notify_user', 'notify_slack', 'set_priority'],
            required: true
        },
        targetId: { type: mongoose.Schema.Types.ObjectId, refPath: 'actions.targetModel' },
        targetModel: { type: String, enum: ['User', 'Team', 'Project'], default: 'User' },
        value: { type: mongoose.Schema.Types.Mixed } // e.g. "critical" or "completed"
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Automation = mongoose.model('Automation', automationSchema);
export default Automation;
