import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Check, CheckCheck, Trash2, ShieldAlert,
    Activity, Filter, Info, ShieldCheck, RefreshCw, X, Zap, Target, Server
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import TiltContainer from '../../components/TiltContainer';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

/* ─── Premium SAAS Amber Typography & Colors ──────────────────────────────── */
const TYPE_META = {
    assignment:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: '📋', label: 'Assignment' },
    deadline:     { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  icon: '⏰', label: 'Deadline'   },
    overload:     { color: '#F97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', icon: '⚡', label: 'Overload'   },
    team_update:  { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', icon: '👥', label: 'Team'       }, // Changed from blue to Amber-yellow
    system:       { color: '#D97706', bg: 'rgba(217,119,6,0.12)',  border: 'rgba(217,119,6,0.25)',  icon: '⚙️', label: 'System'     }, // Changed from purple to Deep Amber
    completion:   { color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', icon: '🏆', label: 'Completed'  }, // Success is green
    reassignment: { color: '#EA580C', bg: 'rgba(234,88,12,0.12)',  border: 'rgba(234,88,12,0.25)',  icon: '🔄', label: 'Reassign'   },
};

/* ─── Skeleton loader ───────────────────────────────────────────────────── */
const SkeletonRow = () => (
    <div style={{
        display: 'flex', gap: '1.5rem', padding: '1.5rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center',
        background: 'rgba(17,24,39,0.3)', position: 'relative', overflow: 'hidden'
    }}>
        <motion.div 
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: 0, left: 0, width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)', pointerEvents: 'none' }}
        />
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ height: 16, width: '35%', borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ height: 12, width: '60%', borderRadius: 4, background: 'rgba(255,255,255,0.03)' }} />
        </div>
        <div style={{ width: 80, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
    </div>
);

/* ─── Premium Empty State ───────────────────────────────────────────────── */
const EmptyState = ({ isAdmin, filterType, filterUnread }) => {
    const hasFilter = filterType || filterUnread;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                textAlign: 'center', padding: '8rem 2rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem',
                position: 'relative'
            }}
        >
            <div style={{ position: 'relative' }}>
                {/* Radar Scanning Ring */}
                <motion.div 
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    style={{ position: 'absolute', top: '-10px', left: '-10px', right: '-10px', bottom: '-10px', border: '2px solid rgba(245,158,11,0.3)', borderRadius: '40px', pointerEvents: 'none' }}
                />
                <div style={{
                    width: 100, height: 100, borderRadius: 32,
                    background: 'rgba(245,158,11,0.05)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1
                }}>
                    <Bell size={42} color="#F59E0B" style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))' }} />
                </div>
            </div>
            
            <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', marginBottom: '0.75rem', letterSpacing: '-0.02em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
                    {hasFilter ? 'Signals: Not Found' : 'Channel: Clear'}
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#94A3B8', maxWidth: 400, margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter' }}>
                    {hasFilter
                        ? 'Broadcasting scan with current parameters yielded zero results. Adjust filtering matrix to resume signal capture.'
                        : isAdmin
                            ? 'All tactical systems reporting optimal status. Command feed is currently idle. Deep-space monitoring remains active.'
                            : 'Personal transmission log is empty. You are currently in a high-focus state with zero pending interruptions.'}
                </p>
                {!hasFilter && (
                    <motion.div 
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{ marginTop: '1.5rem', fontSize: '0.65rem', color: '#F59E0B', fontWeight: 900, fontFamily: 'JetBrains Mono', letterSpacing: '0.3em' }}
                    >
                        SCANNING_FOR_INCOMING...
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

/* ─── Type Filter Chip ──────────────────────────────────────────────────── */
const FilterChip = ({ label, icon, active, color, count, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: 12,
            border: `1px solid ${active ? color : 'rgba(255,255,255,0.05)'}`,
            background: active ? `${color}15` : 'var(--glass-bg)',
            color: active ? color : 'var(--color-text-muted)',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            fontFamily: 'Inter', transition: 'all 0.2s',
            boxShadow: active ? `0 0 15px ${color}20` : 'none'
        }}
    >
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span>{label}</span>
        {count > 0 && (
            <span style={{
                padding: '0.1rem 0.4rem', borderRadius: 8,
                background: active ? color : 'rgba(0,0,0,0.3)', 
                color: active ? '#000' : 'inherit',
                fontSize: '0.7rem', fontWeight: 800
            }}>{count}</span>
        )}
    </motion.button>
);

