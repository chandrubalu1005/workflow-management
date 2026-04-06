import mongoose from 'mongoose';

const templateTaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    defaultRole: { type: String, default: '' }, // e.g. 'Designer'
    estimatedDays: { type: Number, default: 1 },
    completionMode: {
        type: String,
        enum: ['individual', 'synchronous', 'first-to-finish', 'majority'],
        default: 'individual'
    },
    order: { type: Number, default: 0 },
    dependencies: [{ type: String }] // IDs or titles of tasks this task block depends on
}, { _id: true });

const templateSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    icon: { type: String, default: '📋' },
    color: { type: String, default: '#3B82F6' },
    tasks: [templateTaskSchema],
    defaultRoles: [{ type: String }],
    variables: [{
        name: { type: String, required: true },
        description: { type: String, default: '' },
        defaultValue: { type: String, default: '' }
    }],
    isDraft: { type: Boolean, default: false },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 }
}, { timestamps: true });

const Template = mongoose.model('Template', templateSchema);
export default Template;
