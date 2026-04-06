import { Note } from '../models/index.js';
import { getIo } from '../config/socket.js';

// Get user's notes
export const getNotes = async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id }).sort({ updatedAt: -1 });
        res.json(notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch notes' });
    }
};

// Create or Update Note (Auto-save logic usually sends ID if exists)
export const saveNote = async (req, res) => {
    const { id, title, content } = req.body;

    try {
        let note;
        if (id) {
            // Update existing
            note = await Note.findOne({ _id: id, user: req.user.id });
            if (!note) return res.status(404).json({ message: 'Note not found' });

            if (title !== undefined) note.title = title;
            note.content = content;
            await note.save();
        } else {
            // Create new
            note = new Note({
                title: title || '',
                content,
                user: req.user.id,
                isPrivate: true
            });
            await note.save();
        }

        try { getIo().emit('notes_refresh', req.user.id); } catch(e){}
        res.json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to save note' });
    }
};

// Delete Note
export const deleteNote = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Note.deleteOne({ _id: id, user: req.user.id });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Note not found' });
        try { getIo().emit('notes_refresh', req.user.id); } catch(e){}
        res.json({ message: 'Note deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete note' });
    }
}
