import { useState, useMemo, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFlowState } from '../context/FlowStateContext';
import { useGamification } from '../context/GamificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from './MagneticButton';
import PomodoroTimer from './PomodoroTimer';
import CommandPalette from './CommandPalette';
import Presence from './Presence';
import {
    LayoutDashboard, CheckSquare, FolderOpen, User,
    FileText, LogOut, Users, ChevronLeft, ChevronRight,
    Activity, Shield, Bell, Sun, Moon, Zap, Wind, Clock,
    BarChart2, Database, Settings, Briefcase, Layout as LayoutIcon, Award,
    Search, X, Menu, Target, Home, PlusCircle, Calendar
} from 'lucide-react';

const PAGE_TITLES = {
    '/dashboard': { label: 'Dashboard', sub: 'Your workspace at a glance' },
    '/analytics': { label: 'Analytics', sub: 'Performance & velocity insights' },
    '/my-work': { label: 'My Work', sub: 'Your tasks and focus board' },
    '/tasks': { label: 'Tasks', sub: 'Manage and track assignments' },
    '/projects': { label: 'Projects', sub: 'Initiatives and goals' },
    '/performance': { label: 'Performance', sub: 'Team rankings & efficiency' },
    '/notifications': { label: 'Notifications', sub: 'Real-time alerts' },
    '/notes': { label: 'Notes', sub: 'Your personal notepad' },
    '/profile': { label: 'Profile', sub: 'Your account & achievements' },
    '/admin/users': { label: 'User Management', sub: 'Manage team members' },
    '/admin/tasks': { label: 'Task Manager', sub: 'System-wide task management' },
    '/admin/teams': { label: 'Teams', sub: 'Team structure & rosters' },
    '/admin/logs': { label: 'Activity Logs', sub: 'System audit trail' },
    '/resources': { label: 'Resources', sub: 'Allocation & capacity' },
    '/settings': { label: 'Settings', sub: 'System configuration' },
    '/templates': { label: 'Templates', sub: 'Reusable workflow blueprints' },
    '/goals': { label: 'Goals', sub: 'Objectives and Key Results' },
    '/reports': { label: 'Reports', sub: 'Detailed Analytics & Export' },
    '/calendar': { label: 'The Chronicle', sub: 'Temporal workflow landscape' },
    '/gantt': { label: 'The Compass', sub: 'Strategic project roadmaps' },
};

const LiveClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontFamily: 'Inter, sans-serif' }}>
                {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
        </div>
    );
};

const SoundWave = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
        {[0.4, 0.7, 0.5, 0.9, 0.6, 0.4, 0.8].map((speed, i) => (
            <motion.div
                key={i}
                animate={{ height: ['4px', '14px', '4px'] }}
                transition={{ duration: speed, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: '2px', background: '#F59E0B', borderRadius: '1px' }}
            />
        ))}
    </div>
);

const BackgroundHeatmap = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        style={{
            position: 'fixed', inset: 0, zIndex: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.2), transparent 70%)',
            pointerEvents: 'none'
        }}
    >
        <motion.div
            animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: '20%', left: '30%', width: '40%', height: '40%', background: '#F59E0B', filter: 'blur(100px)', borderRadius: '50%' }}
        />
    </motion.div>
);

