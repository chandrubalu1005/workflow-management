import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAnimatedCounter } from '../../hooks/useAnimationSystem';
import { LayoutGrid, Table2 } from 'lucide-react';

// ─────────────────────────────────────────────
// AnimatedCounter
// ─────────────────────────────────────────────
export const AnimatedCounter = ({
    target = 0,
    duration = 1200,
    prefix = '',
    suffix = '',
    className = '',
    format = (n) => n.toLocaleString()
}) => {
    const value = useAnimatedCounter(target, duration);
    return (
        <span className={className}>
            {prefix}{format(value)}{suffix}
        </span>
    );
};

// ─────────────────────────────────────────────
// Inline Sparkline SVG
// ─────────────────────────────────────────────
export const Sparkline = ({ data = [], color = '#F59E0B', height = 40 }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 100;
    const h = height;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg className="sparkline-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

// ─────────────────────────────────────────────
// TrendBadge
// ─────────────────────────────────────────────
export const TrendBadge = ({ direction = 'neutral', text = '' }) => {
    const cls = direction === 'up' ? 'trend-badge trend-up'
        : direction === 'down' ? 'trend-badge trend-down'
            : 'trend-badge trend-neutral';
    const icon = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
    return (
        <span className={cls}>
            {icon} {text}
        </span>
    );
};

// ─────────────────────────────────────────────
// EnhancedBentoCard
// ─────────────────────────────────────────────
export const EnhancedBentoCard = ({
    children,
    onClick = null,
    className = '',
    colSpan = 1,
    rowSpan = 1,
    isLoading = false,
    delay = 0
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.48,
                ease: [0.16, 1, 0.3, 1],
                delay: delay
            }}
            whileHover={onClick ? { y: -4, scale: 1.02 } : undefined}
            onClick={onClick}
            style={{
                gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
                gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
                cursor: onClick ? 'pointer' : 'default'
            }}
            className={`
                glass-surface rounded-[20px] p-6
                transition-all duration-300
                ${onClick ? 'hover:glass-surface-elevated' : ''}
                ${className}
            `}
        >
            {isLoading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-8 bg-slate-700 rounded w-1/2"></div>
                </div>
            ) : (
                children
            )}
        </motion.div>
    );
};

// ─────────────────────────────────────────────
// GlassButton
// ─────────────────────────────────────────────
export const GlassButton = ({
    children,
    onClick = null,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    icon: Icon = null,
    glowing = false,
    ...props
}) => {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    const variantClasses = {
        primary: 'bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold',
        secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-50',
        ghost: 'bg-transparent hover:bg-slate-800 text-slate-200 border border-slate-600'
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            disabled={disabled || loading}
            onClick={onClick}
            className={`
                rounded-lg font-medium transition-all duration-200
                flex items-center gap-2 justify-center
                ${sizeClasses[size]}
                ${variantClasses[variant]}
                ${glowing ? 'btn-hover-glow' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
            `}
            {...props}
        >
            {loading && (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4"
                >
                    <div className="w-full h-full border-2 border-transparent border-t-current rounded-full" />
                </motion.div>
            )}
            {!loading && Icon && <Icon size={18} />}
            {children}
        </motion.button>
    );
};

