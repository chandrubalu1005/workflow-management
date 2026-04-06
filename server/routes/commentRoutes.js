import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';

const router = express.Router();

// Get all comments for a task
router.get('/:taskId', protect, async (req, res) => {
    try {
        const comments = await Comment.find({ task: req.params.taskId })
            .populate('author', 'name email profilePicture')
            .sort({ createdAt: -1 });
            
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Server error fetching comments' });
    }
});

// Add a comment to a task
router.post('/:taskId', protect, async (req, res) => {
    try {
        const { content, projectId } = req.body;
        
        // Ensure task exists
        const task = await Task.findById(req.params.taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const comment = new Comment({
            content,
            author: req.user._id,
            task: req.params.taskId,
            project: projectId || task.project
        });

        const savedComment = await comment.save();
        
        // Populate author before returning
        await savedComment.populate('author', 'name email profilePicture');
        
        res.status(201).json(savedComment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Server error creating comment' });
    }
});

// Delete a comment
router.delete('/:id', protect, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Only author or admin can delete
        if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        await Comment.deleteOne({ _id: req.params.id });
        res.json({ message: 'Comment removed' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Server error deleting comment' });
    }
});

export default router;
