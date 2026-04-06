import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Activity, Clock, CheckCircle, Target } from 'lucide-react';

const SummaryCard = ({ label, value, subtext, trend, trendValue, icon: Icon, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '16px' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245,158,11,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)'
            }}>
                <Icon size={18} />
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: trend === 'up' ? 'var(--color-success)' : '#EF4444',
                background: trend === 'up' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px'
            }}>
                {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {trendValue}
            </div>
        </div>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>{label}</p>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em' }}>{value}</div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0' }}>{subtext}</p>
    </motion.div>
);

const PerformanceOverview = () => {
    const metrics = [
        { label: "Completion Rate", value: "94.2%", subtext: "Average across all teams", trend: "up", trendValue: "+2.4%", icon: Target },
        { label: "Avg Delivery Time", value: "4.2 Days", subtext: "-0.5 days from target", trend: "up", trendValue: "12%", icon: Clock },
        { label: "On-Time Delivery", value: "88.7%", subtext: "Within ±2 hour window", trend: "down", trendValue: "1.2%", icon: CheckCircle },
        { label: "Growth Velocity", value: "+24%", subtext: "Output vs last quarter", trend: "up", trendValue: "8.4%", icon: Activity }
    ];

    return (
        <section style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {metrics.map((m, idx) => (
                    <SummaryCard key={m.label} {...m} delay={idx * 0.05} />
                ))}
            </div>
        </section>
    );
};

export default PerformanceOverview;