// ─────────────────────────────────────────────
// AnimatedStatCard  (enhanced)
// ─────────────────────────────────────────────
export const AnimatedStatCard = ({
    label = 'Metric',
    value = 0,
    change = null,
    icon: Icon = null,
    trend = null,          // string shown below value e.g. "+5 high"
    trendDirection = 'neutral', // 'up' | 'down' | 'neutral'
    glowPulse = false,
    sparkData = null,      // array of numbers for sparkline
    delay = 0
}) => {
    return (
        <EnhancedBentoCard delay={delay} className={glowPulse ? 'glow-pulse-anim' : ''}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                {Icon && (
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        style={{
                            color: '#F59E0B',
                            padding: '10px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Icon size={20} />
                    </motion.div>
                )}
                {change && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            trendDirection === 'up'
                                ? 'bg-green-500/20 text-green-300'
                                : trendDirection === 'down'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-slate-500/20 text-slate-300'
                        }`}
                    >
                        {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→'} {change}%
                    </motion.div>
                )}
            </div>
            <div style={{ marginTop: '16px' }}>
                <p style={{ color: 'rgba(156, 163, 175, 1)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                <motion.div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'Manrope, Inter, sans-serif', lineHeight: 1 }}>
                    <AnimatedCounter
                        target={typeof value === 'number' ? value : 0}
                        duration={1200}
                        format={typeof value === 'number' ? (n) => n.toLocaleString() : undefined}
                        suffix={typeof value === 'string' && value.includes('%') ? '%' : ''}
                    />
                    {typeof value === 'string' && !value.includes('%') && (
                        <span style={{ fontSize: '2rem', fontWeight: 900 }}>{value}</span>
                    )}
                </motion.div>
                {trend && (
                    <div style={{ marginTop: '8px' }}>
                        <TrendBadge direction={trendDirection} text={trend} />
                    </div>
                )}
                {sparkData && <Sparkline data={sparkData} />}
            </div>
        </EnhancedBentoCard>
    );
};

// ─────────────────────────────────────────────
// PriorityHeatMap
// ─────────────────────────────────────────────
export const PriorityHeatMap = ({ tasks = [], onTileClick }) => {
    const priorities = [
        {
            key: 'critical',
            label: 'Critical',
            color: '#EF4444',
            cls: 'priority-tile-critical',
            pulseCls: 'critical-pulse-anim',
            icon: '🔴'
        },
        {
            key: 'high',
            label: 'High',
            color: '#F59E0B',
            cls: 'priority-tile-high',
            pulseCls: '',
            icon: '🟠'
        },
        {
            key: 'medium',
            label: 'Medium',
            color: '#3B82F6',
            cls: 'priority-tile-medium',
            pulseCls: '',
            icon: '🟡'
        },
        {
            key: 'low',
            label: 'Low',
            color: '#22C55E',
            cls: 'priority-tile-low',
            pulseCls: '',
            icon: '🟢'
        }
    ];

    const counts = {
        critical: tasks.filter(t => t.priority === 'critical' && t.status !== 'completed').length,
        high: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
        medium: tasks.filter(t => (t.priority === 'medium' || !t.priority) && t.status !== 'completed').length,
        low: tasks.filter(t => t.priority === 'low' && t.status !== 'completed').length,
    };

    return (
        <div style={{
            background: 'rgba(17,24,39,0.75)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '14px' }}>🎯</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#E5E7EB' }}>Priority Heatmap</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {priorities.map((p, i) => (
                    <motion.div
                        key={p.key}
                        className={`priority-tile ${p.cls} ${counts[p.key] > 0 && p.pulseCls ? p.pulseCls : ''}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -3, scale: 1.05 }}
                        onClick={() => onTileClick && onTileClick(p.key)}
                    >
                        <span style={{ fontSize: '20px', marginBottom: '6px' }}>{p.icon}</span>
                        <motion.span
                            style={{ fontSize: '1.8rem', fontWeight: 900, color: p.color, fontFamily: 'Manrope, Inter, sans-serif', lineHeight: 1 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 + i * 0.05 }}
                        >
                            <AnimatedCounter target={counts[p.key]} duration={900} />
                        </motion.span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: p.color, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>
                            {p.label}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// ViewToggle (Kanban / Table)
// ─────────────────────────────────────────────
export const ViewToggle = ({ view, onChange }) => (
    <div className="view-toggle-container">
        <button
            className={`view-toggle-btn ${view === 'kanban' ? 'active' : ''}`}
            onClick={() => onChange('kanban')}
        >
            <LayoutGrid size={15} /> Kanban
        </button>
        <button
            className={`view-toggle-btn ${view === 'table' ? 'active' : ''}`}
            onClick={() => onChange('table')}
        >
            <Table2 size={15} /> Table
        </button>
    </div>
);

// ─────────────────────────────────────────────
// GlassInput
// ─────────────────────────────────────────────
export const GlassInput = React.forwardRef(({
    label = null,
    placeholder = '',
    error = null,
    icon: Icon = null,
    ...props
}, ref) => {
    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium text-slate-200">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <motion.div
                        className="absolute left-3 top-3 text-slate-400"
                        whileHover={{ scale: 1.1 }}
                    >
                        <Icon size={18} />
                    </motion.div>
                )}
                <motion.input
                    ref={ref}
                    placeholder={placeholder}
                    className={`
                        w-full px-4 py-2.5 rounded-lg
                        bg-slate-800/40 backdrop-blur-sm
                        border border-slate-700 focus:border-amber-500
                        text-slate-50 placeholder-slate-500
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-amber-500/20
                        ${Icon ? 'pl-10' : ''}
                        ${error ? 'border-red-500 focus:border-red-600' : ''}
                    `}
                    whileFocus={{ scale: 1.02 }}
                    {...props}
                />
            </div>
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
});

GlassInput.displayName = 'GlassInput';

// ─────────────────────────────────────────────
// LoadingShimmer
// ─────────────────────────────────────────────
export const LoadingShimmer = ({ width = 'w-full', height = 'h-4', count = 3, className = '' }) => {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`shimmer-enhanced ${width} ${height} rounded-lg`}
                ></div>
            ))}
        </div>
    );
};
