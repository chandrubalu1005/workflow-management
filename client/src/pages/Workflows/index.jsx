import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    GitBranch, Play, Plus, Zap, Clock, 
    CheckCircle, ArrowRight, Trash2, 
    AlertCircle, Settings, UserPlus, 
    Bell, RefreshCw, X, Share2, Activity,
    Shield, Command, Cpu, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;

const Workflows = () => {
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [users, setUsers] = useState([]);
    const [activeNode, setActiveNode] = useState(null);

    // New Automation State
    const [newAuto, setNewAuto] = useState({
        name: '',
        trigger: { type: 'status_change', field: 'status', value: 'completed' },
        actions: [{ type: 'notify_user', targetId: '', value: '' }]
    });

    useEffect(() => {
        fetchAutomations();
        fetchUsers();
    }, []);

    const fetchAutomations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/tasks/automations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setAutomations(data);
        } catch (error) {
            toast.error('Failed to calibrate neural flows');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API}/api/users`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (e) {}
    };

    const handleCreate = async () => {
        if (!newAuto.name) return toast.error('Identification label required');
        try {
            const token = localStorage.getItem('token');
            // Support singular action for current API compatibility but multi-action for UI
            const payload = {
                ...newAuto,
                action: newAuto.actions[0] 
            };
            const res = await fetch(`${API}/api/tasks/automations`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Collision detected');
            toast.success('Flow synchronization complete');
            setShowCreate(false);
            fetchAutomations();
        } catch (error) {
            toast.error('Initialization failure');
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API}/api/tasks/automations/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setAutomations(prev => prev.filter(a => a._id !== id));
            toast.success('Neural link severed');
        } catch (error) {
            toast.error('Relay deletion failed');
        }
    };

    const getTriggerLabel = (trigger) => {
        if (trigger.type === 'status_change') return `Status ➔ ${trigger.value}`;
        if (trigger.type === 'priority_change') return `Priority ➔ ${trigger.value}`;
        return 'Task Event Detect';
    };

    const getActionIcon = (type) => {
        switch(type) {
            case 'notify_user': return <Bell size={14} />;
            case 'assign_user': return <UserPlus size={14} />;
            case 'change_status': return <RefreshCw size={14} />;
            default: return <Zap size={14} />;
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
                <div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Flow <span style={{ color: '#F59E0B' }}>Orchestrator</span>
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10B981', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(16,185,129,0.1)', padding: '0.3rem 0.7rem', borderRadius: '20px' }}>
                            <Activity size={12} /> ENGINE_STABLE
                        </div>
                        <p style={{ color: '#64748B', fontSize: '1rem' }}>Autonomous logic relays directing workspace velocity.</p>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '0.8rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>Active Relays</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FBBF24' }}>{automations.length}</div>
                        </div>
                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(245,158,11,0.4)' }} whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreate(true)}
                            style={{ background: '#F59E0B', border: 'none', borderRadius: '12px', padding: '0.8rem 1.4rem', color: '#000', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(245,158,11,0.2)' }}
                        >
                            <Plus size={18} strokeWidth={3} /> INITIALIZE FLOW
                        </motion.button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ width: 48, height: 48, border: '3px solid rgba(245,158,11,0.1)', borderTopColor: '#F59E0B', borderRadius: '50%' }} />
                    <div style={{ color: '#475569', fontFamily: 'JetBrains Mono', letterSpacing: '0.2em', fontSize: '0.8rem' }}>CALIBRATING_FLUID_LOGIC...</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.5rem' }}>
                    {automations.map((auto, idx) => (
                        <motion.div 
                            key={auto._id}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onHoverStart={() => setActiveNode(auto._id)}
                            onHoverEnd={() => setActiveNode(null)}
                            className="glass-panel hover-lift"
                            style={{ 
                                padding: '1.5rem', position: 'relative', overflow: 'hidden',
                                border: `1px solid ${activeNode === auto._id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`,
                                background: activeNode === auto._id ? 'rgba(245,158,11,0.03)' : 'rgba(255,255,255,0.01)'
                            }}
                        >
                            {/* Visual Connection Path */}
                            <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} width="100%" height="100%">
                                <motion.path 
                                    d="M 60 70 L 380 70" 
                                    stroke="rgba(245,158,11,0.1)" 
                                    strokeWidth="2" 
                                    fill="none"
                                    animate={{ strokeDashoffset: [0, -20], opacity: activeNode === auto._id ? 1 : 0.3 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    strokeDasharray="5 5"
                                />
                            </svg>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                                            <Cpu size={18} />
                                        </div>
                                        <h3 style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>{auto.name}</h3>
                                    </div>
                                    <button onClick={() => handleDelete(auto._id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.4rem', opacity: activeNode === auto._id ? 1 : 0.3, transition: '0.2s' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B' }}>
                                    {/* Trigger Node */}
                                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.4rem', color: '#475569' }}>Trigger</div>
                                        <div style={{ color: '#CBD5E1', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <Play size={12} fill="currentColor" /> {getTriggerLabel(auto.trigger)}
                                        </div>
                                    </div>

                                    <div style={{ color: '#F59E0B', opacity: 0.5 }}><ArrowRight size={20} /></div>

                                    {/* Action Node */}
                                    <div style={{ flex: 1, background: 'rgba(245,158,11,0.05)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.1)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.4rem', color: '#F59E0B' }}>Action Relay</div>
                                        <div style={{ color: '#FBBF24', fontSize: '0.75rem', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                                            {(auto.actions || (auto.action ? [auto.action] : [])).map((act, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    {getActionIcon(act?.type)} {act?.type?.split('_').join(' ').toUpperCase() || 'UNIDENTIFIED'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    
                    {automations.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '6rem', background: 'rgba(255,255,255,0.01)', borderRadius: '32px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                             <Layers size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                             <h2 style={{ color: '#F8FAFC', fontWeight: 900, marginBottom: '0.5rem' }}>Neural Network Empty</h2>
                             <p style={{ color: '#475569' }}>The workspace is waiting for autonomous direction.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Premium Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }} />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 50 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 50 }}
                            className="glass-panel"
                            style={{ position: 'relative', width: '100%', maxWidth: '600px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', padding: '2.5rem', boxShadow: '0 30px 100px rgba(0,0,0,0.8)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <div>
                                    <h2 style={{ color: '#F8FAFC', fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Configure Logic Relay</h2>
                                    <p style={{ color: '#64748B', fontSize: '0.85rem' }}>Set the conditions for autonomous execution.</p>
                                </div>
                                <button onClick={() => setShowCreate(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div>
                                    <label style={{ color: '#FBBF24', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.75rem' }}>Flow Identification</label>
                                    <input 
                                        value={newAuto.name} 
                                        onChange={e => setNewAuto({...newAuto, name: e.target.value})} 
                                        placeholder="e.g. CRITICAL_PRIORITY_RELAY" 
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1rem', color: '#fff', fontSize: '1rem', fontWeight: 600, fontFamily: 'JetBrains Mono' }} 
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'start', gap: '1rem' }}>
                                    {/* Trigger Config */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ color: '#3B82F6', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem' }}>Condition Trigger</div>
                                        <select 
                                            value={newAuto.trigger.value} 
                                            onChange={e => setNewAuto({...newAuto, trigger: {...newAuto.trigger, value: e.target.value}})} 
                                            style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem' }}
                                        >
                                            <optgroup label="Status Change">
                                                <option value="completed">Status: Completed</option>
                                                <option value="review">Status: Review</option>
                                                <option value="in_progress">Status: In Progress</option>
                                            </optgroup>
                                            <optgroup label="Priority Escalation">
                                                <option value="high">Priority: High</option>
                                                <option value="critical">Priority: Critical</option>
                                            </optgroup>
                                        </select>
                                    </div>

                                    <div style={{ color: '#475569', marginTop: '1.5rem' }}><ArrowRight size={20} /></div>

                                    {/* Action Chain Config */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {newAuto.actions.map((action, index) => (
                                            <div key={index} style={{ background: 'rgba(245,158,11,0.04)', padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(245,158,11,0.1)', position: 'relative' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <div style={{ color: '#F59E0B', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>Action Relay #{index + 1}</div>
                                                    {newAuto.actions.length > 1 && (
                                                        <button onClick={() => {
                                                            const actions = newAuto.actions.filter((_, i) => i !== index);
                                                            setNewAuto({...newAuto, actions});
                                                        }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><X size={14} /></button>
                                                    )}
                                                </div>
                                                <select 
                                                    value={action.type} 
                                                    onChange={e => {
                                                        const actions = [...newAuto.actions];
                                                        actions[index].type = e.target.value;
                                                        setNewAuto({...newAuto, actions});
                                                    }} 
                                                    style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '0.75rem' }}
                                                >
                                                    <option value="notify_user">Notify Terminal</option>
                                                    <option value="assign_user">Relay Assignment</option>
                                                    <option value="change_status">Adjust Metadata</option>
                                                    <option value="set_priority">Shift Priority</option>
                                                </select>
                                                
                                                {(action.type === 'notify_user' || action.type === 'assign_user') && (
                                                    <select 
                                                        value={action.targetId} 
                                                        onChange={e => {
                                                            const actions = [...newAuto.actions];
                                                            actions[index].targetId = e.target.value;
                                                            setNewAuto({...newAuto, actions});
                                                        }} 
                                                        style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem' }}
                                                    >
                                                        <option value="">Select Agent...</option>
                                                        {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                                    </select>
                                                )}
                                                
                                                {(action.type === 'change_status' || action.type === 'set_priority') && (
                                                    <input 
                                                        placeholder="Target Value..."
                                                        value={action.value || ''}
                                                        onChange={e => {
                                                            const actions = [...newAuto.actions];
                                                            actions[index].value = e.target.value;
                                                            setNewAuto({...newAuto, actions});
                                                        }}
                                                        style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem' }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        
                                        <button 
                                            onClick={() => setNewAuto({...newAuto, actions: [...newAuto.actions, { type: 'notify_user', targetId: '', value: '' }]})}
                                            style={{ padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: '#64748B', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            + ADD STEP
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
                                <motion.button 
                                    whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                                    onClick={() => {
                                        setShowCreate(false);
                                        setNewAuto({ name: '', trigger: { type: 'status_change', field: 'status', value: 'completed' }, actions: [{ type: 'notify_user', targetId: '', value: '' }] });
                                    }} 
                                    style={{ flex: 1, padding: '1rem', borderRadius: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    ABORT
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.02, background: '#FBBF24' }} whileTap={{ scale: 0.98 }}
                                    onClick={handleCreate} 
                                    style={{ flex: 1.5, padding: '1rem', borderRadius: '14px', background: '#F59E0B', border: 'none', color: '#000', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 30px rgba(245,158,11,0.2)' }}
                                >
                                    SYNCHRONIZE FLOW
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Workflows;
