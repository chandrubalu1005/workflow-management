import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        required: true
    },
    isPrivate: {
        type: Boolean,
        default: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Note = mongoose.model('Note', noteSchema);

export default Note;
