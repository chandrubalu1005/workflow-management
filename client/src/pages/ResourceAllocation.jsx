import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, Filter, RefreshCw,
    AlertTriangle, CheckCircle, MoreVertical,
    Briefcase, Zap, Shield, Target, Code, Cpu, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import TiltContainer from '../components/TiltContainer';

const API = import.meta.env.VITE_API_URL;

// Generate mock skills based on role for richer UI
const getRoleSkills = (role) => {
    const r = (role || '').toLowerCase();
    if (r.includes('dev') || r.includes('engineer')) return ['React', 'Node.js', 'System Design'];
    if (r.includes('design')) return ['Figma', 'UI/UX', 'Prototyping'];
    if (r.includes('manager') || r.includes('lead')) return ['Agile', 'Planning', 'Strategy'];
    if (r.includes('test') || r.includes('qa')) return ['Automation', 'Jest', 'Cypress'];
    return ['Problem Solving', 'Communication'];
};

// Skill chip icon mapping
const getSkillIcon = (skill, size = 12) => {
    const s = skill.toLowerCase();
    if (s.includes('react') || s.includes('node') || s.includes('code') || s.includes('jest')) return <Code size={size} />;
    if (s.includes('design') || s.includes('figma') || s.includes('ui')) return <Target size={size} />;
    if (s.includes('manage') || s.includes('agile') || s.includes('plan')) return <Briefcase size={size} />;
    if (s.includes('system') || s.includes('auto')) return <Cpu size={size} />;
    return <Zap size={size} />;
};

