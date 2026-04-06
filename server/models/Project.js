import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'on-hold', 'archived', 'planning'],
        default: 'active',
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        index: true
    },
    healthStatus: {
        type: String,
        enum: ['on-track', 'at-risk', 'delayed', 'completed'],
        default: 'on-track'
    },
    ownerType: {
        type: String,
        enum: ['individual', 'team'],
        default: 'individual'
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    budget: {
        type: Number,
        default: 0,
        min: 0
    },
    actualCost: {
        type: Number,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD'
    },
    roadmap: [{
        title: { type: String, required: true },
        date: { type: Date, required: true },
        status: { type: String, enum: ['planned', 'in-progress', 'completed'], default: 'planned' },
        description: { type: String }
    }],
    customFields: [{
        key: { type: String, required: true },
        value: { type: mongoose.Schema.Types.Mixed },
        type: { type: String, enum: ['text', 'number', 'date', 'select'], default: 'text' }
    }]
}, {
    timestamps: true
});

projectSchema.index({ status: 1, priority: 1 });
projectSchema.index({ endDate: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;

