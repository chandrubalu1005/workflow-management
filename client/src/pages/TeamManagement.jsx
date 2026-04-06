import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, UserPlus, UserMinus, Crown, Search, Edit3, Trash2, ChevronDown, Check, LayoutGrid } from 'lucide-react';
import BenchPanel from '../components/BenchPanel';
import toast from 'react-hot-toast';
import TiltContainer from '../components/TiltContainer';

const API = import.meta.env.VITE_API_URL;

const TeamManagement = () => {
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [expandedTeam, setExpandedTeam] = useState(null);
    const [search, setSearch] = useState('');

    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [teamsRes, usersRes, tasksRes, projectsRes] = await Promise.all([
                fetch(`${API}/api/teams`, { headers }),
                fetch(`${API}/api/users`, { headers }),
                fetch(`${API}/api/tasks`, { headers }),
                fetch(`${API}/api/projects`, { headers })
            ]);
            const t = await teamsRes.json();
            const u = await usersRes.json();
            const tk = await tasksRes.json();
            const p = await projectsRes.json();
            setTeams(Array.isArray(t) ? t : []);
            setUsers(Array.isArray(u) ? u.filter(u => u.role !== 'admin') : []);
            setTasks(Array.isArray(tk) ? tk : []);
            setProjects(Array.isArray(p) ? p : []);
        } catch { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    };

    // Unassigned users (not in any team)
    const assignedIds = new Set(teams.flatMap(t => (t.members || []).map(m => m._id || m)));
    const unassigned = users.filter(u => !assignedIds.has(u._id));

    const createTeam = async (data) => {
        try {
            const res = await fetch(`${API}/api/teams`, { method: 'POST', headers, body: JSON.stringify(data) });
            if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
            toast.success('Team created!');
            fetchAll();
            setShowCreateModal(false);
        } catch (e) { toast.error(e.message || 'Failed to create team'); }
    };

    const deleteTeam = async (id) => {
        if (!confirm('Delete this team?')) return;
        try {
            await fetch(`${API}/api/teams/${id}`, { method: 'DELETE', headers });
            toast.success('Team deleted');
            fetchAll();
        } catch { toast.error('Failed to delete team'); }
    };

    const addMember = async (teamId, userId) => {
        try {
            const res = await fetch(`${API}/api/teams/${teamId}/members`, {
                method: 'POST', headers, body: JSON.stringify({ userIds: [userId] })
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
            toast.success('Member added');
            fetchAll();
        } catch (e) { toast.error(e.message || 'Failed to add member'); }
    };

    const removeMember = async (teamId, userId) => {
        try {
            await fetch(`${API}/api/teams/${teamId}/members/${userId}`, { method: 'DELETE', headers });
            toast.success('Member removed');
            fetchAll();
        } catch { toast.error('Failed to remove member'); }
    };

    const setLead = async (teamId, userId) => {
        try {
            await fetch(`${API}/api/teams/${teamId}`, {
                method: 'PUT', headers, body: JSON.stringify({ lead: userId })
            });
            toast.success('Lead updated');
            fetchAll();
        } catch { toast.error('Failed to set lead'); }
    };

    const COLORS = ['#F59E0B', '#3B82F6', '#EF4444', '#10B981', '#F97316', '#64748B', '#06B6D4', '#EAB308'];

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}
        >
            {/* Header */}
            <div className="projects-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{
                        fontSize: '2rem', fontWeight: 800,
                        color: 'var(--color-text-main)'
                    }}>
                        Team Architect
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Build, manage, and optimize your workforce teams
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        padding: '0.7rem 1.5rem', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        border: 'none', color: '#111827', fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        boxShadow: '0 4px 20px rgba(245,158,11,0.2)', fontFamily: 'Inter'
                    }}
                >
                    <Plus size={18} /> Create Team
                </motion.button>
            </div>

            {/* Stats Row */}
            <div className="team-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Teams', value: teams.length, color: '#F59E0B' },
                    { label: 'Assigned Members', value: assignedIds.size, color: '#3B82F6' },
                    { label: 'Unassigned', value: unassigned.length, color: unassigned.length > 0 ? '#F97316' : '#10B981' }
                ].map((stat, i) => (
                    <TiltContainer key={i} intensity={15} style={{ height: '100%' }}>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
                                borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--color-border)',
                                height: '100%', boxSizing: 'border-box'
                            }}
                        >
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '0.5rem' }}>{stat.label}</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        </motion.div>
                    </TiltContainer>
                ))}
            </div>

            {/* Team Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <AnimatePresence>
                    {teams.map(team => {
                        const capacity = (team.members?.length || 0) / (team.maxCapacity || 10);
                        const isExpanded = expandedTeam === team._id;

                        return (
                            <TiltContainer key={team._id} intensity={15} style={{ height: '100%' }}>
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: -4, borderColor: 'rgba(245, 158, 11, 0.4)', boxShadow: '0 12px 32px rgba(245, 158, 11, 0.1)' }}
                                    style={{
                                        background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
                                        borderRadius: '20px', border: `1px solid ${team.color || 'var(--color-primary)'}33`,
                                        overflow: 'hidden',
                                        transition: 'var(--transition-smooth)',
                                        height: '100%', display: 'flex', flexDirection: 'column'
                                    }}
                                >
                                    {/* Team Header */}
                                    <div
                                        onClick={() => setExpandedTeam(isExpanded ? null : team._id)}
                                        style={{
                                            padding: '1.25rem', cursor: 'pointer',
                                            borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.04)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                            {/* Circular Progress Ring wrapping Team Icon */}
                                            <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <svg width="64" height="64" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 8px ${team.color || '#F59E0B'}40)` }}>
                                                    <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
                                                    <motion.circle
                                                        cx="32" cy="32" r="28"
                                                        stroke={capacity > 0.8 ? '#EF4444' : capacity > 0.5 ? '#F97316' : team.color || '#F59E0B'}
                                                        strokeWidth="4" fill="none" strokeLinecap="round"
                                                        initial={{ strokeDasharray: '176 176', strokeDashoffset: 176 }}
                                                        whileInView={{ strokeDashoffset: 176 - (Math.min(capacity, 1) * 176) }}
                                                        viewport={{ once: true }} transition={{ duration: 1.2, ease: 'easeOut' }}
                                                    />
                                                </svg>
                                                <div style={{
                                                    width: '46px', height: '46px', borderRadius: '50%',
                                                    background: `${team.color || '#F59E0B'}22`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.4rem'
                                                }}>
                                                    {team.icon || '👥'}
                                                </div>
                                            </div>
                                            
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: 'var(--color-text-main)', fontWeight: 800, fontSize: '1.15rem' }}>{team.name}</div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                                                    {team.lead?.name ? <><Crown size={12} color="#F59E0B" /> Led by {team.lead.name}</> : 'No lead assigned'}
                                                    <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>|</span>
                                                    <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{team.members?.length || 0}/{team.maxCapacity || 10}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.35rem', alignSelf: 'flex-start' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteTeam(team._id); }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: '0.35rem', borderRadius: '8px' }}
                                                    onMouseOver={e => e.currentTarget.style.color = '#EF4444'}
                                                    onMouseOut={e => e.currentTarget.style.color = '#4B5563'}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    style={{ color: '#4B5563', padding: '0.35rem' }}
                                                >
                                                    <ChevronDown size={16} />
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Stats and Avatars */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                            {/* Avatar stack */}
                                            <div style={{ display: 'flex' }}>
                                                {(team.members || []).slice(0, 5).map((m, i) => (
                                                    <div key={m._id || i} style={{
                                                        width: '28px', height: '28px', borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                                                        border: '2px solid var(--color-bg-main)', marginLeft: i > 0 ? '-8px' : 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontSize: '0.65rem', fontWeight: 700, zIndex: 5 - i,
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.1)'; e.currentTarget.style.zIndex = 10; e.currentTarget.style.boxShadow = '0 6px 12px rgba(245,158,11,0.4)'; e.currentTarget.style.borderColor = '#F59E0B'; }}
                                                    onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.zIndex = 5 - i; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--color-bg-main)'; }}
                                                    >
                                                        {m.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                ))}
                                                {(team.members?.length || 0) > 5 && (
                                                    <div style={{
                                                        width: '28px', height: '28px', borderRadius: '50%',
                                                        background: 'var(--color-bg-secondary)', border: '2px solid var(--color-bg-main)',
                                                        marginLeft: '-8px', display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.6rem', fontWeight: 700
                                                    }}>
                                                        +{team.members.length - 5}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Task Count Badge */}
                                            <div style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '6px',
                                                background: 'rgba(245, 158, 11, 0.1)',
                                                color: '#f59e0b',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem'
                                            }}>
                                                <span style={{ fontSize: '0.9rem' }}>📋</span>
                                                {tasks.filter(tk => tk.assignment?.targetId?._id === team._id || tk.assignment?.targetId === team._id).filter(tk => tk.status !== 'completed').length} Active Tasks
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Members List */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{ padding: '0 1.25rem 1rem 1.25rem' }}>
                                                    {/* Visual Org Builder Tree */}
                                                    <div style={{ position: 'relative', marginTop: '0.5rem', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(255,255,255,0.1)', marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {(team.members || []).map(member => (
                                                        <div key={member._id} style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                            position: 'relative'
                                                        }}>
                                                            {/* Connector Node line */}
                                                            <div style={{ position: 'absolute', left: '-1.5rem', top: '50%', width: '1.25rem', height: '2px', background: 'rgba(255,255,255,0.1)' }} />
                                                            
                                                            <div style={{
                                                                width: '32px', height: '32px', borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                color: '#000', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
                                                                boxShadow: '0 0 10px rgba(245,158,11,0.3)'
                                                            }}>
                                                                {member.name?.charAt(0)?.toUpperCase()}
                                                            </div>
                                                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <div style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                                    {member.name}
                                                                    {team.lead?._id === member._id && (
                                                                        <Crown size={12} color="#F59E0B" />
                                                                    )}
                                                                </div>
                                                                <div style={{ color: '#64748B', fontSize: '0.7rem' }}>{member.position || member.email}</div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                                <button
                                                                    onClick={() => setLead(team._id, member._id)}
                                                                    title="Set as lead"
                                                                    style={{
                                                                        background: team.lead?._id === member._id ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                                                                        border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
                                                                        color: team.lead?._id === member._id ? '#F59E0B' : '#64748B',
                                                                        padding: '0.4rem', borderRadius: '8px', transition: 'all 0.2s'
                                                                    }}
                                                                    onMouseOver={e => e.currentTarget.style.color = '#F59E0B'}
                                                                    onMouseOut={e => e.currentTarget.style.color = team.lead?._id === member._id ? '#F59E0B' : '#64748B'}
                                                                >
                                                                    <Crown size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => removeMember(team._id, member._id)}
                                                                    title="Remove from team"
                                                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', color: '#64748B', padding: '0.4rem', borderRadius: '8px', transition: 'all 0.2s' }}
                                                                    onMouseOver={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                                                                    onMouseOut={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                                                                >
                                                                    <UserMinus size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    </div>

                                                    {/* Add from bench */}
                                                    {unassigned.length > 0 && (
                                                        <div style={{ marginTop: '0.75rem' }}>
                                                            <div style={{ color: 'var(--color-primary)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: '0.25rem' }}>
                                                                Add from bench
                                                            </div>
                                                            <BenchPanel
                                                                unassigned={unassigned}
                                                                onAdd={(userId) => addMember(team._id, userId)}
                                                                projects={projects}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </TiltContainer>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Bench — Unassigned Users */}
            {unassigned.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'var(--glass-bg)', borderRadius: '24px',
                        border: '1px solid var(--color-border)', padding: '2rem',
                        boxShadow: 'var(--shadow-lg)'
                    }}
                >
                    <h3 style={{ color: 'var(--color-text-main)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={20} color="var(--color-warning)" />
                        </div>
                        Global Bench
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>— {unassigned.length} Professionals Available</span>
                    </h3>

                    <BenchPanel
                        unassigned={unassigned}
                        onAdd={(uid) => {
                            // In global view, "Add" could open a modal to select a team, 
                            // but for now let's just show the info or keep it as-is if the user didn't specify.
                            // The user said "ADD FROM BENCH section inside the Team Card", so I'll keep the onAdd for the card.
                            // In global bench, maybe we don't need the Add button or it does something else.
                            // Let's hide the add button in global bench or make it non-functional unless a team is selected.
                            toast.info('Expand a team card to add members from there! 🚀');
                        }}
                        projects={projects}
                    />
                </motion.div>
            )}

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#4B5563' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <Users size={28} />
                    </motion.div>
                </div>
            )}

            {/* Empty State */}
            {!loading && teams.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <Users size={48} color="#1F2937" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ color: '#94A3B8', fontWeight: 700 }}>No teams yet</h3>
                    <p style={{ color: '#4B5563', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Create your first team to start organizing your workforce.</p>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: '0.65rem 1.5rem', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                            border: 'none', color: '#111827', fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'Inter'
                        }}
                    >
                        <Plus size={16} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'middle' }} /> Create Team
                    </motion.button>
                </div>
            )}

            {/* Create Team Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateTeamModal
                        onClose={() => setShowCreateModal(false)}
                        onCreate={createTeam}
                        colors={COLORS}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/* ── Create Team Modal ───────────────────────────────────── */
const CreateTeamModal = ({ onClose, onCreate, colors }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#F59E0B');
    const [icon, setIcon] = useState('👥');
    const [maxCapacity, setMaxCapacity] = useState(10);
    const [description, setDescription] = useState('');

    const ICONS = ['👥', '🚀', '⚡', '🎯', '🛡️', '💡', '🔧', '📐', '🎨', '📊'];

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                    position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
                    width: '460px', zIndex: 9999,
                    background: 'var(--bg-overlay)', backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(245,158,11,0.15)',
                    borderRadius: '20px', padding: '2rem',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ color: '#E2E8F0', fontWeight: 800, fontSize: '1.25rem' }}>New Team</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Name */}
                    <div>
                        <label style={{ fontSize: '0.65rem', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Team Name</label>
                        <input
                            value={name} onChange={e => setName(e.target.value)}
                            placeholder="e.g. Development"
                            autoFocus
                            style={{
                                width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0',
                                fontSize: '0.9rem', fontFamily: 'Inter', outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ fontSize: '0.65rem', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Description</label>
                        <input
                            value={description} onChange={e => setDescription(e.target.value)}
                            placeholder="What does this team do?"
                            style={{
                                width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0',
                                fontSize: '0.9rem', fontFamily: 'Inter', outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Color + Icon */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.65rem', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Color</label>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                {colors.map(c => (
                                    <button key={c} onClick={() => setColor(c)} style={{
                                        width: '28px', height: '28px', borderRadius: '8px',
                                        background: c, border: color === c ? '2px solid #fff' : '2px solid transparent',
                                        cursor: 'pointer', transition: 'all 0.15s'
                                    }} />
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.65rem', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Icon</label>
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                {ICONS.map(ic => (
                                    <button key={ic} onClick={() => setIcon(ic)} style={{
                                        width: '28px', height: '28px', borderRadius: '8px',
                                        background: icon === ic ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                                        border: icon === ic ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                        cursor: 'pointer', fontSize: '0.9rem', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>{ic}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Capacity */}
                    <div>
                        <label style={{ fontSize: '0.65rem', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Max Capacity</label>
                        <input
                            type="number" min={1} max={50}
                            value={maxCapacity} onChange={e => setMaxCapacity(+e.target.value)}
                            style={{
                                width: '100px', padding: '0.6rem 0.75rem', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0',
                                fontSize: '0.875rem', fontFamily: 'JetBrains Mono, monospace', outline: 'none'
                            }}
                        />
                    </div>

                    {/* Submit */}
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => { if (name.trim()) onCreate({ name, color, icon, description, maxCapacity }); }}
                        disabled={!name.trim()}
                        style={{
                            padding: '0.75rem', borderRadius: '14px',
                            background: name.trim() ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255,255,255,0.06)',
                            border: 'none', color: name.trim() ? '#111827' : '#4B5563',
                            fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed',
                            fontFamily: 'Inter', fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        <Check size={16} /> Create Team
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
};

export default TeamManagement;
