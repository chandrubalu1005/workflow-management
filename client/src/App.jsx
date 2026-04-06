import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import AppLoader from './components/AppLoader';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FlowStateProvider } from './context/FlowStateContext';
import { GamificationProvider } from './context/GamificationContext';
import { SocketProvider } from './context/SocketContext';

// Eagerly loaded
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LevelUpOverlay from './components/LevelUpOverlay';

// Lazy loaded
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const Tasks = lazy(() => import('./pages/Tasks'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const Notes = lazy(() => import('./pages/Notes'));
const Profile = lazy(() => import('./pages/Profile'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const ResourceAllocation = lazy(() => import('./pages/ResourceAllocation'));
const Notifications = lazy(() => import('./pages/Notifications/index'));
const Settings = lazy(() => import('./pages/Settings/index'));
const MyWork = lazy(() => import('./pages/MyWork/index'));
const Templates = lazy(() => import('./pages/Templates/index'));
const Performance = lazy(() => import('./pages/Performance/index'));
const ActivityLogs = lazy(() => import('./pages/Logs/index'));
const Goals = lazy(() => import('./pages/Goals'));
const Reports = lazy(() => import('./pages/Reports'));
const Billing = lazy(() => import('./pages/Billing/index'));
const Workflows = lazy(() => import('./pages/Workflows/index'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const GanttPage = lazy(() => import('./pages/GanttPage'));
const CreateTaskPage = lazy(() => import('./pages/CreateTaskPage'));

import Logo from './components/Logo';

// High-fidelity SaaS boot sequence
function PageLoader() {
    return (
        <div style={{ 
            height: '100vh', width: '100vw', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            background: '#0B1220', position: 'fixed', inset: 0, zIndex: 9999 
        }}>
            <motion.div
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 1] }}
                transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                style={{ marginBottom: '2rem' }}
            >
                <Logo size="lg" animated={false} withText={false} />
            </motion.div>
            
            {/* Ambient loading track */}
            <div style={{
                width: '180px', height: '3px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', overflow: 'hidden',
                position: 'relative'
            }}>
                <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%',
                        background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)',
                        borderRadius: '10px'
                    }}
                />
            </div>
            
            <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}
            >
                System Initializing
            </motion.p>
        </div>
    );
}

const PageTransition = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ willChange: 'transform, opacity' }} // Motion Performance Optimization
    >
        {children}
    </motion.div>
);

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Suspense fallback={<PageLoader />}>
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
                    <Route path="/login" element={<Navigate to="/user-login" replace />} />
                    <Route path="/admin" element={<Navigate to="/admin-login" replace />} />
                    <Route path="/user-login" element={<PageTransition><Login /></PageTransition>} />
                    <Route path="/admin-login" element={<PageTransition><AdminLogin /></PageTransition>} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>

                            <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
                            <Route path="/analytics" element={<PageTransition><Analytics /></PageTransition>} />
                            <Route path="/tasks" element={<PageTransition><Tasks /></PageTransition>} />
                            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                                <Route path="/admin/tasks" element={<PageTransition><Tasks /></PageTransition>} />
                            </Route>
                            <Route path="/projects" element={<PageTransition><Projects /></PageTransition>} />
                            <Route path="/projects/:id" element={<PageTransition><ProjectDetails /></PageTransition>} />
                            <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
                            <Route path="/notes" element={<PageTransition><Notes /></PageTransition>} />
                            <Route path="/my-work" element={<PageTransition><MyWork /></PageTransition>} />
                            <Route path="/notifications" element={<PageTransition><Notifications /></PageTransition>} />
                            <Route path="/goals" element={<PageTransition><Goals /></PageTransition>} />
                            <Route path="/reports" element={<PageTransition><Reports /></PageTransition>} />
                            <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
                            <Route path="/templates" element={<PageTransition><Templates /></PageTransition>} />
                            <Route path="/performance" element={<PageTransition><Performance /></PageTransition>} />
                            <Route path="/calendar" element={<PageTransition><CalendarPage /></PageTransition>} />
                            <Route path="/gantt" element={<PageTransition><GanttPage /></PageTransition>} />
                            <Route path="/tasks/generate" element={<PageTransition><CreateTaskPage /></PageTransition>} />

                            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                                <Route path="/admin/users" element={<PageTransition><AdminPage /></PageTransition>} />
                                <Route path="/admin/logs" element={<PageTransition><ActivityLogs /></PageTransition>} />
                                <Route path="/admin/teams" element={<PageTransition><TeamManagement /></PageTransition>} />
                                <Route path="/resources" element={<PageTransition><ResourceAllocation /></PageTransition>} />
                                <Route path="/billing" element={<PageTransition><Billing /></PageTransition>} />
                                <Route path="/workflows" element={<PageTransition><Workflows /></PageTransition>} />
                            </Route>

                        </Route>
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </AnimatePresence>
    );
};

function App() {
    // Show the cinematic loader once per session
    const [booting, setBooting] = useState(() => !sessionStorage.getItem('wp_booted'));

    const handleBootComplete = () => {
        sessionStorage.setItem('wp_booted', '1');
        setBooting(false);
    };

    return (
        <ThemeProvider>
            <AuthProvider>
                <FlowStateProvider>
                    <AnimatePresence mode="wait">
                        {booting && <AppLoader key="apploader" onComplete={handleBootComplete} />}
                    </AnimatePresence>
                    <motion.div
                        initial={false}
                        animate={{ opacity: booting ? 0 : 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                            <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 99999 }}>
                                <Toaster position="top-right" toastOptions={{
                                    duration: 3000,
                                    style: {
                                        background: '#0f172a',
                                        color: '#f1f5f9',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                    }
                                }} />
                            </div>
                            <GamificationProvider>
                                <SocketProvider>
                                    <AnimatedRoutes />
                                </SocketProvider>
                            </GamificationProvider>
                        </BrowserRouter>
                    </motion.div>
                </FlowStateProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
