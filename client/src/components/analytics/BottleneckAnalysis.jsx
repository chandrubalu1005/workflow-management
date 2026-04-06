import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Timer } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const BottleneckAnalysis = () => {
    const [agingData, setAgingData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAging = async () => {
            try {
                // Try the analytics endpoint first
                const res = await fetch(`${API}/api/analytics/task-aging`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setAgingData(data);
                        setIsLoading(false);
                        return;
                    }
                }
                // Fallback: derive aging data from tasks directly
                const tasksRes = await fetch(`${API}/api/tasks`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (tasksRes.ok) {
                    const raw = await tasksRes.json();
                    const tasks = Array.isArray(raw) ? raw : raw.tasks || [];
                    const now = new Date();

                    // Group by status and compute average age in days
                    const groups = {};
                    tasks.forEach(t => {
                        const key = t.status || 'pending';
                        if (!groups[key]) groups[key] = { totalDays: 0, count: 0 };
                        const created = t.createdAt ? new Date(t.createdAt) : now;
                        const ageDays = Math.max(0, Math.round((now - created) / 86400000));
                        groups[key].totalDays += ageDays;
                        groups[key].count++;
                    });

                    const STAGE_LABELS = {
                        'pending': 'To Do',
                        'in-progress': 'In Progress',
                        'pending-approval': 'Approval',
                        'completed': 'Completed'
                    };
                    const STAGE_COLORS = {
                        'pending': 'var(--border-default)',
                        'in-progress': '#F59E0B',
                        'pending-approval': '#F59E0B',
                        'completed': '#10B981'
                    };

                    const derived = Object.entries(groups)
                        .filter(([key]) => key !== 'completed')
                        .map(([key, v]) => ({
                            stage: STAGE_LABELS[key] || key,
                            days: v.count > 0 ? Math.round((v.totalDays / v.count) * 10) / 10 : 0,
                            count: v.count,
                            color: STAGE_COLORS[key] || '#6B7280'
                        }));
                    setAgingData(derived.length > 0 ? derived : [
                        { stage: 'No Tasks', days: 0, count: 0, color: '#6B7280' }
                    ]);
                }
            } catch (_) { }
            setIsLoading(false);
        };
        fetchAging();
    }, []);

    // Find the worst bottleneck (only if it has real age > 0)
    const worst = agingData.reduce((max, d) => (d.days > 0 && (!max || d.days > max.days)) ? d : max, null);
    const worstTitle = worst ? `${worst.stage} Stagnation` : 'No Bottleneck Detected';

    return (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {/* Bottleneck Bar Chart (8 col) */}
            <div style={{ gridColumn: 'span 8', padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Task Aging by Stage</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average days tasks remain in each lifecycle phase.</p>
                    </div>
                </div>
                <div style={{ height: '280px' }}>
                    {isLoading ? (
                        <div style={{ height: '280px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
                    ) : agingData.length === 0 || agingData.every(d => d.days === 0) ? (
                        <div style={{ height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', gap: '0.5rem' }}>
                            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            <span style={{ fontSize: '0.85rem' }}>Tasks are all fresh — no aging data yet.</span>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            style={{ height: '280px', width: '100%', position: 'relative' }}
                        >
                            <style>{`
                                .recharts-bar-rectangle { filter: drop-shadow(0 0 8px rgba(245,158,11,0.4)); transition: filter 0.3s; }
                                .recharts-bar-rectangle:hover { filter: drop-shadow(0 0 16px rgba(245,158,11,0.8)); }
                            `}</style>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={agingData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.03)" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="stage" type="category" axisLine={false} tickLine={false}
                                        tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} width={110}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: '12px', color: 'var(--text-primary)' }}
                                        formatter={(val) => [`${val} days avg`, 'Age']}
                                    />
                                    <Bar dataKey="days" radius={[0, 6, 6, 0]} barSize={34} isAnimationActive={true} animationDuration={1000}>
                                        {agingData.map((entry, i) => (
                                            <Cell key={`cell-${i}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Critical Delay Insights (4 col) */}
            <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ flex: 1, padding: '1.5rem', background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#EF4444' }}>
                        <Timer size={20} />
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {worst ? `${worst.stage} Stagnation` : 'No Bottleneck'}
                        </h4>
                    </div>
                    {worst && worst.days > 0 ? (
                        <>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Tasks in{' '}
                                <span style={{ color: '#EF4444', fontWeight: 700 }}>{worst.stage}</span>
                                {' '}are averaging{' '}
                                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{worst.days} days</span>
                                {' '}before moving to the next stage.
                            </p>
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {agingData.map(d => (
                                    <div key={d.stage} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{d.stage}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{d.days}d</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.count} tasks</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {worst.days > 7 && (
                                <div style={{ marginTop: '1.25rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertTriangle size={14} color="#EF4444" />
                                    <span style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 700 }}>CRITICAL BOTTLENECK</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                            No significant bottlenecks detected. All stages are flowing efficiently.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default BottleneckAnalysis;
