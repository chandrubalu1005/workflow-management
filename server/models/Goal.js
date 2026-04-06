import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deadline: {
        type: Date
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    rewardPoints: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    },
    pointsAwarded: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
