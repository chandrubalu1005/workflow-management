import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Users, BarChart2, Settings, FolderOpen, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const QuickActionButton = ({ icon: Icon, label, color, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.03)' }}
        whileTap={{ scale: 0.98 }}
        style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem',
            borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            color: 'var(--color-text-main)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s'
        }}
        onClick={onClick}
    >
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
            <Icon size={18} />
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
    </motion.button>
);

const ActionPanel = ({ isAdmin }) => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin) {
            setIsLoading(false);
            return;
        }
        const fetchLogs = async () => {
            try {
                const res = await fetch(`${API}/api/logs?limit=5`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const items = Array.isArray(data) ? data : data.logs || [];
                    setLogs(items.slice(0, 5));
                }
            } catch (_) { }
            setIsLoading(false);
        };
        fetchLogs();
    }, [isAdmin]);

    const ACTION_LABELS = {
        TASK_CREATED: 'created task',
        TASK_COMPLETED: 'completed task',
        TASK_DELETED: 'deleted task',
        TASK_DECOMPOSED: 'decomposed task',
        POINTS_AWARDED: 'awarded points for',
        GOAL_COMPLETED: 'completed goal',
        GOAL_UNCOMPLETED: 'unchecked goal',
        USER_CREATED: 'added user',
        USER_DELETED: 'removed user',
    };

    const timeAgo = (dateStr) => {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Quick Actions */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {isAdmin ? (
                        <>
                            <QuickActionButton icon={FolderOpen} label="Create Project" color="#F59E0B" onClick={() => navigate('/projects')} />
                            <QuickActionButton icon={Users} label="Manage Users" color="#F59E0B" onClick={() => navigate('/admin/users')} />
                            <QuickActionButton icon={Activity} label="Activity Logs" color="#10B981" onClick={() => navigate('/admin/logs')} />
                            <QuickActionButton icon={Settings} label="Settings" color="rgba(255,255,255,0.4)" onClick={() => navigate('/settings')} />
                        </>
                    ) : (
                        <>
                            <QuickActionButton icon={Plus} label="My Tasks" color="#F59E0B" onClick={() => navigate('/tasks')} />
                            <QuickActionButton icon={Check} label="My Work" color="#F59E0B" onClick={() => navigate('/my-work')} />
                            <QuickActionButton icon={BarChart2} label="Analytics" color="#10B981" onClick={() => navigate('/analytics')} />
                            <QuickActionButton icon={FolderOpen} label="Projects" color="#F59E0B" onClick={() => navigate('/projects')} />
                        </>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>Recent Activity</h3>
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        No recent activity
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {logs.map((log, idx) => {
                            let details = {};
                            try { details = JSON.parse(log.details || '{}'); } catch (_) { }
                            const actionLabel = ACTION_LABELS[log.action] || log.action?.toLowerCase().replace(/_/g, ' ');
                            const userName = log.user?.name || log.user || 'System';
                            const target = details.title || details.taskTitle || '';

                            return (
                                <div key={log._id || idx} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    paddingBottom: idx !== logs.length - 1 ? '1rem' : 0,
                                    borderBottom: idx !== logs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                                        {String(userName).charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.83rem', color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <span style={{ fontWeight: 700 }}>{userName}</span>
                                            {' '}{actionLabel}
                                            {target && <> <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{target}</span></>}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.1rem' }}>{timeAgo(log.createdAt || log.timestamp)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ActionPanel;