/* ─── Notification Row ──────────────────────────────────────────────────── */
const NotifRow = ({ n, onMark, onDelete }) => {
    const cfg = TYPE_META[n.type] || TYPE_META.system;
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, height: 0, padding: 0, margin: 0, overflow: 'hidden', transition: { duration: 0.3 } }}
            style={{
                display: 'flex', alignItems: 'center', gap: '1.5rem',
                padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: n.read ? 'transparent' : 'linear-gradient(90deg, rgba(245,158,11,0.08), rgba(245,158,11,0.01))',
                position: 'relative', transition: 'background 0.3s',
            }}
            whileHover={{ background: 'rgba(255,255,255,0.02)' }}
        >
            {/* Unread Accent Signal */}
            {!n.read && (
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: '3px', background: 'linear-gradient(180deg, #F59E0B, #D97706)',
                    boxShadow: '0 0 15px rgba(245,158,11,0.6)',
                    zIndex: 2
                }} />
            )}

            {/* Type Icon */}
            <div style={{
                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', boxShadow: !n.read ? `0 0 20px ${cfg.color}30` : 'none'
            }}>
                {cfg.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{
                        color: n.read ? '#E2E8F0' : '#F59E0B',
                        fontWeight: n.read ? 600 : 800, fontSize: '1.05rem', letterSpacing: '-0.01em',
                        textShadow: !n.read ? '0 0 10px rgba(245,158,11,0.3)' : 'none'
                    }}>
                        {n.title}
                    </span>
                    {!n.read && (
                        <span style={{
                            padding: '0.15rem 0.5rem', borderRadius: 8,
                            background: 'rgba(245,158,11,0.2)', color: '#F59E0B',
                            fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em',
                            border: '1px solid rgba(245,158,11,0.3)'
                        }}>New</span>
                    )}
                    <span style={{
                        padding: '0.15rem 0.6rem', borderRadius: 8,
                        background: cfg.bg, color: cfg.color, fontSize: '0.75rem', fontWeight: 700,
                        border: `1px solid ${cfg.border}`
                    }}>{cfg.label}</span>
                </div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                    {n.message}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
                    <Info size={12} />
                    {new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

             {/* Actions */}
            <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
                {!n.read && (
                    <motion.button
                        whileHover={{ y: -1, background: 'rgba(16,185,129,0.2)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onMark(n._id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.55rem 1rem', borderRadius: 10,
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                            color: '#10B981', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 900,
                            fontFamily: 'JetBrains Mono', letterSpacing: '0.05em',
                            boxShadow: '0 5px 15px rgba(16,185,129,0.1)', transition: 'all 0.2s'
                        }}
                    >
                        <Check size={14} /> ACKNOWLEDGE
                    </motion.button>
                )}
                <motion.button
                    whileHover={{ scale: 1.1, color: '#EF4444', background: 'rgba(239,68,68,0.15)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(n._id)}
                    style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                >
                    <X size={16} />
                </motion.button>
            </div>
        </motion.div>
    );
};

/* ─── Role-Specific Insight Banners ─────────────────────────────────────── */
const AdminBanner = ({ total, unread }) => (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
            marginTop: '2rem', padding: '1.5rem 2rem',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))',
            borderRadius: 20, border: '1px solid rgba(245,158,11,0.25)',
            display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 0 40px rgba(245,158,11,0.05)',
            position: 'relative', overflow: 'hidden'
        }}
    >
        {/* Shimmer effect */}
        <motion.div 
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.03), transparent)', pointerEvents: 'none' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '2rem' }}>
            <Server size={22} color="#F59E0B" style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.5))' }} />
            <div>
                <span style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 900, fontFamily: 'JetBrains Mono' }}>SIGNAL_MATRIX</span>
                <div style={{ fontSize: '1rem', color: '#10B981', fontWeight: 900, fontFamily: 'JetBrains Mono' }}>ACTIVE.100%</div>
            </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity size={22} color="#FBBF24" />
            <div>
                <span style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 900, fontFamily: 'JetBrains Mono' }}>POLLING_RATE</span>
                <div style={{ fontSize: '1rem', color: '#F8FAFC', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>0.5hz</div>
            </div>
        </div>

        <div style={{ flex: 1 }} />
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'JetBrains Mono', lineHeight: 1 }}>{unread}</div>
                <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900, marginTop: '2px' }}>PENDING</div>
            </div>
            <div style={{ height: 40, width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#E2E8F0', fontFamily: 'JetBrains Mono', lineHeight: 1 }}>{total}</div>
                <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900, marginTop: '2px' }}>ARCHIVE</div>
            </div>
        </div>
    </motion.div>
);

