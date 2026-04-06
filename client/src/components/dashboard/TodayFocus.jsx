import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, Zap, ChevronRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const TodayFocus = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await fetch(`${API}/api/tasks`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const allTasks = Array.isArray(data) ? data : data.tasks || [];
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                    // Filter: overdue or due today or high priority in-progress
                    const focused = allTasks
                        .filter(t => t.status !== 'completed')
                        .map(t => {
                            const due = t.endDate ? new Date(t.endDate) : null;
                            const isOverdue = due && due < now;
                            const isDueToday = due && due >= today && due < new Date(today.getTime() + 86400000);
                            const isUrgent = t.priority === 'high' || t.priority === 'critical';
                            if (isOverdue || isDueToday || isUrgent) {
                                const daysOverdue = isOverdue ? Math.ceil((now - due) / 86400000) : 0;
                                return {
                                    ...t,
                                    _type: isOverdue ? 'overdue' : isDueToday ? 'today' : 'urgent',
                                    _dueLabel: isOverdue
                                        ? `${daysOverdue}d overdue`
                                        : isDueToday
                                            ? 'Due today'
                                            : t.endDate
                                                ? `Due ${new Date(t.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                                : 'No deadline'
                                };
                            }
                            return null;
                        })
                        .filter(Boolean)
                        .slice(0, 5);

                    setTasks(focused);
                }
            } catch (_) { }
            setIsLoading(false);
        };
        fetchTasks();
    }, []);

    const skeletons = () => (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
                <div key={i} className="glass-panel" style={{ padding: '1.25rem 1.5rem', height: '72px', animation: 'pulse 1.5s infinite', borderRadius: '16px' }} />
            ))}
        </div>
    );

    const emptyState = () => (
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '16px' }}>
            <CheckCircle size={32} color="#10B981" style={{ marginBottom: '0.75rem', opacity: 0.7 }} />
            <div style={{ color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '0.25rem' }}>All caught up!</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No urgent or overdue tasks right now.</div>
        </div>
    );

    return (
        <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
                fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
                color: 'var(--color-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
                <Zap size={14} fill="currentColor" />
                Today's Focus
            </h2>

            {isLoading ? skeletons() : tasks.length === 0 ? emptyState() : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {tasks.map((task, idx) => (
                        <motion.div
                            key={task._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-panel"
                            onClick={() => navigate('/tasks')}
                            style={{
                                padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between', cursor: 'pointer',
                                borderLeft: task._type === 'overdue' ? '4px solid #EF4444' : task._type === 'today' ? '4px solid #F59E0B' : '4px solid var(--color-primary)',
                                background: task._type === 'overdue' ? 'rgba(239,68,68,0.05)' : 'rgba(17,24,39,0.4)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: task._type === 'overdue' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: task._type === 'overdue' ? '#EF4444' : 'var(--color-text-muted)'
                                }}>
                                    {task._type === 'overdue' ? <AlertCircle size={20} /> : <Clock size={20} />}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{task.title}</h4>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: task._type === 'overdue' ? '#EF4444' : 'var(--color-text-muted)' }}>
                                            {task._dueLabel}
                                        </span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: task.priority === 'high' || task.priority === 'critical' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                            {task.priority} Priority
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                                <ChevronRight size={20} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default TodayFocus;
