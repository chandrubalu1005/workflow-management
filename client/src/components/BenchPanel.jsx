import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, ChevronDown, UserPlus, Info,
    TrendingUp, Award, Clock, AlertTriangle, Hash, Zap
} from 'lucide-react';

const WorkloadRing = ({ score, size = 32 }) => {
    const radius = (size / 2) - 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s) => {
        if (s >= 76) return '#EF4444';
        if (s >= 41) return '#F59E0B';
        return '#10B981';
    };

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="transparent"
            />
            <motion.circle
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: "easeOut" }}
                cx={size / 2} cy={size / 2} r={radius}
                stroke={getColor(score)} strokeWidth="2" fill="transparent"
                strokeDasharray={circumference}
                strokeLinecap="round"
            />
        </svg>
    );
};

const UserRow = ({ user, onAdd, projectCount = 0 }) => {
    const isOverloaded = (user.workloadScore || 0) > 85;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -2, background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(59, 130, 246, 0.3)' }}
            style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.75rem 1rem', borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                marginBottom: '0.5rem', cursor: 'default',
                transition: 'border-color 0.2s, background 0.2s',
                position: 'relative'
            }}
        >
            {/* Avatar & Ring */}
            <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
                <WorkloadRing score={user.workloadScore || 0} size={36} />
                <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 800, color: '#000',
                    position: 'absolute', top: '4px', left: '4px'
                }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                </div>
                {/* Availability Dot */}
                <div style={{
                    position: 'absolute', bottom: '0', right: '0',
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: user.status === 'active' ? '#10B981' : '#6B7280',
                    border: '2px solid #0F1219'
                }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: 'var(--color-text-main)', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.name}
                    </span>
                    {isOverloaded && <AlertTriangle size={12} color="#EF4444" title="High Workload Warning" />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                    <span style={{
                        fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                        background: 'rgba(245, 158, 11, 0.1)', color: 'var(--brand-primary)',
                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em'
                    }}>
                        {user.position || 'Specialist'}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Zap size={10} /> {projectCount} Projects
                    </span>
                </div>
            </div>

            {/* Add Button */}
            <motion.button
                whileHover={{ scale: 1.1, background: 'rgba(245, 158, 11, 0.2)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onAdd(user._id)}
                style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--color-text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s'
                }}
            >
                <UserPlus size={16} />
            </motion.button>

            {/* Hover Tooltip (Simulated with absolute div or just browser title for now, or dedicated component if needed) */}
        </motion.div>
    );
};

const BenchPanel = ({ unassigned, onAdd, projects = [] }) => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [sortBy, setSortBy] = useState('Least Workload');
    const [isGrouped, setIsGrouped] = useState(false);

    const roles = useMemo(() => {
        const unique = ['All Roles', ...new Set(unassigned.map(u => u.position).filter(Boolean))];
        return unique.map(r => ({
            label: r,
            count: r === 'All Roles' ? unassigned.length : unassigned.filter(u => u.position === r).length
        }));
    }, [unassigned]);

    const filteredAndSorted = useMemo(() => {
        let result = unassigned.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                (u.position || '').toLowerCase().includes(search.toLowerCase());
            const matchesRole = roleFilter === 'All Roles' || u.position === roleFilter;
            return matchesSearch && matchesRole;
        });

        result.sort((a, b) => {
            if (sortBy === 'Least Workload') return (a.workloadScore || 0) - (b.workloadScore || 0);
            if (sortBy === 'Most Experienced') return (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0);
            if (sortBy === 'Highest Performance') return (b.totalRewardPoints || 0) - (a.totalRewardPoints || 0);
            if (sortBy === 'Recently Active') return new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0);
            if (sortBy === 'Alphabetical') return a.name.localeCompare(b.name);
            return 0;
        });

        return result;
    }, [unassigned, search, roleFilter, sortBy]);

    const groupedData = useMemo(() => {
        if (!isGrouped) return null;
        const groups = {};
        filteredAndSorted.forEach(u => {
            const role = u.position || 'Uncategorized';
            if (!groups[role]) groups[role] = [];
            groups[role].push(u);
        });
        return groups;
    }, [filteredAndSorted, isGrouped]);

    return (
        <div style={{ marginTop: '1rem' }}>
            {/* Header Controls */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyBetween: 'space-between',
                gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search bench..."
                        style={{
                            width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            color: 'var(--color-text-main)', fontSize: '0.75rem', outline: 'none'
                        }}
                    />
                </div>

                <select
                    value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                    style={{
                        padding: '0.5rem 0.75rem', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--color-text-main)',
                        fontSize: '0.75rem', outline: 'none', cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.6rem center',
                        paddingRight: '1.8rem'
                    }}
                >
                    {roles.map(r => (
                        <option key={r.label} value={r.label} style={{ background: '#111827', color: '#F8FAFC' }}>
                            {r.label} ({r.count})
                        </option>
                    ))}
                </select>

                <select
                    value={sortBy} onChange={e => setSortBy(e.target.value)}
                    style={{
                        padding: '0.5rem 0.75rem', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--color-text-main)',
                        fontSize: '0.75rem', outline: 'none', cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.6rem center',
                        paddingRight: '1.8rem'
                    }}
                >
                    <option style={{ background: '#111827', color: '#F8FAFC' }}>Least Workload</option>
                    <option style={{ background: '#111827', color: '#F8FAFC' }}>Most Experienced</option>
                    <option style={{ background: '#111827', color: '#F8FAFC' }}>Highest Performance</option>
                    <option style={{ background: '#111827', color: '#F8FAFC' }}>Recently Active</option>
                    <option style={{ background: '#111827', color: '#F8FAFC' }}>Alphabetical</option>
                </select>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setIsGrouped(!isGrouped)}
                    style={{
                        padding: '0.5rem', borderRadius: '10px',
                        background: isGrouped ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: isGrouped ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem'
                    }}
                >
                    <Filter size={12} /> {isGrouped ? 'Ungroup' : 'Group'}
                </motion.button>
            </div>

            {/* Scrollable Bench Panel */}
            <div className="scrollbar-thin" style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                <AnimatePresence mode="popLayout">
                    {isGrouped ? (
                        Object.entries(groupedData).map(([role, groupUsers]) => (
                            <div key={role} style={{ marginBottom: '1.5rem' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    marginBottom: '0.75rem', position: 'sticky', top: 0,
                                    background: 'var(--glass-bg)', zIndex: 2, padding: '0.25rem 0'
                                }}>
                                    <ChevronDown size={14} color="var(--color-text-muted)" />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                                        {role} ({groupUsers.length})
                                    </span>
                                </div>
                                {groupUsers.map(u => (
                                    <UserRow
                                        key={u._id} user={u} onAdd={onAdd}
                                        projectCount={projects.filter(p => p.members?.includes(u._id)).length}
                                    />
                                ))}
                            </div>
                        ))
                    ) : (
                        filteredAndSorted.map(u => (
                            <UserRow
                                key={u._id} user={u} onAdd={onAdd}
                                projectCount={projects.filter(p => p.members?.includes(u._id)).length}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BenchPanel;
