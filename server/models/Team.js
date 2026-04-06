import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    color: {
        type: String,
        default: '#A855F7'
    },
    icon: {
        type: String,
        default: '👥'
    },
    description: {
        type: String,
        default: ''
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    maxCapacity: {
        type: Number,
        default: 10
    }
}, {
    timestamps: true
});

// Virtual: member count
teamSchema.virtual('memberCount').get(function () {
    return this.members ? this.members.length : 0;
});

// Virtual: is full
teamSchema.virtual('isFull').get(function () {
    return this.members && this.members.length >= this.maxCapacity;
});

teamSchema.set('toJSON', { virtuals: true });
teamSchema.set('toObject', { virtuals: true });

const Team = mongoose.model('Team', teamSchema);

export default Team;
