import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, TrendingUp } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const WorkloadMonitor = () => {
    const [trendData, setTrendData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWorkload = async () => {
            try {
                const res = await fetch(`${API}/api/tasks`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const tasks = Array.isArray(data) ? data : data.tasks || [];

                    // Build status distribution from real data
                    const statusCounts = tasks.reduce((acc, t) => {
                        const key = t.status || 'pending';
                        acc[key] = (acc[key] || 0) + 1;
                        return acc;
                    }, {});

                    const distribution = [
                        { name: 'In Progress', value: statusCounts['in-progress'] || 0, color: '#F59E0B' },
                        { name: 'Pending', value: statusCounts['pending'] || 0, color: 'rgba(255,255,255,0.08)' },
                        { name: 'Pending Approval', value: statusCounts['pending-approval'] || 0, color: '#F59E0B' },
                        { name: 'Completed', value: statusCounts['completed'] || 0, color: '#10B981' },
                    ].filter(d => d.value > 0);

                    // Build 7-day trend from task creation dates
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const dayCounts = new Array(7).fill(0);
                    const now = new Date();
                    tasks.forEach(t => {
                        if (t.createdAt) {
                            const d = new Date(t.createdAt);
                            const diff = Math.floor((now - d) / 86400000);
                            if (diff >= 0 && diff < 7) {
                                dayCounts[6 - diff]++;
                            }
                        }
                    });
                    const trend = dayCounts.map((count, i) => {
                        const dayIndex = (now.getDay() - (6 - i) + 7) % 7;
                        return { name: days[dayIndex], load: count };
                    });

                    setTrendData(trend);
                    setStatusData(distribution.length > 0 ? distribution : [{ name: 'No Tasks', value: 1, color: 'rgba(255,255,255,0.08)' }]);
                }
            } catch (_) { }
            setIsLoading(false);
        };
        fetchWorkload();
    }, []);

    const totalTasks = statusData.reduce((s, d) => s + d.value, 0);
    const criticalCount = statusData.find(d => d.name === 'Pending Approval')?.value || 0;

    return (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {/* Left: 8 columns - Trend Graph */}
            <div className="glass-panel" style={{ gridColumn: 'span 8', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Task Activity</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tasks created over the past 7 days</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>
                        <TrendingUp size={14} />
                        {totalTasks} total tasks
                    </div>
                </div>
                <div style={{ flex: 1, minHeight: '220px' }}>
                    {isLoading ? (
                        <div style={{ height: '220px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }} />
                                <Area type="monotone" dataKey="load" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#loadGradient)" name="Tasks Created" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Right: 4 columns - Distribution + Risk */}
            <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Task Distribution</h3>
                    <div style={{ flex: 1, minHeight: '140px' }}>
                        {isLoading ? (
                            <div style={{ height: '140px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
                        ) : (
                            <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                    <Pie data={statusData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    {/* Legend */}
                    {!isLoading && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                            {statusData.map(d => (
                                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                                    <span>{d.name}</span>
                                    <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--color-text-main)' }}>{d.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {criticalCount > 0 && (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}
                    >
                        <div style={{ color: '#F59E0B' }}><AlertCircle size={24} /></div>
                        <div>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Approval</h4>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(245,158,11,0.8)', fontWeight: 500 }}>{criticalCount} task{criticalCount > 1 ? 's' : ''} awaiting review</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default WorkloadMonitor;
