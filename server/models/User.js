import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'normal'],
        default: 'normal'
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active'
    },
    position: {
        type: String
    },
    yearsOfExperience: {
        type: Number,
        default: 0
    },
    age: {
        type: Number
    },
    avatar: {
        type: String, // URL/Path to the image
        default: null
    },
    bio: {
        type: String,
        default: ''
    },
    linkedin: {
        type: String,
        default: ''
    },
    github: {
        type: String,
        default: ''
    },
    portfolio: {
        type: String,
        default: ''
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
    workloadScore: {
        type: Number,
        default: 0,
        index: true
    },
    performanceScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    availability: {
        type: Boolean,
        default: true
    },
    jobRole: {
        type: String,
        default: ''
    },
    theme: {
        type: String,
        default: 'light'
    },
    accessibilityMode: {
        type: String,
        default: 'none'
    },
    mustChangePassword: {
        type: Boolean,
        default: false
    },
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    },
    activeSessions: [{
        type: String // Token or session identifiers
    }],
    lastLogin: {
        type: Date
    },
    deviceInfo: {
        type: String, // User Agent or simplified device name
        default: 'Unknown Device'
    },
    totalRewardPoints: {
        type: Number,
        default: 0
    },
    rewardHistory: [{
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        },
        taskTitle: String,
        pointsAwarded: Number,
        awardedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        awardedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to check password
userSchema.methods.validPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
