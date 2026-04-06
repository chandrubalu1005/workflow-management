import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Activity, AlertTriangle, Zap } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const SnapshotCard = ({ label, value, trend, icon: Icon, color, delay, isLoading }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="glass-panel"
        style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}
    >
        {isLoading ? (
            <div style={{ height: '80px', animation: 'pulse 1.5s infinite' }} />
        ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        {label}
                    </p>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1 }}>
                        {value}
                    </div>
                    <div style={{
                        fontSize: '0.7rem', fontWeight: 600,
                        color: String(trend).startsWith('+') ? '#10B981' : '#EF4444',
                        marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem'
                    }}>
                        {trend} vs last month
                    </div>
                </div>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                    <Icon size={22} />
                </div>
            </div>
        )}
    </motion.div>
);

const SystemSnapshot = ({ isAdmin }) => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [tasksRes, projectsRes] = await Promise.all([
                    fetch(`${API}/api/tasks`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                    fetch(`${API}/api/projects`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                ]);

                const [tasksData, projectsData] = await Promise.all([
                    tasksRes.ok ? tasksRes.json() : [],
                    projectsRes.ok ? projectsRes.json() : []
                ]);

                const tasks = Array.isArray(tasksData) ? tasksData : tasksData.tasks || [];
                const projects = Array.isArray(projectsData) ? projectsData : projectsData.projects || [];

                const completedTasks = tasks.filter(t => t.status === 'completed').length;
                const inProgresstasks = tasks.filter(t => t.status === 'in-progress').length;
                const totalTasks = tasks.length;
                const velocity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in-progress').length;

                setStats({
                    projects: activeProjects,
                    tasks: completedTasks,
                    velocity: `${velocity}%`,
                    inProgress: inProgresstasks,
                });
            } catch (_) { }
            setIsLoading(false);
        };
        fetchStats();
    }, []);

    const cards = [
        { label: 'Active Projects', value: isLoading ? '—' : (stats?.projects ?? 0), trend: '+0', icon: Activity, color: '#F59E0B' },
        { label: 'Tasks Completed', value: isLoading ? '—' : (stats?.tasks ?? 0), trend: '+0', icon: CheckCircle, color: '#10B981' },
        { label: 'Team Velocity', value: isLoading ? '—' : (stats?.velocity ?? '0%'), trend: '+0%', icon: Zap, color: '#F59E0B' },
        { label: 'In Progress', value: isLoading ? '—' : (stats?.inProgress ?? 0), trend: '+0', icon: Users, color: '#F59E0B' },
    ];

    if (isAdmin) {
        cards.push({ label: 'Pending Approval', value: '—', trend: '+0', icon: AlertTriangle, color: '#EF4444' });
    }

    return (
        <section style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {cards.map((stat, idx) => (
                    <SnapshotCard key={stat.label} {...stat} delay={0.1 + idx * 0.05} isLoading={isLoading} />
                ))}
            </div>
        </section>
    );
};

export default SystemSnapshot;
