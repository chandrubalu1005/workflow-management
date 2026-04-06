import jwt from 'jsonwebtoken';
import { User, ActivityLog } from '../models/index.js';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_enterprise_key_change_me';

export const login = async (req, res) => {
    const { email, password, intendedRole } = req.body;

    try {
        const user = await User.findOne({ email });
        
        if (!user || user.status === 'disabled') {
            return res.status(401).json({ message: 'Invalid credentials or account disabled' });
        }

        const isMatch = await user.validPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // --- Role Verification ---
        if (intendedRole === 'admin' && user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admin credentials required' });
        }
        if (intendedRole === 'user' && user.role === 'admin') {
            return res.status(403).json({ message: 'Access denied: Please use the admin login portal' });
        }

        user.lastLogin = new Date();
        user.deviceInfo = req.headers['user-agent'] || 'Unknown Device';
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const userObj = user.toObject();
        delete userObj.password;

        return res.json({
            message: "Login successful",
            token,
            user: userObj
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login' });
    }
};



export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('getMe error:', error);
        res.status(500).json({ message: 'Server error retrieving profile' });
    }
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.validPassword(currentPassword);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

        user.password = newPassword;
        user.mustChangePassword = false;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('changePassword error:', error);
        res.status(500).json({ message: 'Server error updating password' });
    }
};
