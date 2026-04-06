import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, User, Trash2, CheckCircle, AlertCircle, Save, X, Target, Clock, FileText, Briefcase, RefreshCw, Zap } from 'lucide-react';
import UserSelect from './UserSelect';
import DatePicker from './DatePicker';

const CreateTaskForm = ({ onSuccess, projectId }) => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [goals, setGoals] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        startDate: '',
        endDate: '',
        assignedToId: '',
        rewardPoints: '10'
    });
    const [statusMessage, setStatusMessage] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                const normalUsers = Array.isArray(data) ? data.filter(u => u.role === 'normal' || u.role !== 'admin') : [];
                setUsers(normalUsers);
            } catch (e) {
                console.error('Failed to load users');
            }
        };
        fetchUsers();
    }, []);

    const handleGoalChange = (index, field, value) => {
        const newGoals = [...goals];
        newGoals[index][field] = value;
        setGoals(newGoals);
    };

    const addGoal = () => {
        setGoals([...goals, { title: '', deadline: '', status: 'pending', rewardPoints: '50' }]);
    };

    const removeGoal = (index) => {
        const newGoals = goals.filter((_, i) => i !== index);
        setGoals(newGoals);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!formData.title || !formData.assignedToId || !formData.endDate) {
            setStatusMessage({ type: 'error', text: 'CRITICAL: Title, Assignment, and Deadline are required for operational validation.' });
            return;
        }

        setLoading(true);
        setStatusMessage(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    rewardPoints: Number(formData.rewardPoints),
                    project: projectId || undefined,
                    goals: goals.filter(g => g.title).map(g => ({
                        ...g,
                        rewardPoints: Number(g.rewardPoints || 0)
                    }))
                })
            });

            if (!response.ok) throw new Error('Failed to create task');

            setStatusMessage({ type: 'success', text: 'Task synchronized and deployed successfully 😊' });
            setTimeout(() => {
                setStatusMessage(null);
                if (onSuccess) onSuccess();
            }, 1500);

        } catch (err) {
            setStatusMessage({ type: 'error', text: 'Error in synchronization. System rejected input.' });
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.98, y: 15 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ width: '100%', margin: '0 auto' }}
        >
            {/* Unified Header */}
            <motion.div variants={itemVariants} style={{ marginBottom: '3rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '60px', height: '60px', background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 75%)', filter: 'blur(15px)' }} />
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.75rem' }}>
                    Generate <span style={{ color: '#F59E0B' }}>Neural Workflow</span>
                </h2>
                <p style={{ color: '#64748B', fontSize: '1rem', fontWeight: 500 }}>Global orchestration of operational units and objective parameters.</p>
            </motion.div>

            <AnimatePresence>
                {statusMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            padding: '1.25rem 1.5rem',
                            marginBottom: '2rem',
                            borderRadius: '16px',
                            background: statusMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            color: statusMessage.type === 'success' ? '#10B981' : '#F87171',
                            display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 600, fontSize: '0.9rem',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                        }}
                    >
                        {statusMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {statusMessage.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
                    
                    {/* ——— LEFT COLUMN: THE CORE ——— */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        
                        {/* Section 01: Core Parameters */}
                        <motion.section variants={itemVariants} className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', color: '#FBBF24' }}>
                                <FileText size={18} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Fundamental Identity</span>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                                <label className="form-label" style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700 }}>OPERATIONAL_TITLE</label>
                                <input
                                    className="form-input"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="Assign nomenclature..."
                                    style={{ background: 'rgba(0,0,0,0.2)', fontSize: '1.1rem', fontWeight: 700 }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700 }}>OBJECTIVE_CONTEXT</label>
                                <textarea
                                    className="form-input"
                                    rows={5}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Define strategic parameters and outcome requirements..."
                                    style={{ background: 'rgba(0,0,0,0.2)', resize: 'none' }}
                                />
                            </div>
                        </motion.section>

                        {/* Section 02: Temporal Alignment */}
                        <motion.section variants={itemVariants} className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', color: '#FBBF24' }}>
                                <Clock size={18} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Temporal Synchronization</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div className="form-group">
                                    <DatePicker label="Commencement" value={formData.startDate} onChange={v => setFormData({ ...formData, startDate: v })} />
                                </div>
                                <div className="form-group">
                                    <DatePicker label="System Deadline" value={formData.endDate} onChange={v => setFormData({ ...formData, endDate: v })} required />
                                </div>
                            </div>
                        </motion.section>
                    </div>

                    {/* ——— RIGHT COLUMN: RESOURCES & ROADMAP ——— */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        
                        {/* Section 03: Personnel & Rewards */}
                        <motion.section variants={itemVariants} className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(245,158,11,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', color: '#FBBF24' }}>
                                <User size={18} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Resource Allocation</span>
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label className="form-label" style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700 }}>PRIMARY_OPERATIVE</label>
                                <UserSelect users={users} value={formData.assignedToId} onChange={v => setFormData({ ...formData, assignedToId: v })} required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Priority Scale</label>
                                    <select className="form-input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)' }}>
                                        <option value="low">LOW_IMPACT</option>
                                        <option value="medium">MEDIUM_IMPACT</option>
                                        <option value="high">HIGH_SENSITIVITY</option>
                                        <option value="critical">CRITICAL_OVERRIDE</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reward Points ✨</label>
                                    <input className="form-input" type="number" value={formData.rewardPoints} onChange={e => setFormData({ ...formData, rewardPoints: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(245,158,11,0.3)', color: '#FBBF24', fontWeight: 700 }} />
                                </div>
                            </div>
                        </motion.section>

                        {/* Section 04: Tactical Roadmap */}
                        <motion.section variants={itemVariants} className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)', height: 'fit-content' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#FBBF24' }}>
                                    <Target size={18} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Operational Roadmap</span>
                                </div>
                                <motion.button
                                    type="button"
                                    onClick={addGoal}
                                    whileHover={{ scale: 1.05, background: 'rgba(245,158,11,0.1)' }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{ background: 'transparent', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B', fontSize: '0.7rem', fontWeight: 900, padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer' }}
                                >
                                    + ADD_UNIT
                                </motion.button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', paddingRight: '0.5rem', overflowY: 'auto' }}>
                                {goals.map((g, i) => (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ flex: 1 }}>
                                            <input className="form-input" placeholder="Phase objective..." value={g.title} onChange={e => handleGoalChange(i, 'title', e.target.value)} style={{ background: 'transparent', border: 'none', padding: '0 0.5rem', fontSize: '0.9rem', fontWeight: 600 }} />
                                        </div>
                                        <DatePicker value={g.deadline} onChange={v => handleGoalChange(i, 'deadline', v)} />
                                        <button type="button" onClick={() => removeGoal(i)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={16} /></button>
                                    </motion.div>
                                ))}
                                {goals.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '18px' }}>
                                        <p style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>No roadmap goals defined.</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    </div>
                </div>

                {/* FINAL DEPLOYMENT ACTION */}
                <motion.div
                    variants={itemVariants}
                    style={{
                        marginTop: '4rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.5rem',
                        padding: '3rem',
                        borderRadius: '32px',
                        background: 'radial-gradient(circle at 50% 100%, rgba(245,158,11,0.05) 0%, transparent 70%)',
                        borderTop: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
                        <Zap size={14} /> SYSTEM_READY_FOR_SYNCHRONIZATION
                    </div>
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02, background: '#FBBF24', boxShadow: '0 20px 50px rgba(245,158,11,0.4)' }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        style={{
                            background: '#F59E0B',
                            color: '#000',
                            padding: '1.25rem 5rem',
                            borderRadius: '20px',
                            fontSize: '1rem',
                            fontWeight: 900,
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            boxShadow: '0 10px 40px rgba(245,158,11,0.2)',
                            transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)'
                        }}
                    >
                        {loading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><RefreshCw size={18} /></motion.div>
                        ) : (
                            <>
                                <Save size={20} strokeWidth={3} /> INITIALIZE_DEPLOYMENT
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </form>
        </motion.div>
    );
};

export default CreateTaskForm;
