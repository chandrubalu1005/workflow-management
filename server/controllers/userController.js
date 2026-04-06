import { User, ActivityLog } from '../models/index.js';
import bcrypt from 'bcrypt';

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

// Create a new user (Admin only)
export const createUser = async (req, res) => {
    const { name, email, age, position, role, yearsOfExperience, password } = req.body;

    try {
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Use provided password or fallback to default (though UI should enforce it)
        const finalPassword = password || 'Welcome123!';

        const newUser = new User({
            name,
            email,
            password: finalPassword,
            role: role || 'normal',
            position,
            age,
            yearsOfExperience,
            mustChangePassword: true
        });

        await newUser.save();

        // Log Activity
        await ActivityLog.create({
            action: 'USER_CREATED',
            user: req.user.id, // Admin who created
            details: JSON.stringify({ createdUserId: newUser.id, name: newUser.name }),
            ipAddress: req.ip
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Failed to create user' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        // Ensure user obj exists from middleware
        if (!req.user || (!req.user._id && !req.user.id)) {
            return res.status(401).json({ message: 'Not authorized, user profile missing in request' });
        }

        const userId = req.user._id || req.user.id;
        const { name, theme, bio, linkedin, github, portfolio } = req.body;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found in database' });
        }

        // Update allowed fields
        if (name !== undefined) user.name = name;
        if (theme !== undefined) user.theme = theme;
        if (bio !== undefined) user.bio = bio;
        if (linkedin !== undefined) user.linkedin = linkedin;
        if (github !== undefined) user.github = github;
        if (portfolio !== undefined) user.portfolio = portfolio;

        if (req.user.role === 'admin') {
            if (req.body.status) user.status = req.body.status;
            if (req.body.yearsOfExperience !== undefined) user.yearsOfExperience = req.body.yearsOfExperience;
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                theme: user.theme,
                status: user.status,
                bio: user.bio,
                linkedin: user.linkedin,
                github: user.github,
                portfolio: user.portfolio,
                yearsOfExperience: user.yearsOfExperience,
                avatar: user.avatar // Ensure avatar is returned
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
};

// Upload Avatar
export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.user.id;
        // Construct URL
        const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.avatar = avatarUrl;
        await user.save();

        res.json({
            message: 'Avatar uploaded successfully',
            avatar: avatarUrl,
            user: {
                ...user.toObject(),
                avatar: avatarUrl
            }
        });

    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ message: 'Failed to upload avatar' });
    }
};
// Get User Rewards
export const getRewards = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('totalRewardPoints rewardHistory');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Sort history by date desc
        user.rewardHistory.sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt));

        res.json({
            totalPoints: user.totalRewardPoints,
            history: user.rewardHistory
        });
    } catch (error) {
        console.error('Get rewards error:', error);
        res.status(500).json({ message: 'Failed to fetch rewards' });
    }
};

