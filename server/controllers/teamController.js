import Team from '../models/Team.js';
import { User, ActivityLog } from '../models/index.js';

// GET /api/teams — list all teams (populated members + lead)
export const getTeams = async (req, res) => {
    try {
        const teams = await Team.find()
            .populate('members', 'name email avatar position role')
            .populate('lead', 'name email avatar')
            .sort({ createdAt: -1 });
        res.json(teams);
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ message: 'Failed to fetch teams' });
    }
};

// POST /api/teams — create team (admin)
export const createTeam = async (req, res) => {
    const { name, color, icon, description, maxCapacity } = req.body;

    try {
        if (!name) return res.status(400).json({ message: 'Team name is required' });

        const existing = await Team.findOne({ name });
        if (existing) return res.status(400).json({ message: 'Team name already exists' });

        const team = new Team({ name, color, icon, description, maxCapacity });
        await team.save();

        await ActivityLog.create({
            action: 'TEAM_CREATED',
            user: req.user.id,
            details: JSON.stringify({ teamId: team.id, name }),
            ipAddress: req.ip
        });

        res.status(201).json({ message: 'Team created', team });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ message: 'Failed to create team' });
    }
};

// PUT /api/teams/:id — update team
export const updateTeam = async (req, res) => {
    try {
        const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('members', 'name email avatar position')
            .populate('lead', 'name email avatar');
        if (!team) return res.status(404).json({ message: 'Team not found' });
        res.json({ message: 'Team updated', team });
    } catch (error) {
        console.error('Update team error:', error);
        res.status(500).json({ message: 'Failed to update team' });
    }
};

// DELETE /api/teams/:id — delete team
export const deleteTeam = async (req, res) => {
    try {
        const team = await Team.findByIdAndDelete(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        // Remove team reference from members
        await User.updateMany({ teamId: team.id }, { $unset: { teamId: '' } });

        await ActivityLog.create({
            action: 'TEAM_DELETED',
            user: req.user.id,
            details: JSON.stringify({ teamId: team.id, name: team.name }),
            ipAddress: req.ip
        });

        res.json({ message: 'Team deleted' });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ message: 'Failed to delete team' });
    }
};

// POST /api/teams/:id/members — add member(s)
export const addMembers = async (req, res) => {
    const { userIds } = req.body; // Array of user IDs

    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        const ids = Array.isArray(userIds) ? userIds : [userIds];

        // Filter out already-present members
        const newIds = ids.filter(id => !team.members.map(m => m.toString()).includes(id));

        if (team.members.length + newIds.length > team.maxCapacity) {
            return res.status(400).json({ message: `Team capacity exceeded. Max: ${team.maxCapacity}` });
        }

        team.members.push(...newIds);
        await team.save();

        // Update user's teamId
        await User.updateMany({ _id: { $in: newIds } }, { teamId: team.id });

        const populated = await Team.findById(team.id)
            .populate('members', 'name email avatar position')
            .populate('lead', 'name email avatar');

        res.json({ message: `${newIds.length} member(s) added`, team: populated });
    } catch (error) {
        console.error('Add members error:', error);
        res.status(500).json({ message: 'Failed to add members' });
    }
};

// DELETE /api/teams/:id/members/:userId — remove member
export const removeMember = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        team.members = team.members.filter(m => m.toString() !== req.params.userId);

        // If removed member was lead, clear lead
        if (team.lead && team.lead.toString() === req.params.userId) {
            team.lead = null;
        }

        await team.save();

        // Clear user's teamId
        await User.findByIdAndUpdate(req.params.userId, { $unset: { teamId: '' } });

        const populated = await Team.findById(team.id)
            .populate('members', 'name email avatar position')
            .populate('lead', 'name email avatar');

        res.json({ message: 'Member removed', team: populated });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ message: 'Failed to remove member' });
    }
};
