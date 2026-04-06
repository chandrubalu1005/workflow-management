import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['assignment', 'deadline', 'overload', 'team_update', 'system', 'completion', 'reassignment'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    relatedTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    actionUrl: { type: String, default: null }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
