import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'blocked', 'review'],
        default: 'pending',
        index: true
    },
    completionMode: {
        type: String,
        enum: ['individual', 'synchronous', 'first-to-finish', 'majority'],
        default: 'individual'
    },
    order: {
        type: Number,
        default: 0
    },
    rewardPoints: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date,
        index: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    assignment: {
        type: {
            type: String,
            enum: ['individual', 'team'],
            default: 'individual'
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'assignment.targetModel'
        },
        targetModel: {
            type: String,
            enum: ['User', 'Team'],
            required: true,
            default: 'User'
        },
        strategy: {
            type: String,
            enum: ['synchronous', 'first-to-finish', 'majority'],
            default: 'synchronous'
        },
        members: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
        }]
    },
    acknowledgedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        index: true
    },
    parentTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null,
        index: true
    },
    subtasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    estimatedHours: {
        type: Number,
        default: 0,
        min: 0
    },
    loggedHours: {
        type: Number,
        default: 0,
        min: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    goals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal'
    }],
    completedAt: {
        type: Date
    },
    isArchived: {
        type: Boolean,
        default: false,
        index: true
    },
    archivedAt: {
        type: Date
    },
    archiveType: {
        type: String,
        enum: ['auto', 'manual']
    },
    attachments: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number },
        type: { type: String },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now }
    }],
    customFields: [{
        key: { type: String, required: true },
        value: { type: mongoose.Schema.Types.Mixed },
        type: { type: String, enum: ['text', 'number', 'date', 'select'], default: 'text' }
    }]
}, {
    timestamps: true
});

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ project: 1, order: 1 });
taskSchema.index({ endDate: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;