/* ── Nav Item ────────────────────────────────────────────── */
const NavItem = ({ to, icon: Icon, label, isCollapsed }) => (
    <NavLink to={to} style={{ textDecoration: 'none' }}>
        {({ isActive }) => (
            <motion.div
                layout
                whileHover={{
                    x: 3,
                    backgroundColor: isActive ? 'rgba(245,158,11,0.22)' : 'rgba(245,158,11,0.08)',
                }}
                style={{
                    display: 'flex', alignItems: 'center',
                    padding: '0.75rem 0.5rem',
                    margin: '0.1rem 0.6rem',
                    borderRadius: '12px',
                    position: 'relative', overflow: 'hidden',
                    background: isActive ? 'rgba(245,158,11,0.18)' : 'transparent',
                    cursor: 'pointer',
                    willChange: 'transform, opacity, background',
                    transition: 'background 0.2s, box-shadow 0.2s ease-out'
                }}
            >
                {/* Active Indicator Bar with enhanced glow */}
                {isActive && (
                    <motion.div
                        layoutId="activeSideBar"
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.28, ease: [0.16,1,0.3,1] }}
                        style={{
                            position: 'absolute', left: 0, width: '3px', height: '65%',
                            background: 'linear-gradient(180deg, #FBBF24, #F59E0B)',
                            borderRadius: '0 3px 3px 0',
                            boxShadow: '0 0 12px rgba(245,158,11,0.6)'
                        }}
                    />
                )}

                {/* Icon Container with hover glow */}
                <div style={{ width: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    <motion.div 
                        whileHover={{ scale: 1.15, rotate: 3 }} 
                        transition={{ duration: 0.2, type: 'spring', stiffness: 400 }}
                    >
                        <Icon
                            size={18}
                            color={isActive ? '#FBBF24' : 'var(--sidebar-text)'}
                            style={{ 
                                transition: 'color 0.2s, filter 0.2s', 
                                filter: isActive ? 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' : 'drop-shadow(0 0 0px transparent)'
                            }}
                        />
                    </motion.div>
                </div>
                
                {/* Label with stagger animation */}
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            style={{
                                fontSize: '0.9rem',
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? '#FBBF24' : 'var(--sidebar-text)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                fontFamily: 'Inter, sans-serif',
                                letterSpacing: isActive ? '0.02em' : '0em',
                                transition: 'color 0.2s, letter-spacing 0.2s'
                            }}
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Invisible hover zone for better UX */}
                {isActive && !isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(circle at right, rgba(245,158,11,0.1), transparent)',
                            borderRadius: '12px',
                            pointerEvents: 'none'
                        }}
                    />
                )}
            </motion.div>
        )}
    </NavLink>
);

const API = import.meta.env.VITE_API_URL;

