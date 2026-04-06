import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, CheckCircle2, Circle, MoreVertical, Calendar, Trash2, Loader, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import DatePicker from '../components/DatePicker';
import TiltContainer from '../components/TiltContainer';

const API = import.meta.env.VITE_API_URL;

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [goalFilter, setGoalFilter] = useState('all'); // 'all' | 'active' | 'completed' | 'overdue'

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/goals`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch goals');
            const data = await res.json();
            setGoals(data);
        } catch (error) {
            console.error(error);
            toast.error('Could not load goals');
        } finally {
            setLoading(false);
        }
    };

    const toggleCompletion = async (id, currentStatus) => {
        // Optimistic update
        setGoals(prev => prev.map(g => g._id === id ? { ...g, isCompleted: !currentStatus } : g));

        try {
            const res = await fetch(`${API}/api/goals/${id}/toggle`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to update goal');
            if (!currentStatus) toast.success('Goal accomplished! 🎉');
        } catch (error) {
            console.error(error);
            toast.error('Could not update status');
            // Revert
            setGoals(prev => prev.map(g => g._id === id ? { ...g, isCompleted: currentStatus } : g));
        }
    };

    const deleteGoal = async (id) => {
        if (!window.confirm('Are you sure you want to delete this goal?')) return;
        try {
            const res = await fetch(`${API}/api/goals/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to delete goal');
            setGoals(prev => prev.filter(g => g._id !== id));
            toast.success('Goal deleted');
        } catch (error) {
            console.error(error);
            toast.error('Could not delete goal');
        }
    };

    // Derived stats
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.isCompleted).length;
    const overdueGoals = goals.filter(g => !g.isCompleted && g.deadline && new Date(g.deadline) < new Date()).length;
    const completionRate = totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0;

    const filteredGoals = goals.filter(g => {
        const isOverdue = !g.isCompleted && g.deadline && new Date(g.deadline) < new Date();
        if (goalFilter === 'active') return !g.isCompleted && !isOverdue;
        if (goalFilter === 'completed') return g.isCompleted;
        if (goalFilter === 'overdue') return isOverdue;
        return true;
    });

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Header section */}
            <div className="goals-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', position: 'relative' }}>
                {/* Ambient Glow */}
                <div className="ambient-orb float-anim" style={{ width: '500px', height: '500px', background: 'rgba(245, 158, 11, 0.15)', top: '-100px', left: '-100px', pointerEvents: 'none' }} />
                
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '1rem', margin: '0 0 0.5rem 0', letterSpacing: '-0.03em' }}>
                        <div style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', padding: '0.6rem', borderRadius: '14px', display: 'flex', boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}>
                            <Target size={28} color="white" />
                        </div>
                        Mission Control
                    </h1>
                    <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>SYS.TRACKING // OBJECTIVES & KEY RESULTS</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(17,24,39,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: '14px', padding: '0.75rem 1.25rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completion</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: completionRate === 100 ? '#10B981' : '#F59E0B', fontFamily: 'Manrope, Inter, sans-serif' }}>{completionRate}%</div>
                        </div>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '50%',
                            background: `conic-gradient(#F59E0B ${completionRate * 3.6}deg, rgba(255,255,255,0.06) ${completionRate * 3.6}deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(245,158,11,0.25)'
                        }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0B1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#F59E0B' }}>{completedGoals}/{totalGoals}</span>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(245,158,11,0.35)' }} whileTap={{ scale: 0.97 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#111827', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}
                    >
                        <Plus size={18} /> New Goal
                    </motion.button>
                </div>
                {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {[
                    { key: 'all', label: `All (${totalGoals})` },
                    { key: 'active', label: `Active (${totalGoals - completedGoals - overdueGoals})` },
                    { key: 'completed', label: `Completed (${completedGoals})` },
                    { key: 'overdue', label: `⚠ Overdue (${overdueGoals})` },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setGoalFilter(tab.key)}
                        style={{
                            padding: '0.35rem 0.85rem', borderRadius: 99, border: '1px solid', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                            background: goalFilter === tab.key ? (tab.key === 'overdue' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.13)') : 'transparent',
                            borderColor: goalFilter === tab.key ? (tab.key === 'overdue' ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)') : 'rgba(255,255,255,0.1)',
                            color: goalFilter === tab.key ? (tab.key === 'overdue' ? '#EF4444' : '#F59E0B') : '#6B7280',
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

            {/* Overdue banner */}
            {overdueGoals > 0 && goalFilter !== 'overdue' && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                    onClick={() => setGoalFilter('overdue')}>
                    <span style={{ fontSize: '1rem' }}>⚠️</span>
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', fontWeight: 600 }}>{overdueGoals} goal{overdueGoals > 1 ? 's are' : ' is'} overdue. Click to view.</span>
                </motion.div>
            )}
            {/* List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><Loader className="spinner" size={32} color="var(--brand-primary)" /></div>
            ) : filteredGoals.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Target size={28} color="#F59E0B" /></div>
                    <p className="empty-state-title">{goalFilter === 'all' ? 'No Goals Set' : `No ${goalFilter} goals`}</p>
                    <p className="empty-state-desc">{goalFilter === 'all' ? 'Define your first objective to start tracking progress.' : `You have no ${goalFilter} goals right now.`}</p>
                </div>
            ) : (
                <div className="goals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    <AnimatePresence>
                        {filteredGoals.map((goal, i) => (
                            <TiltContainer key={goal._id} intensity={15} style={{ height: '100%' }}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92 }}
                                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16,1,0.3,1] }}
                                    whileHover={{ y: -3, borderColor: goal.isCompleted ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.35)', boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
                                    style={{
                                        background: 'rgba(17,24,39,0.75)',
                                        backdropFilter: 'blur(16px)',
                                        WebkitBackdropFilter: 'blur(16px)',
                                        border: `1px solid ${goal.isCompleted ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.15)'}`,
                                        borderRadius: '18px',
                                        padding: '1.375rem',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        opacity: goal.isCompleted ? 0.8 : 1,
                                        transition: 'border-color 0.2s',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                                        willChange: 'transform',
                                        height: '100%'
                                    }}
                                >
                                    {goal.isCompleted && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: 'linear-gradient(180deg,#10B981,#059669)', borderRadius: '0 2px 2px 0' }} />
                                    )}

                                    {/* HUD Crosshairs */}
                                    <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', borderTop: '2px solid rgba(255,255,255,0.1)', borderRight: '2px solid rgba(255,255,255,0.1)' }} />
                                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '8px', height: '8px', borderBottom: '2px solid rgba(255,255,255,0.1)', borderLeft: '2px solid rgba(255,255,255,0.1)' }} />

                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', width: '100%', position: 'relative', zIndex: 1 }}>
                                        <button
                                            onClick={() => toggleCompletion(goal._id, goal.isCompleted)}
                                            style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginTop: '2px', color: goal.isCompleted ? 'var(--color-success)' : 'var(--color-text-muted)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <AnimatePresence>
                                                {goal.isCompleted && (
                                                    <motion.div
                                                        initial={{ scale: 0.2, opacity: 1 }}
                                                        animate={{ scale: 2.5, opacity: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.7, ease: "easeOut" }}
                                                        style={{ position: 'absolute', width: '40px', height: '40px', background: 'radial-gradient(circle, rgba(16,185,129,0.8) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}
                                                    />
                                                )}
                                            </AnimatePresence>
                                            {goal.isCompleted ? <CheckCircle2 size={24} style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.5))' }} /> : <Circle size={22} style={{ position: 'relative', zIndex: 2 }} />}
                                        </button>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-main)', textDecoration: goal.isCompleted ? 'line-through' : 'none', textDecorationColor: 'var(--color-text-muted)' }}>
                                                {goal.title}
                                            </h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                {goal.deadline && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: new Date(goal.deadline) < new Date() && !goal.isCompleted ? '#EF4444' : 'inherit' }}>
                                                        <Calendar size={13} /> {new Date(goal.deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button onClick={() => deleteGoal(goal._id)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--color-text-muted)', opacity: 0.5, transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.opacity = '1'; }} onMouseOut={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.opacity = '0.5'; }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            </TiltContainer>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateGoalModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onGoalCreated={(newGoal) => {
                            setGoals(prev => [newGoal, ...prev]);
                            setIsCreateModalOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const CreateGoalModal = ({ onClose, onGoalCreated }) => {
    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return toast.error('Title is required');

        try {
            setLoading(true);
            const res = await fetch(`${API}/api/goals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ title, deadline })
            });
            if (!res.ok) throw new Error('Failed to create goal');
            const data = await res.json();
            toast.success('Goal created');
            onGoalCreated(data);
        } catch (error) {
            console.error(error);
            toast.error('Could not create goal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}
            >
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--color-text-main)' }}>Create New Goal</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    <div className="input-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Goal Objective</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Launch V2 Marketing Campaign"
                            autoFocus
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid var(--border-default)', background: 'var(--glass-bg)', color: 'var(--color-text-main)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div className="input-group">
                        <DatePicker 
                            label="Target Deadline (optional)"
                            value={deadline}
                            onChange={setDeadline}
                            placeholder="Select goal deadline"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--color-text-main)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', background: 'var(--brand-primary)', color: 'white', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Creating...' : 'Set Goal'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Goals;
