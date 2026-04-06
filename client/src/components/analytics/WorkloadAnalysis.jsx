import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, AlertCircle, Sparkles, TrendingDown } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const WorkloadAnalysis = ({ isAdmin }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin) { setIsLoading(false); return; }
        const fetchWorkload = async () => {
            try {
                // Try analytics/workload endpoint first
                const res = await fetch(`${API}/api/analytics/workload`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setUsers(data);
                        setIsLoading(false);
                        return;
                    }
                }
                // Fallback: compute workload from /api/users + task assignments
                const [usersRes, tasksRes] = await Promise.all([
                    fetch(`${API}/api/users`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                    fetch(`${API}/api/tasks`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                ]);
                const usersData = usersRes.ok ? await usersRes.json() : [];
                const tasksData = tasksRes.ok ? await tasksRes.json() : [];
                const userList = Array.isArray(usersData) ? usersData : usersData.users || [];
                const taskList = Array.isArray(tasksData) ? tasksData : tasksData.tasks || [];

                // Count active (non-completed) tasks per user
                const taskCounts = {};
                taskList.filter(t => t.status !== 'completed').forEach(t => {
                    const uid = t.assignedTo?._id || t.assignedTo;
                    if (uid) taskCounts[uid] = (taskCounts[uid] || 0) + 1;
                });

                // Normalize to a 0-100 load score (cap at 10 tasks = 100%)
                const withLoad = userList
                    .filter(u => u.role !== 'admin')
                    .map(u => {
                        const count = taskCounts[u._id] || 0;
                        const load = Math.min(100, Math.round((count / 10) * 100));
                        return {
                            _id: u._id,
                            name: u.name,
                            load,
                            taskCount: count,
                            status: load >= 80 ? 'critical' : load >= 60 ? 'heavy' : 'optimal',
                            group: u.position || u.department || 'Team'
                        };
                    })
                    .sort((a, b) => b.load - a.load)
                    .slice(0, 6);

                setUsers(withLoad);
            } catch (_) { }
            setIsLoading(false);
        };
        fetchWorkload();
    }, [isAdmin]);

    // Find overloaded and underloaded users for suggestions
    const overloaded = users.filter(u => u.status === 'critical');
    const optimal = users.filter(u => u.status === 'optimal' && u.load < 40);

    return (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {/* Left: Workload List (7 col) */}
            <div style={{ gridColumn: 'span 7', padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                    Resource Intensity
                    {!isAdmin && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>(Admin only)</span>}
                </h3>
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '52px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />)}
                    </div>
                ) : !isAdmin ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        Workload data is visible to administrators only.
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        No users found. Add team members to see workload data.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {users.map((u, idx) => (
                            <div key={u._id || idx} style={{
                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem',
                                borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#000', flexShrink: 0 }}>
                                    {u.name?.charAt(0)?.toUpperCase() || <User size={14} color="#000" />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: u.status === 'critical' ? '#EF4444' : u.status === 'heavy' ? '#F59E0B' : '#10B981', flexShrink: 0, marginLeft: '0.5rem' }}>
                                            {u.load}% · {u.taskCount} tasks
                                        </span>
                                    </div>
                                    <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${u.load}%` }}
                                            transition={{ duration: 1, delay: idx * 0.1, ease: 'easeOut' }}
                                            style={{ height: '100%', borderRadius: '3px', background: u.status === 'critical' ? 'linear-gradient(90deg,#EF4444,#DC2626)' : u.status === 'heavy' ? 'linear-gradient(90deg,#F59E0B,#D97706)' : 'linear-gradient(90deg,#10B981,#059669)' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Suggestion Engine (5 col) */}
            <div style={{ gridColumn: 'span 5', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <Sparkles size={18} color="#F59E0B" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Optimization Intelligence</h3>
                </div>
                {!isAdmin ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        Optimization suggestions are available to administrators.
                    </p>
                ) : overloaded.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                        <div style={{ color: '#10B981', marginBottom: '0.5rem' }}><TrendingDown size={32} /></div>
                        <p style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>Workload Balanced!</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>No critical overload detected.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {overloaded.map((heavy, idx) => {
                            const target = optimal[idx];
                            return (
                                <div key={heavy._id || idx} style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <AlertCircle size={14} color="#EF4444" />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#EF4444' }}>{heavy.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>is at {heavy.load}% capacity</span>
                                    </div>
                                    {target ? (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                            Consider reassigning tasks to{' '}
                                            <span style={{ color: '#10B981', fontWeight: 700 }}>{target.name}</span>
                                            {' '}({target.load}% load) to balance the team.
                                        </p>
                                    ) : (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                            Review and redistribute tasks to reduce this person's workload.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default WorkloadAnalysis;
