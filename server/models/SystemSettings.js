import mongoose from 'mongoose';

// Singleton document for org-wide settings
const systemSettingsSchema = new mongoose.Schema({
    defaultCompletionStrategy: {
        type: String,
        enum: ['synchronous', 'first-to-finish', 'majority'],
        default: 'synchronous'
    },
    maxProjectMembers: { type: Number, default: 20 },
    maxTeamSize: { type: Number, default: 15 },
    workloadThreshold: { type: Number, default: 80 }, // % at which overload warning fires
    customRoles: [{ type: String }],    // e.g. ['Designer', 'QA Engineer', ...]
    allowSelfAssign: { type: Boolean, default: false },
    requireTaskApproval: { type: Boolean, default: false },
    deadlineReminderDays: { type: Number, default: 2 },
    orgName: { type: String, default: 'My Organization' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
