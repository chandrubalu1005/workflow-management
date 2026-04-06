import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import TodayFocus from '../components/dashboard/TodayFocus';
import SystemSnapshot from '../components/dashboard/SystemSnapshot';
import WorkloadMonitor from '../components/dashboard/WorkloadMonitor';
import ActionPanel from '../components/dashboard/ActionPanel';
import ActivityPanel from '../components/dashboard/ActivityPanel';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FolderOpen, ArrowRight, TrendingUp, Layers, Zap, Flame, Target, Clock } from 'lucide-react';
import { AnimatedStatCard, PriorityHeatMap } from '../components/SaaS';
import TiltContainer from '../components/TiltContainer';

const API = import.meta.env.VITE_API_URL;

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Good morning', emoji: '☀️' };
    if (h < 17) return { text: 'Good afternoon', emoji: '⚡' };
    return { text: 'Good evening', emoji: '🌙' };
};

// ── Stagger container ────────────────────────────────────────
const containerVariants = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.07, delayChildren: 0.1 }
    }
};

const cardVariant = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.16, 1, 0.3, 1] } }
};

// ── Enterprise Bento Card ────────────────────────────────────
const BentoCard = ({ children, style = {}, className = '', onClick, colSpan = 1 }) => (
    <motion.div
        onClick={onClick}
        variants={cardVariant}
        whileHover={onClick ? { y: -3, boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 20px rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.35)' } : undefined}
        style={{
            background: 'rgba(17,24,39,0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)',
            willChange: 'transform, opacity',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
            ...style
        }}
        className={className}
    >
        {children}
    </motion.div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const navigate = useNavigate();
    const greeting = getGreeting();

    const [allTasks, setAllTasks] = useState([]);
    const [overview, setOverview] = useState(null);
    const [recentProjects, setRecentProjects] = useState([]);
    const [overdueTasks, setOverdueTasks] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [stats, setStats] = useState({ total: 0, high: 0, completed: 0 });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const h = { Authorization: `Bearer ${token}` };

        fetch(`${API}/api/tasks`, { headers: h })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) return;
                const tasks = Array.isArray(data) ? data : data.tasks || [];
                setAllTasks(tasks);
                const now = new Date();
                const high = tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;
                const completed = tasks.filter(t => t.status === 'completed').length;
                const overdue = tasks.filter(t => t.endDate && new Date(t.endDate) < now && t.status !== 'completed');
                setOverdueTasks(overdue.slice(0, 4));
                setOverview({ totalTasks: tasks.filter(t => t.status !== 'completed').length, highPriority: high, overdue: overdue.length });
                setStats({
                    total: tasks.length,
                    high,
                    completed,
                    completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
                });
            })
            .catch(() => {});

        fetch(`${API}/api/projects`, { headers: h })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) return;
                const projs = Array.isArray(data) ? data : data.projects || [];
                setRecentProjects(projs.slice(0, 4));
            })
            .catch(() => {});

        if (isAdmin) {
            fetch(`${API}/api/logs?limit=6`, { headers: h })
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (!data) return;
                    setActivityLogs(Array.isArray(data) ? data : data.logs || []);
                })
                .catch(() => {});
        }
    }, [isAdmin]);

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>

            {/* ── Hero Greeting ── */}
            <motion.header
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}
            >
                {/* Ambient floating orbs */}
                <motion.div
                    className="ambient-orb float-anim"
                    style={{
                        width: '300px', height: '300px',
                        background: 'rgba(245, 158, 11, 0.06)',
                        top: '-120px', right: '-80px',
                        animationDelay: '0s'
                    }}
                />
                <motion.div
                    className="ambient-orb float-anim"
                    style={{
                        width: '200px', height: '200px',
                        background: 'rgba(245, 158, 11, 0.04)',
                        top: '-60px', right: '120px',
                        animationDelay: '2s'
                    }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', position: 'relative', zIndex: 1 }}>
                    <motion.span
                        animate={{ rotate: [0, -8, 8, -4, 0] }}
                        transition={{ delay: 0.6, duration: 0.8, ease: 'easeInOut' }}
                        style={{ fontSize: '2rem', lineHeight: 1 }}
                    >
                        {greeting.emoji}
                    </motion.span>
                    <div>
                        <h1 style={{
                            fontSize: '2.2rem', fontWeight: 900, color: '#F8FAFC',
                            letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0,
                            fontFamily: 'Manrope, Inter, sans-serif'
                        }}>
                            {greeting.text},{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #F59E0B 20%, #FBBF24 80%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                {user?.name?.split(' ')[0] || 'there'}
                            </span>
                        </h1>
                        <p style={{ color: '#6B7280', fontWeight: 500, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                            {isAdmin ? 'System-wide monitoring and resource coordination.' : 'Manage your daily objectives and performance velocity.'}
                        </p>
                    </div>
                </div>
            </motion.header>

            <motion.div
                className="dashboard-stats-grid"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{ marginBottom: '1.75rem', display: 'grid', gap: '1rem' }}
                data-admin={isAdmin}
            >
                <TiltContainer intensity={15} style={{ height: '100%' }}>
                    <AnimatedStatCard
                        icon={Target}
                        label="Active Tasks"
                        value={overview?.totalTasks || 0}
                        trend={stats.high > 0 ? `+${stats.high} high` : 'on track'}
                        trendDirection={stats.high > 3 ? 'down' : 'up'}
                        glowPulse={stats.high > 3}
                        sparkData={[3, 5, 4, 7, 6, stats.high || 5, overview?.totalTasks || 8]}
                    />
                </TiltContainer>
                <TiltContainer intensity={15} style={{ height: '100%' }}>
                    <AnimatedStatCard
                        icon={Flame}
                        label="Completion Rate"
                        value={stats.completionRate || 0}
                        trend={`+${stats.completed || 0} completed`}
                        trendDirection="up"
                        glowPulse={stats.completionRate > 50}
                        sparkData={[20, 35, 30, 50, 45, 60, stats.completionRate || 70]}
                    />
                </TiltContainer>
                <TiltContainer intensity={15} style={{ height: '100%' }}>
                    <AnimatedStatCard
                        icon={Zap}
                        label="High Priority"
                        value={stats.high || 0}
                        trend={overview?.overdue > 0 ? `${overview.overdue} overdue` : 'under control'}
                        trendDirection={overview?.overdue > 0 ? 'down' : 'neutral'}
                        sparkData={[1, 2, 3, 2, stats.high || 4, 3, 2]}
                    />
                </TiltContainer>
                {isAdmin && (
                    <TiltContainer intensity={15} style={{ height: '100%' }}>
                        <AnimatedStatCard
                            icon={Layers}
                            label="Total Projects"
                            value={recentProjects.length}
                            trend={`${recentProjects.filter(p => p.status === 'completed').length} completed`}
                            trendDirection="up"
                            sparkData={[1, 2, 2, 3, 3, 4, recentProjects.length]}
                        />
                    </TiltContainer>
                )}
            </motion.div>

            {/* ── Overdue Alert Banner (Swipe to dismiss) ── */}
            {overdueTasks.length > 0 && (
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, info) => {
                        if (info.offset.x > 100 || info.offset.x < -100) {
                            setOverdueTasks([]); // Dismiss
                        }
                    }}
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 200 }}
                    transition={{ delay: 0.12, duration: 0.35 }}
                    style={{
                        background: 'rgba(239,68,68,0.05)',
                        border: '1px solid rgba(239,68,68,0.22)',
                        borderRadius: '16px', padding: '1rem 1.25rem',
                        marginBottom: '1.75rem', touchAction: 'pan-y',
                        display: 'flex', alignItems: 'flex-start', gap: '1rem',
                        cursor: 'grab'
                    }}
                    whileTap={{ cursor: 'grabbing' }}
                >
                    <AlertTriangle size={17} color="#EF4444" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                            {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''} require attention (Swipe to dismiss)
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {overdueTasks.map(t => (
                                <span
                                    key={t._id}
                                    onClick={() => navigate('/tasks')}
                                    style={{ padding: '0.2rem 0.6rem', borderRadius: '7px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    {t.title?.slice(0, 28)}{t.title?.length > 28 ? '…' : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/tasks')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.7rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.73rem', fontWeight: 700, flexShrink: 0 }}
                    >
                        View <ArrowRight size={12} />
                    </button>
                </motion.div>
            )}

            {/* ── Bento Grid ── */}
            <motion.div
                className="dashboard-bento-grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                style={{
                    display: 'grid',
                    gap: '1.25rem',
                    alignItems: 'start'
                }}
                data-admin={isAdmin}
            >
                {/* Priority HeatMap — wide */}
                <motion.div variants={cardVariant} className={isAdmin ? 'bento-span-2' : 'bento-span-2'}>
                    <TiltContainer intensity={15} style={{ height: '100%' }}>
                        <PriorityHeatMap
                            tasks={allTasks}
                            onTileClick={(priority) => navigate(`/tasks?priority=${priority}`)}
                        />
                    </TiltContainer>
                </motion.div>

                {/* TodayFocus */}
                <motion.div variants={cardVariant}>
                    <TiltContainer intensity={15} style={{ height: '100%' }}>
                        <TodayFocus />
                    </TiltContainer>
                </motion.div>

                {/* SystemSnapshot — wide card */}
                <motion.div variants={cardVariant} className={isAdmin ? 'bento-span-2' : 'bento-span-1'}>
                    <TiltContainer intensity={15} style={{ height: '100%' }}>
                        <SystemSnapshot isAdmin={isAdmin} />
                    </TiltContainer>
                </motion.div>

                {/* WorkloadMonitor — wide */}
                <motion.div variants={cardVariant} className={isAdmin ? 'bento-span-2' : 'bento-span-2'}>
                    <TiltContainer intensity={15} style={{ height: '100%' }}>
                        <WorkloadMonitor />
                    </TiltContainer>
                </motion.div>

                {/* Activity Panel (admin only) */}
                {isAdmin && (
                    <motion.div variants={cardVariant}>
                        <TiltContainer intensity={15} style={{ height: '100%' }}>
                            <ActivityPanel activity={activityLogs} />
                        </TiltContainer>
                    </motion.div>
                )}

                {/* Recent Projects */}
                {recentProjects.length > 0 && (
                    <motion.div variants={cardVariant} className="bento-span-2">
                        <TiltContainer intensity={15} style={{ height: '100%' }}>
                            <div style={{
                                background: 'rgba(17,24,39,0.75)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(245,158,11,0.15)',
                                borderRadius: '20px', padding: '24px',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                                height: '100%'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Layers size={14} color="#F59E0B" />
                                        </div>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#E5E7EB' }}>Recent Projects</span>
                                    </div>
                                    <button
                                        onClick={() => navigate('/projects')}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Inter', transition: 'color 0.2s', padding: '0.4rem 0.6rem', borderRadius: '8px' }}
                                    >
                                        View All <ArrowRight size={13} />
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' }}>
                                    {recentProjects.map((p, i) => {
                                        const tasksDone = p.completedTasks || 0;
                                        const tasksTotal = p.totalTasks || 0;
                                        const pct = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
                                        return (
                                            <motion.div
                                                key={p._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 + i * 0.07 }}
                                                whileHover={{ y: -4, borderColor: 'rgba(245,158,11,0.4)', boxShadow: '0 12px 32px rgba(245,158,11,0.1)' }}
                                                onClick={() => navigate(`/projects/${p._id}`)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.07)',
                                                    borderRadius: '14px', padding: '1rem 1.1rem',
                                                    cursor: 'pointer', transition: 'border-color 0.2s',
                                                    willChange: 'transform'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                                    <div style={{ color: '#E5E7EB', fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                        {p.name}
                                                    </div>
                                                    <span style={{
                                                        padding: '0.15rem 0.45rem', borderRadius: '5px', marginLeft: '0.5rem',
                                                        background: p.status === 'completed' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.1)',
                                                        color: p.status === 'completed' ? '#10B981' : '#F59E0B',
                                                        fontSize: '0.6rem', fontWeight: 700, flexShrink: 0
                                                    }}>
                                                        {p.status || 'active'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                                            className="progress-bar-fill"
                                                            style={{ height: '100%', borderRadius: '3px' }}
                                                        />
                                                    </div>
                                                    <span style={{ color: '#6B7280', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{pct}%</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </TiltContainer>
                    </motion.div>
                )}

                {/* Quick Actions */}
                <TiltContainer intensity={15} style={{ height: '100%' }}>
                    <BentoCard style={{ height: '100%' }}>
                        <ActionPanel isAdmin={isAdmin} />
                    </BentoCard>
                </TiltContainer>

            </motion.div>

            {/* FAB — admin shortcut to create task */}
            {isAdmin && (
                <motion.button
                    className="fab"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 20 }}
                    onClick={() => navigate('/tasks')}
                    title="Create New Task"
                    aria-label="Create new task"
                >
                    +
                </motion.button>
            )}
        </div>
    );
};

export default Dashboard;
