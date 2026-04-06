import './config/suppressWarnings.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { User } from './models/index.js';
import { ApiError } from './utils/apiError.js';

// Configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security Headers (Helmet) ───────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            scriptSrc: ["'self'", "'unsafe-eval'"], // Allow eval for Vite HMR
            imgSrc: ["'self'", 'data:', 'https:'],
            fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
            connectSrc: ["'self'", "*"], // Allow connections to any host in dev
        }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    noSniff: true,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ── CORS (Restricted to known origins) ─────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins in development for easy network access
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
}));


// ── HTTPS Enforcement (Production only) ─────────────────────────────────────
app.use((req, res, next) => {
    if (
        process.env.NODE_ENV === 'production' &&
        !req.secure &&
        req.get('x-forwarded-proto') !== 'https'
    ) {
        return res.redirect(301, 'https://' + req.get('host') + req.url);
    }
    next();
});

// ── Body Parsing + NoSQL Injection Protection ───────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(mongoSanitize()); // Strip $ and . from request body/params/query
app.use('/uploads', express.static(join(dirname(fileURLToPath(import.meta.url)), 'uploads')));

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import logRoutes from './routes/logRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import commentRoutes from './routes/commentRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/comments', commentRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Enterprise Workflow API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler (standardized)
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }

    // CORS errors
    if (err.message && err.message.startsWith('CORS:')) {
        return res.status(403).json({ success: false, message: err.message });
    }

    // Unexpected errors
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});


// Database Connection & Bootstrap
import connectDB from './config/database.js';
import initTaskArchiver from './cron/taskArchiver.js';

// ── Server Startup ──
import { networkInterfaces } from 'os';

const getNetworkIP = () => {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
};

import { initSocket } from './config/socket.js';

const server = app.listen(PORT, '0.0.0.0', () => {
    const ip = getNetworkIP();
    console.log('\n-----------------------------------------------------');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Local:   http://localhost:${PORT}`);
    console.log(`🌐 Network: http://${ip}:${PORT}`);
    console.log('-----------------------------------------------------\n');
});

// Initialize Socket.io
initSocket(server);

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Error: Port ${PORT} is already in use. Please stop the other process.`);
    } else {
        console.error('❌ Server failed to start:', err.message);
    }
});


// Run bootstrap in background so it doesn't block the API startup
const bootstrap = async () => {
    try {
        console.log('⌛ Connecting to database (3s timeout)...');
        // The connectDB function already has its own fallback for development
        await connectDB();
        try {
            initTaskArchiver();
        } catch (cronErr) {
            console.error('Failed to init cron tasks:', cronErr);
        }
    } catch (error) {
        console.warn('⚠️  Database connection skipped. Running in mock mode.');
    }
};

bootstrap();
