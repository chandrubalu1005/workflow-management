import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Award, RefreshCw, Trophy, Zap, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TiltContainer from '../../components/TiltContainer';

const API = import.meta.env.VITE_API_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const SCORE_COLOR = (v) => v >= 80 ? '#10B981' : v >= 55 ? '#F59E0B' : '#EF4444';
const SCORE_GLOW = (v) => v >= 80 ? 'rgba(16,185,129,0.3)' : v >= 55 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';

const RankBadge = ({ rank }) => {
    if (rank === 1) return <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #FDE68A, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(245,158,11,0.6)', flexShrink: 0 }}><Trophy size={14} color="#78350F" /></div>;
    if (rank === 2) return <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #E2E8F0, #94A3B8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(148,163,184,0.4)', flexShrink: 0 }}><Trophy size={14} color="#334155" /></div>;
    if (rank === 3) return <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #FDBA74, #C2410C)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(194,65,12,0.4)', flexShrink: 0 }}><Trophy size={14} color="#431407" /></div>;
    
    return <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'JetBrains Mono', flexShrink: 0 }}>{rank}</div>;
};

const SkeletonRow = () => (
    <div style={{
        height: '76px', borderRadius: '16px', background: 'rgba(17,24,39,0.4)',
        border: '1px solid rgba(255,255,255,0.03)', marginBottom: '0.5rem',
        padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem',
        position: 'relative', overflow: 'hidden'
    }}>
        <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ position: 'absolute', top: 0, left: 0, width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)' }} />
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '140px', height: '14px', borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ width: '80px', height: '10px', borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div style={{ width: '100px', height: '24px', borderRadius: 8, background: 'rgba(255,255,255,0.05)' }} />
    </div>
);