const UserBanner = ({ unread }) => (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
            marginTop: '1.75rem', padding: '1.25rem 1.75rem',
            background: 'linear-gradient(90deg, rgba(245,158,11,0.1), rgba(0,0,0,0.2))',
            borderRadius: 16, border: '1px solid rgba(245,158,11,0.15)',
            display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
        }}
    >
        <div style={{ padding: '0.5rem', background: '#F59E0B', borderRadius: 10, color: '#000' }}>
            <Target size={20} />
        </div>
        <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                {unread > 0 ? `You have ${unread} pending items requiring attention.` : `You're all caught up for the day!`}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                Focus on completing your top priority tasks from the My Work dashboard.
            </div>
        </div>
    </motion.div>
);

/* ─── Main Component ────────────────────────────────────────────────────── */
const Notifications = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [filterType, setFilterType]     = useState('');
    const [filterUnread, setFilterUnread] = useState(false);
    const [data, setData]                 = useState(null);
    const [isLoading, setIsLoading]       = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const intervalRef = useRef(null);

    const fetchNotifications = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterType)   params.set('type', filterType);
            if (filterUnread) params.set('unread', 'true');
            const res = await fetch(`${API}/api/notifications?${params}`, { headers: authHeaders() });
            if (res.ok) setData(await res.json());
        } catch (_) { /* silent fail */ }
        setIsLoading(false);
    }, [filterType, filterUnread]);

    useEffect(() => {
        fetchNotifications();
        intervalRef.current = setInterval(() => fetchNotifications(true), 30000);
        return () => clearInterval(intervalRef.current);
    }, [fetchNotifications]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchNotifications(true);
        setIsRefreshing(false);
        toast.success('Inbox sync complete');
    };

    const markOne = async (id) => {
        await fetch(`${API}/api/notifications/${id}/read`, { method: 'PUT', headers: authHeaders() });
        fetchNotifications(true);
    };

    const markAll = async () => {
        await fetch(`${API}/api/notifications/read-all`, { method: 'PUT', headers: authHeaders() });
        toast.success('Inbox zero attained! 🎯');
        fetchNotifications(true);
    };

    const deleteOne = async (id) => {
        await fetch(`${API}/api/notifications/${id}`, { method: 'DELETE', headers: authHeaders() });
        fetchNotifications(true);
    };

    const clearAll = async () => {
        if (!window.confirm('Delete all notification records permanently?')) return;
        await fetch(`${API}/api/notifications/clear-all`, { method: 'DELETE', headers: authHeaders() });
        toast.success('All records eradicated');
        fetchNotifications(true);
    };

    const notifications = data?.notifications || [];
    const unreadCount   = data?.unreadCount   || 0;
    const totalCount    = data?.total          || 0;

    const typeCounts = notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
    }, {});

    /* ─── Render ── */
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ paddingBottom: '3rem', maxWidth: 1200, margin: '0 auto', width: '100%' }}
        >
            {/* ── Cinematic Header ── */}
            <div className="notif-header" style={{
                background: 'rgba(17,24,39,0.75)',
                backdropFilter: 'blur(24px)',
                borderRadius: 24, padding: '3rem', marginBottom: '2.5rem',
                border: '1px solid rgba(245,158,11,0.18)', position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}>
                {/* Background Strategic Glow */}
                <div style={{
                    position: 'absolute', top: '-100px', left: '-50px', width: '500px', height: '500px',
                    background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
                    filter: 'blur(80px)', pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', position: 'relative', zIndex: 1 }}>
                    {/* Title & Metadata */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.75rem' }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 16,
                                background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#111827',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 30px rgba(245,158,11,0.4)', position: 'relative'
                            }}>
                                {isAdmin ? <ShieldAlert size={28} /> : <Zap size={28} fill="#111827" />}
                                {/* HUD Corner accents */}
                                <div style={{ position: 'absolute', top: -2, left: -2, width: 8, height: 8, borderTop: '2px solid #F59E0B', borderLeft: '2px solid #F59E0B' }} />
                                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderBottom: '2px solid #F59E0B', borderRight: '2px solid #F59E0B' }} />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '2.75rem', fontWeight: 950, color: '#F8FAFC', letterSpacing: '-0.04em', margin: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    Communications
                                    {unreadCount > 0 && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                            style={{
                                                fontSize: '0.7rem', fontWeight: 900,
                                                background: 'rgba(239,68,68,0.15)', color: '#EF4444',
                                                borderRadius: '6px', padding: '0.2rem 0.6rem',
                                                border: '1px solid rgba(239,68,68,0.3)', fontFamily: 'JetBrains Mono', letterSpacing: '0.05em'
                                            }}
                                        >
                                            {unreadCount} UNREAD
                                        </motion.div>
                                    )}
                                </h1>
                                <p style={{ margin: 0, color: '#F59E0B', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', marginTop: '0.25rem' }}>
                                    SYS.HUD // COMMAND_SIGNAL_FEED
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <motion.button whileHover={{ scale: 1.05, background: 'rgba(245,158,11,0.1)' }} whileTap={{ scale: 0.95 }}
                            onClick={handleRefresh}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.75rem 1.25rem', borderRadius: 12,
                                background: 'var(--glass-bg)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--color-text-main)', cursor: 'pointer',
                                fontFamily: 'Inter', fontSize: '0.9rem', fontWeight: 700,
                                transition: 'all 0.2s'
                            }}
                        >
                            <motion.span animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.8, ease: "linear", repeat: isRefreshing ? Infinity : 0 }}>
                                <RefreshCw size={16} color="#F59E0B" />
                            </motion.span>
                            Sync
                        </motion.button>

                        {unreadCount > 0 && (
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={markAll}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.75rem 1.25rem', borderRadius: 12,
                                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', 
                                    border: '1px solid rgba(16,185,129,0.3)',
                                    color: '#10B981', cursor: 'pointer',
                                    fontFamily: 'Inter', fontSize: '0.9rem', fontWeight: 700,
                                    boxShadow: '0 4px 15px rgba(16,185,129,0.1)'
                                }}
                            >
                                <CheckCheck size={16} /> Mark All Read
                            </motion.button>
                        )}

                        {notifications.length > 0 && (
                            <motion.button whileHover={{ scale: 1.05, background: 'rgba(239,68,68,0.15)' }} whileTap={{ scale: 0.95 }}
                                onClick={clearAll}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.75rem 1.25rem', borderRadius: 12,
                                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                                    color: '#EF4444', cursor: 'pointer',
                                    fontFamily: 'Inter', fontSize: '0.9rem', fontWeight: 700
                                }}
                            >
                                <Trash2 size={16} /> Clear Log
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Intelligent Insight Banners based on Role */}
                {data && (
                    isAdmin ? <AdminBanner total={totalCount} unread={unreadCount} /> : <UserBanner unread={unreadCount} />
                )}
            </div>

            {/* ── Filter Engine ── */}
            <div className="notif-filters" style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                marginBottom: '2rem', flexWrap: 'wrap',
                background: 'rgba(17,24,39,0.5)', padding: '1.25rem', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingRight: '1.25rem', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                    <Server size={18} color="#F59E0B" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: 'JetBrains Mono' }}>
                        SIGNAL_FILTERS
                    </span>
                </div>

                {/* Primary Unread Toggle */}
                <FilterChip
                    label="URGENT_UNREAD"
                    icon="📡"
                    active={filterUnread}
                    color="#F59E0B"
                    count={unreadCount}
                    onClick={() => setFilterUnread(v => !v)}
                />

                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }} />

                {/* All View */}
                <FilterChip
                    label="MASTER_LOG"
                    icon="📊"
                    active={!filterType}
                    color="#E2E8F0"
                    count={0}
                    onClick={() => setFilterType('')}
                />

                {/* Dynamic Type Chips */}
                {Object.entries(TYPE_META).map(([type, cfg]) => {
                    const count = typeCounts[type] || 0;
                    if (count === 0 && filterType !== type) return null;
                    return (
                        <FilterChip
                            key={type}
                            label={cfg.label.toUpperCase()}
                            icon={cfg.icon}
                            active={filterType === type}
                            color={cfg.color}
                            count={count}
                            onClick={() => setFilterType(filterType === type ? '' : type)}
                        />
                    );
                })}
            </div>

            {/* ── Dynamic Event List ── */}
            <div style={{
                background: 'var(--glass-bg)', border: '1px solid rgba(245,158,11,0.15)',
                borderRadius: 24, overflow: 'hidden', minHeight: 450,
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : notifications.length === 0 ? (
                    <EmptyState isAdmin={isAdmin} filterType={filterType} filterUnread={filterUnread} />
                ) : (
                    <AnimatePresence mode="popLayout">
                        {notifications.map(n => (
                            <NotifRow key={n._id} n={n} onMark={markOne} onDelete={deleteOne} />
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Pagination Metadata ── */}
            {!isLoading && data?.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                    <div style={{ 
                        padding: '0.5rem 1rem', background: 'var(--glass-bg)', border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: 12, color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'JetBrains Mono' 
                    }}>
                        Page {data.page} / {data.pages} <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0.5rem' }}>|</span> {data.total} Total Logs
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default Notifications;
