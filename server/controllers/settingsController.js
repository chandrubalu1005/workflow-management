import SystemSettings from '../models/SystemSettings.js';

// GET /api/settings
export const getSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) settings = await SystemSettings.create({});
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/settings
export const updateSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) settings = new SystemSettings();
        Object.assign(settings, req.body);
        settings.updatedBy = req.user._id;
        await settings.save();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
