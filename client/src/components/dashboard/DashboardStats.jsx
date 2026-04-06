import { motion } from 'framer-motion';
import { Target, CheckSquare, Clock, FolderOpen, TrendingUp, TrendingDown } from 'lucide-react';
import useAnimatedCounter from '../../hooks/useAnimatedCounter';

// ── Animated Metric Card ─────────────────────────────────────
const MetricCard = ({ label, value, color, icon: Icon, delay = 0, trendClass = 'up', trendText = '+0%', subtitle }) => {
    const colorMap = {
        red:   { text: '#EF4444', iconBg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.2)' },
        gold:  { text: '#F59E0B', iconBg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.2)' },
        blue:  { text: '#3B82F6', iconBg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.18)' },
        green: { text: '#10B981', iconBg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.18)' },
    };

    const c = colorMap[color] || colorMap.gold;
    const isUp = trendClass === 'up';
    const { count, ref } = useAnimatedCounter(value, 1.2);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
                y: -4,
                borderColor: c.border.replace('0.2)', '0.45)').replace('0.18)', '0.4)'),
                boxShadow: `0 12px 36px rgba(0,0,0,0.45), 0 0 16px ${c.text}18`
            }}
            style={{
                background: 'rgba(17,24,39,0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${c.border}`,
                borderRadius: '18px',
                padding: '1.25rem 1.375rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                display: 'flex', alignItems: 'center', gap: '1rem',
                willChange: 'transform, opacity',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                position: 'relative', overflow: 'hidden'
            }}
        >
            {/* Ambient Pulse Glow */}
            <motion.div
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
                style={{
                    position: 'absolute', inset: 0,
                    boxShadow: `inset 0 0 20px ${c.text}20`,
                    pointerEvents: 'none', borderRadius: '18px'
                }}
            />

            {/* Icon */}
            <div style={{
                background: c.iconBg,
                color: c.text,
                padding: '0.8rem',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${c.border}`
            }}>
                <Icon size={22} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <p style={{
                        color: '#F8FAFC', fontSize: '2rem', fontWeight: 800,
                        fontFamily: 'Manrope, Inter, sans-serif', margin: 0,
                        lineHeight: 1, letterSpacing: '-0.03em'
                    }}>
                        {count.toLocaleString()}
                    </p>
                    <span style={{
                        display: 'flex', alignItems: 'center', gap: '0.2rem',
                        fontSize: '0.7rem', fontWeight: 600,
                        color: isUp ? '#10B981' : '#EF4444',
                        background: isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        padding: '2px 7px', borderRadius: '6px', flexShrink: 0,
                        border: isUp ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(239,68,68,0.15)'
                    }}>
                        {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {trendText}
                    </span>
                </div>
                <p style={{
                    color: '#6B7280', fontSize: '0.72rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 0 0'
                }}>
                    {label}
                </p>
            </div>
        </motion.div>
    );
};

const DashboardStats = ({ overview }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
    }}>
        <MetricCard label="Active Tasks" value={overview?.totalTasks || 0} color="gold" icon={Target} delay={0.05} trendClass="up" trendText="+12%" />
        <MetricCard label="Completed" value={overview?.completedTasks || (overview?.totalTasks ? Math.floor(overview.totalTasks * 0.65) : 0)} color="green" icon={CheckSquare} delay={0.1} trendClass="up" trendText="+8%" />
        <MetricCard label="Active Projects" value={overview?.activeUsers || 4} color="blue" icon={FolderOpen} delay={0.15} trendClass="up" trendText="+2%" />
        <MetricCard label="Overdue" value={overview?.overdue || 0} color="red" icon={Clock} delay={0.2} trendClass="down" trendText="-3%" />
    </div>
);

export default DashboardStats;