// Get Reward Stats (Admin)
export const getRewardStats = async (req, res) => {
    try {
        const users = await User.find({ role: 'normal' })
            .select('name totalRewardPoints avatar')
            .sort({ totalRewardPoints: -1 })
            .limit(10);

        const totalPointsDistributed = await User.aggregate([
            { $group: { _id: null, total: { $sum: '$totalRewardPoints' } } }
        ]);

        res.json({
            leaderboard: users,
            totalDistributed: totalPointsDistributed[0]?.total || 0
        });
    } catch (error) {
        console.error('Get reward stats error:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};
// --- Admin Specific Operations ---

// Reset User Password (Admin Only)
export const resetUserPassword = async (req, res) => {
    const { userId, mode } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let result = {};

        if (mode === 'email') {
            const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            user.resetToken = resetToken;
            user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
            await user.save();

            // In a real app, send email here. For now, return token or success.
            result = { message: 'Reset link generated and saved successfully' };
        } else if (mode === 'temporary') {
            const tempPassword = Math.random().toString(36).slice(-10); // Simple random string
            user.password = tempPassword;
            user.mustChangePassword = true;
            await user.save();

            result = {
                message: 'Temporary password generated successfully',
                tempPassword // Show only once
            };
        } else if (mode === 'manual') {
            if (!req.body.password) return res.status(400).json({ message: 'Password is required for manual reset' });
            user.password = req.body.password;
            user.mustChangePassword = false;
            await user.save();
            result = { message: `Password for ${user.name} has been updated successfully` };
        } else {
            return res.status(400).json({ message: 'Invalid reset mode' });
        }

        // Audit Log
        await ActivityLog.create({
            action: 'ADMIN_RESET_PASSWORD',
            user: req.user.id,
            details: JSON.stringify({ targetUserId: user.id, targetUserName: user.name, mode }),
            ipAddress: req.ip
        });

        res.json(result);

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Failed to reset password' });
    }
};

// Force Logout (Admin Only)
export const forceLogoutUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.activeSessions = []; // Invalidate all sessions
        await user.save();

        // Audit Log
        await ActivityLog.create({
            action: 'ADMIN_FORCE_LOGOUT',
            user: req.user.id,
            details: JSON.stringify({ targetUserId: user.id, targetUserName: user.name }),
            ipAddress: req.ip
        });

        res.json({ message: `Successfully forced logout for ${user.name}` });

    } catch (error) {
        console.error('Force logout error:', error);
        res.status(500).json({ message: 'Failed to force logout' });
    }
};

// Toggle Account Status (Admin Only)
export const toggleUserAccountStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'disabled'

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!['active', 'disabled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        user.status = status;
        await user.save();

        // Audit Log
        await ActivityLog.create({
            action: status === 'disabled' ? 'ADMIN_DISABLE_ACCOUNT' : 'ADMIN_ENABLE_ACCOUNT',
            user: req.user.id,
            details: JSON.stringify({ targetUserId: user.id, targetUserName: user.name }),
            ipAddress: req.ip
        });

        res.json({ message: `Account for ${user.name} is now ${status}`, status: user.status });

    } catch (error) {
        console.error('Toggle account status error:', error);
        res.status(500).json({ message: 'Failed to toggle account status' });
    }
};

// Set Activity Logs for specific user (Admin Only)
export const getUserActivityLogs = async (req, res) => {
    const { id } = req.params;

    try {
        const logs = await ActivityLog.find({
            $or: [
                { user: id }, // Logs created by this user
                { details: new RegExp(id) } // Logs where this user is the target (targetUserId)
            ]
        }).sort({ createdAt: -1 }).limit(100);

        res.json(logs);
    } catch (error) {
        console.error('Fetch user activity logs error:', error);
        res.status(500).json({ message: 'Failed to fetch activity logs' });
    }
};

// Update User (Admin Only - Edit any user)
export const adminUpdateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, position, role, yearsOfExperience, status } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (position) user.position = position;
        if (role) user.role = role;
        if (yearsOfExperience) user.yearsOfExperience = yearsOfExperience;
        if (status) user.status = status;

        await user.save();

        // Audit Log
        await ActivityLog.create({
            action: 'USER_UPDATED',
            user: req.user.id,
            details: JSON.stringify({ targetUserId: user.id, targetUserName: user.name, fields: Object.keys(req.body) }),
            ipAddress: req.ip
        });

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Admin update user error:', error);
        res.status(500).json({ message: 'Failed to update user' });
    }
};

// Delete User (Admin Only)
export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent self-deletion
        if (id === req.user.id) {
            return res.status(400).json({ message: 'You cannot delete your own admin account' });
        }

        await User.findByIdAndDelete(id);

        // Audit Log
        await ActivityLog.create({
            action: 'USER_DELETED',
            user: req.user.id,
            details: JSON.stringify({ targetUserId: id, targetUserName: user.name }),
            ipAddress: req.ip
        });

        res.json({ message: `Successfully deleted user ${user.name}` });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
};
