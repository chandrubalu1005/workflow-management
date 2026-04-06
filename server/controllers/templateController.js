import { Template, Project, Task } from '../models/index.js';

// GET /api/templates
export const getTemplates = async (req, res) => {
    try {
        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
        const templates = await Template.find(filter)
            .populate('createdBy', 'name avatar')
            .sort('-createdAt');
        res.json(templates);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/templates/:id
export const getTemplateById = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id).populate('createdBy', 'name avatar');
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/templates
export const createTemplate = async (req, res) => {
    try {
        const template = await Template.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json(template);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/templates/:id
export const updateTemplate = async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/templates/:id
export const deleteTemplate = async (req, res) => {
    try {
        await Template.findByIdAndDelete(req.params.id);
        res.json({ message: 'Template deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/templates/:id/duplicate
export const duplicateTemplate = async (req, res) => {
    try {
        const original = await Template.findById(req.params.id).lean();
        if (!original) return res.status(404).json({ message: 'Template not found' });
        const { _id, createdAt, updatedAt, usageCount, ...rest } = original;
        const copy = await Template.create({ ...rest, name: `${rest.name} (Copy)`, createdBy: req.user._id, usageCount: 0 });
        res.status(201).json(copy);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/templates/:id/use  — create a project from template
export const useTemplate = async (req, res) => {
    try {
        const { variables = {} } = req.body || {};
        const template = await Template.findByIdAndUpdate(req.params.id, { $inc: { usageCount: 1 } }, { new: true });
        if (!template) return res.status(404).json({ message: 'Template not found' });

        // Helper function to replace variables in strings
        const applyVariables = (str) => {
            if (!str) return str;
            let result = str;
            Object.keys(variables).forEach(key => {
                const regex = new RegExp(`\\[${key}\\]`, 'g');
                result = result.replace(regex, variables[key]);
            });
            return result;
        };

        // Create the project
        const project = await Project.create({
            name: applyVariables(`${template.name} - ${new Date().toLocaleDateString()}`),
            description: applyVariables(template.description) || 'Project created from template',
            manager: req.user._id,
            status: 'planning',
            members: [req.user._id]
        });

        // Create tasks if template has them
        if (template.tasks && template.tasks.length > 0) {
            const tasksToCreate = template.tasks.map(t => ({
                title: applyVariables(t.title),
                description: applyVariables(t.description) || `Created from template: ${template.name}`,
                priority: t.priority || 'medium',
                status: 'pending',
                project: project._id,
                createdBy: req.user._id,
                endDate: t.estimatedDays ? new Date(Date.now() + t.estimatedDays * 86400000) : null,
                assignment: { type: 'individual' }
            }));
            await Task.insertMany(tasksToCreate);
        }

        res.json({ project, message: 'Project deployed successfully from template' });
    } catch (err) {
        console.error('Template deploy error:', err);
        res.status(500).json({ message: err.message });
    }
};
