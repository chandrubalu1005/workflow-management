import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
    process.exit(1);
}

export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || user.status === 'disabled') {
            return res.status(401).json({ message: 'Not authorized, user not found or disabled' });
        }

        req.user = user;
        return next();
    } catch (error) {
        console.warn('Invalid token', error.message);
        return res.status(401).json({ message: 'Not authorized, token validation failed' });
    }
};

export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    next();
};

// Aliases used by some routes
export const protect = authenticate;
export const adminOnly = requireAdmin;
export const authorize = requireAdmin;
