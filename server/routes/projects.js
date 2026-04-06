import express from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { authenticate as auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all projects (with filtering)
router.get('/', auth, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        // If not admin, only show projects where user is manager or member
        if (req.user.role !== 'admin') {
            query.$or = [
                { manager: req.user._id },
                { members: req.user._id }
            ];
        }

        if (status) {
            query.status = status;
        }

        const projects = await Project.find(query)
            .populate('manager', 'name email')
            .populate('members', 'name email')
            .sort({ createdAt: -1 });

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('manager', 'name email')
            .populate('members', 'name email');

        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Access control
        if (req.user.role !== 'admin' &&
            project.manager.toString() !== req.user._id.toString() &&
            !project.members.some(m => m._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get tasks for this project
        const tasks = await Task.find({ project: project._id })
            .populate('assignedTo', 'name')
            .populate('createdBy', 'name');

        res.json({ project, tasks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create project
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, startDate, endDate, members, status } = req.body;

        const project = new Project({
            name,
            description,
            startDate,
            endDate,
            members,
            status,
            manager: req.user._id // Creator is manager by default
        });

        const savedProject = await project.save();
        res.status(201).json(savedProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update project
router.put('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Only manager or admin can update
        if (req.user.role !== 'admin' && project.manager.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this project' });
        }

        // Update fields
        const allowedUpdates = ['name', 'description', 'status', 'startDate', 'endDate', 'members', 'progress', 'budget', 'actualCost', 'currency'];
        allowedUpdates.forEach(update => {
            if (req.body[update] !== undefined) {
                project[update] = req.body[update];
            }
        });

        const updatedProject = await project.save();
        res.json(updatedProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (req.user.role !== 'admin' && project.manager.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this project' });
        }

        await project.deleteOne();
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