const NotificationBell = ({ navigate }) => {
    const [count, setCount] = useState(0);
    const intervalRef = useRef(null);

    const fetchCount = async () => {
        try {
            const res = await fetch(`${API}/api/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCount(data?.count || 0);
            }
        } catch (_) { /* silently ignore */ }
    };

    useEffect(() => {
        fetchCount();
        intervalRef.current = setInterval(fetchCount, 30000);
        return () => clearInterval(intervalRef.current);
    }, []);

    return (
        <motion.button
            onClick={() => navigate('/notifications')}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '10px', background: 'var(--glass-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={16} />
            {count > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', minWidth: '16px', height: '16px', borderRadius: '8px', background: '#EF4444', color: '#fff', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxShadow: '0 0 0 2px var(--color-bg-main)' }}>
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </motion.button>
    );
};

/* ── Nav Group ───────────────────────────────────────────── */
const NavGroup = ({ group, isSidebarCollapsed }) => {
    const [isGroupCollapsed, setIsGroupCollapsed] = useState(false);
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{ marginBottom: isSidebarCollapsed ? '0.25rem' : '1rem' }}
        >
            <AnimatePresence>
                {!isSidebarCollapsed && (
                    <motion.div 
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.25, delay: 0.1 }}
                        onClick={() => setIsGroupCollapsed(!isGroupCollapsed)}
                        style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                            padding: '0 0.875rem', marginBottom: '0.4rem', 
                            cursor: 'pointer', color: 'var(--text-muted)',
                            userSelect: 'none'
                        }}
                    >
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            {group.label}
                        </span>
                        <motion.div animate={{ rotate: isGroupCollapsed ? 0 : -90 }} transition={{ duration: 0.2 }}>
                            <ChevronLeft size={10} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {(!isGroupCollapsed || isSidebarCollapsed) && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}
                    >
                        {group.items.map((item, idx) => <NavItem key={item.to} {...item} index={idx} isCollapsed={isSidebarCollapsed} />)}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const Layout = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme, isDark, transitioning } = useTheme();
    const { isFlowActive, toggleFlowState } = useFlowState();
    const { level, xp, nextLevelXp, progress } = useGamification();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [showTimer, setShowTimer] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const isAdmin = user?.role === 'admin';

    // Ctrl+K shortcut
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearch(v => !v);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const adminNavGroups = [
        { label: 'WORKSPACE', items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }, { to: '/analytics', icon: BarChart2, label: 'Analytics' }, { to: '/my-work', icon: Briefcase, label: 'My Work' }] },
        { label: 'STRATEGY', items: [{ to: '/calendar', icon: Calendar, label: 'Chronicle' }, { to: '/gantt', icon: Wind, label: 'Compass' }, { to: '/projects', icon: FolderOpen, label: 'Projects' }, { to: '/goals', icon: Target, label: 'Goals' }] },
        { label: 'MANAGEMENT', items: [{ to: '/admin/users', icon: Users, label: 'User Management' }, { to: '/admin/teams', icon: Users, label: 'Teams' }, { to: '/workflows', icon: Zap, label: 'Flow' }] },
        { label: 'OPERATIONS', items: [{ to: '/admin/tasks', icon: CheckSquare, label: 'Task Manager' }, { to: '/templates', icon: LayoutIcon, label: 'Templates' }, { to: '/resources', icon: Database, label: 'Resources' }, { to: '/notes', icon: FileText, label: 'Notes' }] },
        { label: 'MONITORING', items: [{ to: '/reports', icon: Activity, label: 'Reports' }, { to: '/performance', icon: Award, label: 'Performance' }, { to: '/admin/logs', icon: FileText, label: 'Activity Logs' }] },
        { label: 'SYSTEM', items: [{ to: '/notifications', icon: Bell, label: 'Notifications' }, { to: '/settings', icon: Settings, label: 'Settings' }, { to: '/profile', icon: User, label: 'Profile' }] }
    ];

    const userNavGroups = [
        { label: 'WORKSPACE', items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }, { to: '/calendar', icon: Calendar, label: 'Calendar' }, { to: '/my-work', icon: Briefcase, label: 'My Work' }] },
        { label: 'MANAGEMENT', items: [{ to: '/projects', icon: FolderOpen, label: 'Projects' }, { to: '/goals', icon: Target, label: 'Goals' }, { to: '/gantt', icon: Wind, label: 'Gantt' }] },
        { label: 'OPERATIONS', items: [{ to: '/tasks', icon: CheckSquare, label: 'Tasks' }, { to: '/templates', icon: LayoutIcon, label: 'Templates' }, { to: '/notes', icon: FileText, label: 'Notes' }] },
        { label: 'MONITORING', items: [{ to: '/reports', icon: Activity, label: 'Reports' }, { to: '/performance', icon: Award, label: 'Performance' }] },
        { label: 'SYSTEM', items: [{ to: '/notifications', icon: Bell, label: 'Notifications' }, { to: '/settings', icon: Settings, label: 'Settings' }, { to: '/profile', icon: User, label: 'Profile' }] }
    ];

    const navGroups = isAdmin ? adminNavGroups : userNavGroups;
    const navItems = navGroups.flatMap(g => g.items);

    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: '#0A0F1C',
            fontFamily: 'Inter, sans-serif',
            transition: 'background 0.5s ease',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Premium Geometric Background (Portal Wide) */}
            <div className="cyber-grid-bg" style={{ opacity: 0.15, position: 'fixed' }} />
            <div className="scan-line" style={{ position: 'fixed', opacity: 0.5, animationDuration: '12s' }} />
            
            {isFlowActive && <BackgroundHeatmap />}

            {/* Global Ctrl+K Search */}
            <AnimatePresence>
                {showSearch && <CommandPalette isOpen={showSearch} onClose={() => setShowSearch(false)} navItems={navItems} />}
            </AnimatePresence>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {mobileNavOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setMobileNavOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100 }}
                            className="mobile-overlay" />
                        <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '280px', background: 'var(--bg-base)', borderRight: '1px solid var(--border-default)', zIndex: 101, display: 'flex', flexDirection: 'column', padding: '1rem 0', boxShadow: '10px 0 30px rgba(0,0,0,0.5)' }}
                            className="mobile-sidebar">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 1.25rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Activity size={16} color="#000" />
                                    </div>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>WorkflowPro</span>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileNavOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                            </div>
                            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', padding: '0 0.5rem' }}>
                                {navGroups.map((group, i) => <NavGroup key={i} group={group} isSidebarCollapsed={false} />)}
                            </nav>
                            <div style={{ padding: '1rem', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.role}</div>
                                    </div>
                                    <LogOut size={16} color="#F85149" style={{ cursor: 'pointer' }} onClick={handleLogout} />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Flow State Breathing Border ── */}
            <AnimatePresence>
                {isFlowActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="animate-float"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 99,
                            border: '4px solid var(--color-primary)',
                            borderRadius: '0px',
                            boxShadow: 'inset 0 0 50px rgba(245, 158, 11, 0.35)',
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ── Sidebar ── */}
            <motion.aside
                layout
                animate={{
                    width: isFlowActive ? '0px' : (collapsed ? '68px' : '240px'),
                    opacity: isFlowActive ? 0 : 1,
                    x: isFlowActive ? -260 : 0
                }}
                transition={{ 
                    type: 'spring', stiffness: 280, damping: 32,
                    opacity: { duration: 0.2 }
                }}
                className="glass-sidebar desktop-sidebar"
                style={{
                    display: 'flex', flexDirection: 'column',
                    padding: isFlowActive ? '0' : '1rem 0',
                    position: 'sticky', top: 0, height: '100vh',
                    overflow: 'hidden', flexShrink: 0, zIndex: 10,
                    boxShadow: '4px 0 24px rgba(0,0,0,0.3)'
                }}
            >
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem 1rem', borderBottom: '1px solid rgba(245,158,11,0.1)', marginBottom: '0.75rem', overflow: 'hidden' }}>
                    <motion.div
                        whileHover={{ scale: 1.06, boxShadow: '0 0 16px rgba(245,158,11,0.5)' }}
                        style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(245,158,11,0.35)', cursor: 'pointer' }}
                    >
                        {isAdmin ? <Shield size={16} color="#000" strokeWidth={2.5} /> : <Activity size={16} color="#000" strokeWidth={2.5} />}
                    </motion.div>
                    <AnimatePresence mode="wait">
                        {!collapsed && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -10 }} 
                                transition={{ duration: 0.28, ease: [0.16,1,0.3,1] }} 
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC', whiteSpace: 'nowrap', letterSpacing: '-0.02em', fontFamily: 'Manrope, Inter, sans-serif' }}>
                                    WorkflowPro
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#F59E0B', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: '1px' }}>
                                    {isAdmin ? '⬡ Admin Control' : '◈ Workspace'}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Workspace Selector */}
                <div style={{ padding: '0 0.625rem 1rem' }}>
                    <button style={{ 
                        width: '100%', padding: collapsed ? '0.625rem' : '0.625rem 0.875rem', 
                        background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', 
                        borderRadius: '10px', display: 'flex', alignItems: 'center', 
                        justifyContent: collapsed ? 'center' : 'space-between', 
                        color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: 'var(--shadow-1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--brand-primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>W</div>
                            {!collapsed && <span style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Company Workspace</span>}
                        </div>
                        {!collapsed && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>▼</span>}
                    </button>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
                    {navGroups.map((group, i) => <NavGroup key={i} group={group} isSidebarCollapsed={collapsed} />)}
                </nav>

                {/* Real-time Presence (Radar) */}
                {!collapsed && <Presence />}

                {/* User Card + Logout */}
                <div style={{ marginTop: 'auto', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.5rem', marginBottom: '0.2rem', overflow: 'hidden' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#000', flexShrink: 0, position: 'relative' }}>
                            {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--sidebar-text-active)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 500 }}>{user?.role || 'Member'}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleLogout}
                        style={{
                            width: '100%', padding: collapsed ? '0.6rem' : '0.55rem 0.875rem',
                            borderRadius: '10px', background: 'rgba(248,81,73,0.06)',
                            border: '1px solid rgba(248,81,73,0.15)', color: '#F85149',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: '0.5rem', fontFamily: 'Inter', fontSize: '0.825rem', fontWeight: 500,
                            transition: 'all 0.18s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={14} />
                        {!collapsed && <span>Logout</span>}
                    </motion.button>

                    {/* Collapse toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setCollapsed(v => !v)}
                        style={{
                            width: '100%', padding: '0.5rem',
                            borderRadius: '10px', background: 'transparent',
                            border: '1px solid transparent', color: 'var(--sidebar-text)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', marginTop: '0.375rem',
                            fontFamily: 'Inter', transition: 'all 0.18s',
                        }}
                    >
                        <motion.div
                            animate={{ rotate: collapsed ? 180 : 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{ display: 'flex', alignItems: 'center' }}
                        >
                            <ChevronLeft size={16} />
                        </motion.div>
                    </motion.button>
                </div>
            </motion.aside>

            {/* ── Main Content ── */}
            <motion.main 
                layout
                className="main-content-layout"
                style={{ 
                    flex: 1, 
                    minWidth: 0, 
                    overflowY: 'auto', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    position: 'relative',
                }}
            >
                {/* Top bar */}
                <div style={{
                    borderBottom: isFlowActive ? 'none' : '1px solid #1F2937',
                    padding: '0.75rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    background: isFlowActive ? 'transparent' : '#0F172A',
                    position: 'sticky', top: 0, zIndex: 9,
                    boxShadow: isFlowActive ? 'none' : 'var(--shadow-1)',
                }}>
                    {/* Left: hamburger (mobile) + page title or flow state indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Mobile hamburger */}
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => setMobileNavOpen(true)}
                            className="mobile-hamburger"
                            style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'var(--glass-bg)', border: '1px solid var(--border-default)', color: 'var(--color-text-muted)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}>
                            <Menu size={16} />
                        </motion.button>
                        {isFlowActive ? (
                            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Wind size={18} color="#F59E0B" className="animate-float" />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-primary)' }}>Zen Focus Active</span>
                                </div>
                                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <SoundWave />
                                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.05em' }}>AMBIENT_NEURAL_TRACK</span>
                                </div>
                            </motion.div>
                        ) : (() => {
                            const routeKey = Object.keys(PAGE_TITLES).find(k => location.pathname === k || location.pathname.startsWith(k + '/'));
                            const pageInfo = PAGE_TITLES[routeKey] || { label: 'WorkFlow', sub: 'Workspace' };
                            return (
                                <motion.div
                                    key={location.pathname}
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.01em' }}>{pageInfo.label}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{pageInfo.sub}</div>
                                </motion.div>
                            );
                        })()}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {!isFlowActive && (
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setShowSearch(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.78rem' }}>
                                <Search size={13} />
                                <span className="search-label">Search</span>
                                <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--color-text-muted)' }} className="hide-on-mobile">⌘K</kbd>
                            </motion.button>
                        )}

                        {/* Flow State Toggle */}
                        <MagneticButton strength={0.2} onClick={toggleFlowState}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.35rem 0.9rem', borderRadius: '12px',
                                background: isFlowActive ? 'var(--brand-primary)' : 'var(--glass-bg)',
                                border: '1px solid var(--border-default)',
                                color: isFlowActive ? '#000' : 'var(--text-muted)',
                                cursor: 'pointer', transition: 'all 0.3s'
                            }}>
                                <Zap size={15} fill={isFlowActive ? 'currentColor' : 'none'} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{isFlowActive ? 'Exit Flow' : 'Flow State'}</span>
                            </div>
                        </MagneticButton>

                        {isFlowActive && (
                            <MagneticButton onClick={() => setShowTimer(v => !v)}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: showTimer ? 'var(--brand-primary)' : 'var(--glass-bg)',
                                    border: '1px solid var(--border-default)',
                                    color: showTimer ? '#000' : 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Clock size={16} />
                                </div>
                            </MagneticButton>
                        )}

                        {!isFlowActive && (
                            <>
                                <NotificationBell navigate={navigate} />
                                {/* Theme Toggle */}
                                <motion.button
                                    onClick={toggleTheme}
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                    style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                >
                                {isDark ? <Sun size={15} /> : <Moon size={15} />}
                                </motion.button>
                                {/* Live Clock - Hidden on mobile to save space */}
                                <div style={{ padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)' }} className="hide-on-mobile">
                                    <LiveClock />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)' }}>
                                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#000', position: 'relative' }}>
                                        {user?.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{user?.name?.split(' ')[0] || 'User'}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ flex: 1, padding: isFlowActive ? '1rem 2rem' : '2rem', transition: 'padding 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '1600px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <AnimatePresence>
                    {showTimer && isFlowActive && <PomodoroTimer onClose={() => setShowTimer(false)} />}
                </AnimatePresence>

                {/* ── Mobile Bottom Navigation ── */}
                <nav className="mobile-nav-bottom">
                    <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                        <Home size={22} />
                        <span className="mobile-nav-label">Home</span>
                    </NavLink>
                    <NavLink to="/tasks" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                        <CheckSquare size={22} />
                        <span className="mobile-nav-label">Tasks</span>
                    </NavLink>
                    <button 
                        onClick={() => navigate('/tasks')} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', transform: 'translateY(-10px)' }}
                    >
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', boxShadow: '0 4px 12px rgba(245,158,11,0.4)', border: '4px solid var(--bg-base)' }}>
                            <PlusCircle size={26} strokeWidth={2.5} fill="#000" color="#FBBF24" />
                        </div>
                    </button>
                    <NavLink to="/notifications" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                        <Bell size={22} />
                        <span className="mobile-nav-label">Alerts</span>
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                        <User size={22} />
                        <span className="mobile-nav-label">Profile</span>
                    </NavLink>
                </nav>

            </motion.main>
        </div>
    );
};

export default Layout;