const WorkloadRing = ({ value, size = 50 }) => {
    const r = (size - 8) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (value / 100) * circumference;
    const isOver = value > 80;
    const color = isOver ? '#EF4444' : value > 50 ? '#F59E0B' : '#10B981';
    
    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: isOver ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))' : 'none' }}>
                <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.05)" strokeWidth={4} fill="none" />
                <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={4} fill="none"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)' }} />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fill: color, color: color, fontSize: '0.65rem', fontWeight: 800, fontFamily: 'JetBrains Mono', letterSpacing: '-0.05em' }}>{value}%</span>
            </div>
            {isOver && (
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1px solid ${color}`, opacity: 0.3 }}
                />
            )}
        </div>
    );
};

const ResourceAllocation = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterLoad, setFilterLoad] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [showReassign, setShowReassign] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [roles, setRoles] = useState([]);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [wlRes, usersRes] = await Promise.all([
                    fetch(`${API}/api/analytics/workload`, { headers }),
                    fetch(`${API}/api/users`, { headers }),
                ]);
                const wl = await wlRes.json();
                const us = await usersRes.json();
                const data = Array.isArray(wl) ? wl : [];
                setUsers(data);
                setAllUsers(Array.isArray(us) ? us.filter(u => u.role !== 'admin') : []);
                const uniqueRoles = [...new Set(data.map(u => u.position).filter(Boolean))];
                setRoles(uniqueRoles);
            } catch (err) {
                toast.error('Failed to load resource data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filtered = users.filter(u => {
        if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.position?.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterRole && u.position !== filterRole) return false;
        if (filterLoad === 'overloaded' && u.load <= 80) return false;
        if (filterLoad === 'moderate' && (u.load <= 50 || u.load > 80)) return false;
        if (filterLoad === 'available' && u.load > 50) return false;
        if (filterStatus && u.status !== filterStatus) return false;
        return true;
    });

    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selected.size === filtered.length) setSelected(new Set());
        else setSelected(new Set(filtered.map(u => u._id)));
    };

    const bulkReassign = async (targetUserId) => {
        try {
            const ids = [...selected];
            await Promise.all(ids.map(uid =>
                fetch(`${API}/api/tasks/bulk-reassign`, {
                    method: 'POST', headers,
                    body: JSON.stringify({ fromUserId: uid, toUserId: targetUserId })
                })
            ));
            toast.success(`Reassigned tasks from ${ids.length} member(s)`);
            setSelected(new Set());
            setShowReassign(false);
        } catch {
            toast.error('Bulk reassign failed');
        }
    };

    const RowItem = ({ u }) => {
        if (!u) return null;
        const isOver = u.load > 80;
        const borderColor = selected.has(u._id) ? '#F59E0B' : isOver ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.08)';
        const glow = selected.has(u._id) ? '0 0 20px rgba(245, 158, 11, 0.15)' : isOver ? '0 0 30px rgba(239, 68, 68, 0.1)' : 'none';
        
        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -6, borderColor: selected.has(u._id) ? '#FBBF24' : isOver ? '#EF4444' : 'rgba(255,255,255,0.2)' }}
                style={{ 
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', 
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${borderColor}`, 
                    borderRadius: '24px', 
                    padding: '1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.25rem', 
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                    position: 'relative',
                    boxShadow: glow,
                    overflow: 'hidden'
                }}
            >
                {/* Background ambient light if overloaded */}
                {isOver && (
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: '40%', background: 'radial-gradient(ellipse at top, rgba(239,68,68,0.15), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: isOver ? 'linear-gradient(135deg, #EF4444, #991B1B)' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '1.2rem', fontWeight: 800, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                                {u.name?.charAt(0)}
                            </div>
                            <div style={{ position: 'absolute', bottom: -4, right: -4, width: '14px', height: '14px', borderRadius: '50%', background: u.status === 'offline' ? '#6B7280' : '#10B981', border: '2px solid #0F172A' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{u.name}</div>
                            <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 500, marginTop: '0.1rem' }}>{u.position || 'No role'}</div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.2rem' }} title="Options">
                            <MoreVertical size={18} />
                        </button>
                        <input type="checkbox" checked={selected.has(u._id)} onChange={() => toggleSelect(u._id)}
                            style={{ accentColor: '#F59E0B', width: '18px', height: '18px', cursor: 'pointer' }} />
                    </div>
                </div>

                {/* Skills/Tags Row */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', zIndex: 1 }}>
                    {getRoleSkills(u.position).map(skill => (
                        <span key={skill} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', color: '#CBD5E1', fontSize: '0.65rem', fontWeight: 600 }}>
                            {getSkillIcon(skill)} {skill}
                        </span>
                    ))}
                </div>
                
                {/* Stats Container (Glass) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem', zIndex: 1 }}>
                    {/* Active Tasks & Score */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Active Tasks</span>
                            <span style={{ color: '#F8FAFC', fontSize: '1.1rem', fontWeight: 800 }}>{u.activeTasks || 0}</span>
                        </div>
                        <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Velocity</span>
                            <span style={{ color: '#F59E0B', fontSize: '1.1rem', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>{Math.round((u.totalRewardPoints || 0) / 10)}</span>
                        </div>
                    </div>

                    {/* Workload Widget */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isOver ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '16px', border: `1px solid ${isOver ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.03)'}` }}>
                        <WorkloadRing value={u.load || 0} size={54} />
                        <span style={{ color: isOver ? '#EF4444' : '#94A3B8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                            {isOver ? 'Overloaded' : 'Capacity'}
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: '3rem', maxWidth: '1400px', margin: '0 auto' }}>
            
            {/* Cinematic Header */}
            <div className="analytics-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', position: 'relative' }}>
                {/* Ambient glow */}
                <div style={{ position: 'absolute', top: '-130px', left: '-80px', width: '650px', height: '650px', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: -1, pointerEvents: 'none' }} />
                <div>
                    <h1 style={{ fontSize: '2.75rem', fontWeight: 950, color: '#F8FAFC', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', letterSpacing: '-0.04em' }}>
                        <div style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', padding: '0.8rem', borderRadius: '16px', display: 'flex', boxShadow: '0 10px 40px rgba(245,158,11,0.35)' }}>
                            <Shield size={28} color="#111827" />
                        </div>
                        Resource Matrix
                    </h1>
                    <p style={{ color: '#F59E0B', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', marginLeft: '0.25rem' }}>
                        MODULE: <strong style={{ color: '#CBD5E1' }}>WORKFORCE_INTELLIGENCE</strong> // CAPACITY_MAP
                    </p>
                </div>
                
                <AnimatePresence>
                    {selected.size > 0 && (
                        <motion.button 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(245,158,11,0.4)' }} whileTap={{ scale: 0.95 }}
                            onClick={() => setShowReassign(true)}
                            style={{ 
                                padding: '0.75rem 1.5rem', borderRadius: '14px', 
                                background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', 
                                color: '#111827', fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter', 
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
                            }}
                        >
                            <RefreshCw size={16} /> Reassign Tasks ({selected.size})
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Premium Summary Cards */}
            <div className="resource-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {[
                    { label: 'Total Workforce', value: users.length, icon: Users, color: '#3B82F6', text: 'Active Members' },
                    { label: 'Critical Load', value: users.filter(u => u.load > 80).length, icon: AlertTriangle, color: '#EF4444', text: 'Need Assistance' },
                    { label: 'Available Bandwidth', value: users.filter(u => u.load <= 50).length, icon: CheckCircle, color: '#10B981', text: 'Ready for Tasks' },
                ].map((s, i) => (
                    <TiltContainer key={s.label} intensity={15} style={{ height: '100%' }}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5, type: 'spring' }}
                            style={{ 
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', 
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', 
                                padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', height: '100%',
                                position: 'relative', overflow: 'hidden'
                            }}
                        >
                            {/* Decorative Glow */}
                            <div style={{ position: 'absolute', right: '-20%', top: '-20%', width: '100px', height: '100px', background: s.color, filter: 'blur(50px)', opacity: 0.15, pointerEvents: 'none' }} />
                            
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <s.icon size={28} color={s.color} />
                            </div>
                            <div>
                                <div style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: '0.25rem' }}>{s.label}</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F8FAFC', fontFamily: 'JetBrains Mono', lineHeight: 1 }}>{s.value}</span>
                                    <span style={{ color: s.color, fontSize: '0.8rem', fontWeight: 700 }}>{s.text}</span>
                                </div>
                            </div>
                        </motion.div>
                    </TiltContainer>
                ))}
            </div>

            {/* Control Panel (Filters & Search) */}
            <div style={{ 
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '20px', padding: '1rem', marginBottom: '2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' 
            }}>
                
                {/* Search */}
                <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search resources by name or skill..."
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', color: '#F8FAFC', fontFamily: 'Inter', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }} 
                        onFocus={e => e.target.style.border = '1px solid rgba(245,158,11,0.5)'}
                        onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.06)'}
                    />
                </div>
                
                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                        <Filter size={14} color="#64748B" />
                        <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>Filters</span>
                    </div>

                    {[
                        { val: filterRole, set: setFilterRole, label: 'All Disciplines', opts: roles.map(r => ({ v: r, l: r })) },
                        { val: filterLoad, set: setFilterLoad, label: 'Capacity Level', opts: [{ v: 'overloaded', l: 'Overloaded (>80%)' }, { v: 'moderate', l: 'Moderate (50-80%)' }, { v: 'available', l: 'Available (<50%)' }] },
                    ].map((f, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                            <select value={f.val} onChange={e => f.set(e.target.value)}
                                style={{ 
                                    padding: '0.65rem 2.5rem 0.65rem 1rem', borderRadius: '12px', 
                                    background: f.val ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)', 
                                    border: `1px solid ${f.val ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`, 
                                    color: f.val ? '#F59E0B' : '#CBD5E1', 
                                    fontFamily: 'Inter', fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'none',
                                    transition: 'all 0.2s'
                                }}>
                                <option value="" style={{ background: '#0F172A', color: '#fff' }}>{f.label}</option>
                                {f.opts.map(o => <option key={o.v} value={o.v} style={{ background: '#0F172A', color: '#fff' }}>{o.l}</option>)}
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: f.val ? '#F59E0B' : '#64748B', pointerEvents: 'none' }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Action Bar (Select All) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={selectAll}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${selected.size === filtered.length && filtered.length > 0 ? '#F59E0B' : '#64748B'}`, background: selected.size === filtered.length && filtered.length > 0 ? '#F59E0B' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        {selected.size === filtered.length && filtered.length > 0 && <CheckCircle size={12} color="#111827" strokeWidth={4} />}
                    </div>
                    <span style={{ color: '#CBD5E1', fontWeight: 600, fontSize: '0.9rem' }}>Select All Matrix Resources</span>
                </div>
                <div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>Showing {filtered.length} of {users.length}</div>
            </div>

            {/* Matrix Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '8rem 2rem' }}>
                    <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(245, 158, 11, 0.1)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }} />
                    <div style={{ color: '#94A3B8', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Initializing Matrix Nodes...</div>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Users size={48} color="#334155" style={{ marginBottom: '1rem' }} />
                    <div style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>No Resources Found</div>
                    <div style={{ color: '#64748B', fontSize: '0.9rem' }}>Adjust your filters or search parameters.</div>
                </div>
            ) : (
                <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
                    <AnimatePresence>
                        {filtered.map((u, i) => (
                            <RowItem key={u._id} u={u} index={i} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Supreme Reassign Modal */}
            <AnimatePresence>
                {showReassign && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowReassign(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', zIndex: 9998 }} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '480px', zIndex: 9999, background: '#0F172A', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset' }}>
                            
                            {/* Modal Header */}
                            <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(180deg, rgba(245,158,11,0.05) 0%, transparent 100%)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <RefreshCw size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '1.25rem', m: 0 }}>Strategic Reallocation</h3>
                                    </div>
                                </div>
                                <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                    You are shifting all active tasks from <strong style={{ color: '#F59E0B' }}>{selected.size}</strong> matrix nodes. Select the target recipient carefully to avoid overloading.
                                </p>
                            </div>

                            {/* Recipient List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto', padding: '1.5rem 2rem' }} className="custom-scrollbar">
                                <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Available Targets</div>
                                {allUsers.filter(u => !selected.has(u._id)).map(u => (
                                    <motion.button key={u._id} onClick={() => bulkReassign(u._id)}
                                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'left', transition: ' border-color 0.2s' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '1.1rem', fontWeight: 800 }}>
                                                {u.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 700 }}>{u.name}</div>
                                                <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{u.position || 'Available Node'}</div>
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700 }}>
                                            Assign
                                        </div>
                                    </motion.button>
                                ))}
                                {allUsers.filter(u => !selected.has(u._id)).length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.85rem' }}>No unselected targets available.</div>
                                )}
                            </div>
                            
                            {/* Cancel */}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem 2rem', background: 'rgba(0,0,0,0.2)' }}>
                                <button onClick={() => setShowReassign(false)} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94A3B8', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background='rgba(255,255,255,0.05)'} onMouseOut={e => e.target.style.background='transparent'}>
                                    Cancel Operation
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ResourceAllocation;