const Performance = () => {
    const { user } = useAuth();
    const currentUserId = user?._id || user?.id;
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [month, setMonth] = useState(defaultMonth);
    const [perf, setPerf] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPerf = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API}/api/performance?month=${month}`, { headers: headers() });
            if (res.ok) setPerf(await res.json());
        } catch (_) { }
        setIsLoading(false);
    }, [month]);

    useEffect(() => { fetchPerf(); }, [fetchPerf]);

    const top3 = perf.slice(0, 3);
    const chartData = perf.slice(0, 8).map(u => ({
        name: u.name?.split(' ')[0] || 'N/A',
        completion: u.completionRate,
        efficiency: u.efficiencyScore,
    }));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: '3rem', maxWidth: 1200, margin: '0 auto' }}>
            
            {/* Cinematic Header Area */}
            <div className="performance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', position: 'relative' }}>
                {/* Ambient Glow */}
                <div style={{ position: 'absolute', top: '-150px', left: '-100px', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)', filter: 'blur(120px)', zIndex: -1, pointerEvents: 'none' }} />
                
                <div>
                    <h1 style={{ fontSize: '2.75rem', fontWeight: 950, color: '#F8FAFC', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', letterSpacing: '-0.04em' }}>
                        <div style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', padding: '0.75rem', borderRadius: '16px', display: 'flex', boxShadow: '0 10px 40px rgba(245,158,11,0.35)' }}>
                            <Zap size={30} color="#111827" fill="#111827" />
                        </div>
                        Elite Intelligence
                    </h1>
                    <p style={{ color: '#F59E0B', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', marginLeft: '0.25rem' }}>
                        UNIT: <strong style={{ color: '#CBD5E1' }}>EFFICIENCY_MAINFRAME</strong> // SYS.LEADERBOARD
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(17,24,39,0.5)', padding: '0.5rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                    <input 
                        type="month" 
                        value={month} 
                        onChange={e => setMonth(e.target.value)}
                        style={{ 
                            padding: '0.6rem 1rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid transparent', color: '#F8FAFC', 
                            fontFamily: 'JetBrains Mono', fontSize: '0.85rem', outline: 'none', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }} 
                    />
                    <motion.button 
                        whileHover={{ scale: 1.05, background: 'rgba(245,158,11,0.2)' }} 
                        whileTap={{ scale: 0.95 }} 
                        onClick={() => fetchPerf()}
                        style={{ 
                            width: 42, height: 42, borderRadius: 12, background: 'rgba(245,158,11,0.1)', 
                            border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B', cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}
                    >
                        <RefreshCw size={18} />
                    </motion.button>
                </div>
            </div>

            {/* ── 3D Podium for Top 3 ── */}
            {!isLoading && top3.length > 0 && (
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <Award size={18} color="#F59E0B" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Top Performers</h2>
                    </div>
                    
                    <div className="performance-podium" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
                        {/* Render order: 2nd, 1st, 3rd for visual podium effect if screen is wide */}
                        {[top3[1], top3[0], top3[2]].filter(Boolean).map((u, i) => {
                            const isFirst = u === top3[0];
                            const rank = top3.indexOf(u) + 1;
                            const height = isFirst ? '280px' : rank === 2 ? '250px' : '230px';
                            const glow = SCORE_GLOW(u.efficiencyScore);
                            
                            return (
                                <TiltContainer key={u._id} intensity={isFirst ? 15 : 10} style={{ height }}>
                                    <motion.div 
                                        initial={{ opacity: 0, y: 30 }} 
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: rank * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                                        style={{ 
                                            background: isFirst ? 'rgba(30,41,59,0.7)' : 'rgba(17,24,39,0.7)', 
                                            backdropFilter: 'blur(20px)',
                                            border: `1px solid ${isFirst ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`, 
                                            borderRadius: 24, padding: '2rem', textAlign: 'center', 
                                            position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
                                            boxShadow: isFirst ? `0 20px 60px ${glow}` : '0 15px 40px rgba(0,0,0,0.4)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* HUD Corners */}
                                        <div style={{ position: 'absolute', top: 12, left: 12, width: 10, height: 10, borderTop: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)' }} />
                                        <div style={{ position: 'absolute', bottom: 12, right: 12, width: 10, height: 10, borderBottom: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
                                        {/* Background ambient glow */}
                                        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle at top, ${glow}, transparent 60%)`, opacity: 0.15, pointerEvents: 'none' }} />
                                        
                                        {/* Rank Badge Header */}
                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                            <RankBadge rank={rank} />
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: isFirst ? '1rem' : '0.5rem', marginBottom: '1rem' }}>
                                            <div style={{ 
                                                width: isFirst ? 72 : 60, height: isFirst ? 72 : 60, borderRadius: '50%', 
                                                background: `linear-gradient(135deg, ${SCORE_COLOR(u.efficiencyScore)}, #F59E0B)`, 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                color: '#fff', fontSize: isFirst ? '1.75rem' : '1.5rem', fontWeight: 800,
                                                boxShadow: `0 0 20px ${glow}`, border: '3px solid rgba(255,255,255,0.1)'
                                            }}>
                                                {u.name?.charAt(0)}
                                            </div>
                                        </div>
                                        
                                        <div style={{ color: isFirst ? '#fff' : 'var(--color-text-main)', fontWeight: 800, fontSize: isFirst ? '1.2rem' : '1.05rem', marginBottom: '0.2rem' }}>{u.name}</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 'auto' }}>{u.position || 'Team Member'}</div>
                                        
                                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 900, color: SCORE_COLOR(u.efficiencyScore), fontFamily: 'JetBrains Mono', lineHeight: 1, marginBottom: '0.4rem', textShadow: `0 0 16px ${glow}` }}>
                                                {u.efficiencyScore}%
                                            </div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Efficiency Score</div>
                                        </div>
                                    </motion.div>
                                </TiltContainer>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Main Grid: Chart & Leaderboard ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                
                {/* Visual Chart */}
                {!isLoading && chartData.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        style={{ 
                            background: 'rgba(17,24,39,0.7)', backdropFilter: 'blur(16px)', 
                            border: '1px solid rgba(245,158,11,0.15)', borderRadius: 24, padding: '2rem', 
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', position: 'relative' 
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                            <TrendingUp size={18} color="#10B981" />
                            <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#F59E0B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'JetBrains Mono' }}>METRIC_SURGE_ANALYSIS</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
                                <defs>
                                    <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} dy={10} fontFamily="JetBrains Mono" />
                                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" fontFamily="JetBrains Mono" />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(245,158,11,0.03)' }}
                                    contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', padding: '1.25rem' }}
                                    itemStyle={{ fontFamily: 'JetBrains Mono' }}
                                />
                                <Bar dataKey="completion" fill="rgba(245,158,11,0.4)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                                <Bar dataKey="efficiency" radius={[6, 6, 0, 0]} maxBarSize={28} filter="url(#barGlow)">
                                    {chartData.map((d, i) => <Cell key={i} fill={SCORE_COLOR(d.efficiency)} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* Comprehensive Leaderboard */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={18} color="#F59E0B" />
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#E2E8F0', margin: 0 }}>Team Roster</h2>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {/* Headers */}
                        <div className="leaderboard-header" style={{ display: 'grid', gridTemplateColumns: '60px 2fr 1.5fr 1fr 1fr 1fr', gap: '1rem', padding: '0 1.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            <div style={{ textAlign: 'center' }}>Rank</div>
                            <div>Member Details</div>
                            <div>Task Status</div>
                            <div style={{ textAlign: 'center' }}>Completion</div>
                            <div style={{ textAlign: 'center' }}>Efficiency</div>
                            <div style={{ textAlign: 'right' }}>Total Points</div>
                        </div>

                        {/* Loading State */}
                        {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                        
                        {/* Empty State */}
                        {!isLoading && perf.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--glass-bg)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <AlertTriangle size={48} color="rgba(245,158,11,0.4)" style={{ marginBottom: '1.5rem' }} />
                                <h3 style={{ fontSize: '1.25rem', color: '#E2E8F0', marginBottom: '0.5rem' }}>No Data Available</h3>
                                <p style={{ color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 auto' }}>There are no active tasks or measurements recorded for {new Date(month + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })}.</p>
                            </div>
                        )}

                        {/* Data Rows */}
                        <AnimatePresence>
                            {!isLoading && perf.map((u, i) => {
                                const isCurrentUser = u._id === currentUserId || u.userId === currentUserId;
                                const trend = u.trend || 'neutral';
                                
                                return (
                                    <motion.div 
                                        key={u._id} 
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} 
                                        transition={{ delay: i * 0.05 }}
                                        className="leaderboard-row"
                                        style={{ 
                                            display: 'grid', gridTemplateColumns: '60px 2fr 1.5fr 1fr 1fr 1fr', 
                                            gap: '1rem', alignItems: 'center', padding: '1.25rem 1.5rem', 
                                            background: isCurrentUser ? 'rgba(245,158,11,0.08)' : 'rgba(17,24,39,0.5)', 
                                            backdropFilter: 'blur(12px)',
                                            border: `1px solid ${isCurrentUser ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.05)'}`, 
                                            borderRadius: 20, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                            position: 'relative', overflow: 'hidden'
                                        }}
                                        whileHover={{ scale: 1.015, background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(245,158,11,0.3)' }}
                                    >
                                        {/* Unread-style Accent Bar for Ranking Presence */}
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: isCurrentUser ? '#F59E0B' : 'transparent', boxShadow: isCurrentUser ? '0 0 10px #F59E0B' : 'none' }} />
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <RankBadge rank={i + 1} />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                                            <div style={{ 
                                                width: 42, height: 42, borderRadius: '50%', 
                                                background: `linear-gradient(135deg, ${SCORE_COLOR(u.efficiencyScore)}, #F59E0B)`, 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                color: '#fff', fontSize: '1.1rem', fontWeight: 800, flexShrink: 0, 
                                                boxShadow: isCurrentUser ? '0 0 15px rgba(245,158,11,0.4)' : 'none' 
                                            }}>
                                                {u.name?.charAt(0)}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <div style={{ color: isCurrentUser ? '#F59E0B' : 'var(--color-text-main)', fontSize: '0.95rem', fontWeight: isCurrentUser ? 800 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {u.name}
                                                    </div>
                                                    {isCurrentUser && <span style={{ fontSize: '0.6rem', background: '#F59E0B', color: '#111827', borderRadius: 6, padding: '0.1rem 0.4rem', fontWeight: 800 }}>YOU</span>}
                                                </div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.1rem' }}>{u.position || '—'}</div>
                                            </div>
                                        </div>

                                        <div className="leaderboard-row-tasks" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CheckCircle2 size={13} color="#10B981" />
                                                <span style={{ color: 'var(--color-text-main)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono' }}>{u.completedTasks} / {u.totalTasks} Done</span>
                                            </div>
                                            {u.overdueTasks > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <AlertTriangle size={13} color="#EF4444" />
                                                    <span style={{ color: '#EF4444', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{u.overdueTasks} Overdue</span>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                            <span style={{ color: '#10B981', fontSize: '1rem', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>{u.completionRate}%</span>
                                            <div style={{ width: '100%', maxWidth: 80, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                                <motion.div 
                                                    initial={{ width: 0 }} animate={{ width: `${u.completionRate}%` }} transition={{ duration: 1, delay: 0.5 }}
                                                    style={{ height: '100%', background: '#10B981', borderRadius: 3, boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} 
                                                />
                                            </div>
                                        </div>

                                        <div className="leaderboard-row-efficiency" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span style={{ color: SCORE_COLOR(u.efficiencyScore), fontWeight: 800, fontSize: '1.2rem', fontFamily: 'JetBrains Mono', textShadow: `0 0 10px ${SCORE_GLOW(u.efficiencyScore)}` }}>{u.efficiencyScore}%</span>
                                                {trend === 'up' && <TrendingUp size={14} color="#10B981" />}
                                                {trend === 'down' && <TrendingDown size={14} color="#EF4444" />}
                                            </div>
                                        </div>

                                        <div className="leaderboard-row-points" style={{ textAlign: 'right' }}>
                                            <div style={{ padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
                                                <Award size={14} color="#F59E0B" />
                                                <span style={{ color: '#F59E0B', fontSize: '0.9rem', fontFamily: 'JetBrains Mono', fontWeight: 800 }}>{u.rewardPoints}</span>
                                            </div>
                                        </div>
                                        
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Performance;
