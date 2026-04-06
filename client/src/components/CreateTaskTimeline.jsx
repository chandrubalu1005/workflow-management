import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, Users, Trash2, Save, X, Calendar, GripVertical, CheckCircle, Clock, Folder } from 'lucide-react';
import { Reorder } from 'framer-motion';
import SmartAssignModal from './SmartAssignModal';
import DatePicker from './DatePicker';

const CreateTaskTimeline = ({ onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignment, setAssignment] = useState(null); // { type, targetId, targetName, strategy }
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        projectId: ''
    });

    const [steps, setSteps] = useState([
        { id: 'step-1', title: 'Initial Planning', deadline: '', status: 'pending', rewardPoints: '50' },
        { id: 'step-2', title: 'Execution Phase', deadline: '', status: 'pending', rewardPoints: '50' },
        { id: 'step-3', title: 'Final Review', deadline: '', status: 'pending', rewardPoints: '50' }
    ]);

    const [statusMessage, setStatusMessage] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const projectsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, { headers });
                const projectsData = await projectsRes.json();
                setProjects(Array.isArray(projectsData) ? projectsData : []);
            } catch (e) {
                console.error('Failed to load data');
            }
        };
        fetchData();
    }, []);

    const handleStepChange = (id, field, value) => {
        setSteps(steps.map(step => step.id === id ? { ...step, [field]: value } : step));
    };

    const addStep = () => {
        const newStep = {
            id: `step-${Date.now()}`,
            title: '',
            deadline: '',
            status: 'pending',
            rewardPoints: '50'
        };
        setSteps([...steps, newStep]);
    };

    const removeStep = (id) => {
        setSteps(steps.filter(step => step.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !assignment) {
            setStatusMessage({ type: 'error', text: 'Please fill in all required fields.' });
            return;
        }

        setLoading(true);
        setStatusMessage(null);

        // Calculate start and end dates from timeline
        const sortedSteps = [...steps].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        const startDate = sortedSteps.length > 0 && sortedSteps[0].deadline ? sortedSteps[0].deadline : new Date().toISOString().split('T')[0];
        const endDate = sortedSteps.length > 0 && sortedSteps[sortedSteps.length - 1].deadline ? sortedSteps[sortedSteps.length - 1].deadline : new Date().toISOString().split('T')[0];

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
                    startDate,
                    endDate,
                    assignedToId: assignment.type === 'individual' ? assignment.targetId : undefined,
                    assignment: {
                        type: assignment.type,
                        targetId: assignment.targetId,
                        strategy: assignment.strategy || 'synchronous'
                    },
                    project: formData.projectId || undefined,
                    goals: steps.map(s => ({ title: s.title, deadline: s.deadline || undefined, rewardPoints: Number(s.rewardPoints) }))
                })
            });

            if (!response.ok) throw new Error('Failed to create task');

            setStatusMessage({ type: 'success', text: 'Task created and assigned successfully 😊' });

            // Allow animation to play
            setTimeout(() => {
                if (onSuccess) onSuccess();
                setFormData({ title: '', description: '', priority: 'medium', projectId: '' });
                setAssignment(null);
                setSteps([{ id: 'step-1', title: 'Initial Planning', deadline: '', status: 'pending', rewardPoints: '50' }]);
                setStatusMessage(null);
            }, 1500);

        } catch (err) {
            setStatusMessage({ type: 'error', text: 'Error creating task. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lux-card"
            style={{ maxWidth: '900px', margin: '1rem auto', padding: '2rem' }}
        >
            {/* Header */}
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #F8FAFC, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>Create Task</h2>
                <p style={{ color: '#64748B' }}>Create a task and define its flow over time</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Basic Details Card */}
                <motion.div
                    className="glass-panel"
                    style={{
                        padding: '2rem',
                        marginBottom: '2rem'
                    }}
                >
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label className="form-label" style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Task Title</label>
                            <input
                                className="form-input"
                                style={{ fontSize: '1.25rem', padding: '0.75rem', fontWeight: '600' }}
                                placeholder="e.g. Server Security Audit"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="form-label" style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Description</label>
                            <textarea
                                className="form-input"
                                rows={2}
                                placeholder="Briefly describe what needs to be done..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{ resize: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Priority</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {['low', 'medium', 'high'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, priority: p })}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                borderRadius: '20px',
                                                border: formData.priority === p ? `1px solid ${p === 'high' ? '#EF4444' : p === 'medium' ? '#F59E0B' : '#10B981'}` : '1px solid rgba(255,255,255,0.1)',
                                                backgroundColor: formData.priority === p ? `${p === 'high' ? 'rgba(239,68,68,0.12)' : p === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)'}` : 'transparent',
                                                color: formData.priority === p ? `${p === 'high' ? '#EF4444' : p === 'medium' ? '#F59E0B' : '#10B981'}` : '#94A3B8',
                                                cursor: 'pointer',
                                                textTransform: 'capitalize',
                                                fontWeight: 600,
                                                transition: 'all 0.2s',
                                                fontFamily: 'Inter'
                                            }}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="form-label" style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Assign To</label>
                                <motion.button
                                    type="button"
                                    onClick={() => setShowAssignModal(true)}
                                    whileHover={{ borderColor: 'rgba(245,158,11,0.4)' }}
                                    style={{
                                        width: '100%', padding: '0.75rem 1rem',
                                        borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.04)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        transition: 'all 0.2s', textAlign: 'left'
                                    }}
                                >
                                    {assignment ? (
                                        <>
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: assignment.type === 'team' ? '8px' : '50%',
                                                background: assignment.type === 'team' ? 'rgba(245,158,11,0.15)' : 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {assignment.type === 'team' ? <Users size={14} color="#F59E0B" /> : <User size={14} color="#fff" />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: '#E2E8F0', fontSize: '0.875rem', fontWeight: 600 }}>{assignment.targetName}</div>
                                                <div style={{ color: '#4B5563', fontSize: '0.7rem' }}>
                                                    {assignment.type === 'team' ? `Team • ${assignment.strategy === 'first-to-finish' ? 'Race Mode' : 'All Members'}` : 'Individual'}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setAssignment(null); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: '0.25rem' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <User size={18} color="#64748B" />
                                            <span style={{ color: '#4B5563', fontSize: '0.875rem' }}>Search teams or people...</span>
                                        </>
                                    )}
                                </motion.button>
                                <SmartAssignModal
                                    isOpen={showAssignModal}
                                    onClose={() => setShowAssignModal(false)}
                                    onSelect={setAssignment}
                                    currentValue={assignment}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <label className="form-label" style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Project (Optional)</label>
                            <div style={{ position: 'relative' }}>
                                <Folder size={18} style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#64748B', zIndex: 1 }} />
                                <select
                                    className="form-input"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={formData.projectId}
                                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                >
                                    <option value="">No Project</option>
                                    {projects.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Timeline Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#E2E8F0' }}>Task Timeline</h3>
                            <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Define how this task moves forward</p>
                        </div>
                        <motion.button
                            type="button"
                            onClick={addStep}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={18} /> Add Timeline Step
                        </motion.button>
                    </div>

                    <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                        {/* Vertical Line */}
                        <div style={{
                            position: 'absolute',
                            left: '0.85rem',
                            top: '1rem',
                            bottom: '1rem',
                            width: '2px',
                            background: 'linear-gradient(180deg, #F59E0B, rgba(245,158,11,0.2))',
                            zIndex: 0
                        }} />

                        <Reorder.Group axis="y" values={steps} onReorder={setSteps}>
                            <AnimatePresence>
                                {steps.map((step, index) => (
                                    <Reorder.Item key={step.id} value={step} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            layout
                                            className="glass-panel"
                                            style={{
                                                padding: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                marginLeft: '0.5rem'
                                            }}
                                        >
                                            {/* Node */}
                                            <div style={{
                                                position: 'absolute',
                                                left: '-2.15rem',
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                background: '#0B0E14',
                                                border: '4px solid rgba(245,158,11,0.4)',
                                                zIndex: 1
                                            }} />

                                            <div style={{ cursor: 'grab', color: '#4B5563' }}>
                                                <GripVertical size={20} />
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <input
                                                    className="form-input"
                                                    placeholder="Step Title (e.g. Initial Review)"
                                                    style={{ border: 'none', padding: '0', fontWeight: '600', fontSize: '1rem', marginBottom: '0.25rem' }}
                                                    value={step.title}
                                                    onChange={e => handleStepChange(step.id, 'title', e.target.value)}
                                                />
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4B5563', fontSize: '0.875rem' }}>
                                                    <Clock size={14} />
                                                    <span>Pending</span>
                                                    <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }} />
                                                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '0.15rem 0.6rem', borderRadius: '20px', gap: '0.4rem' }}>
                                                        <span style={{ color: '#F59E0B', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>✨ Pts</span>
                                                        <input
                                                            type="text"
                                                            value={step.rewardPoints}
                                                            onChange={e => {
                                                                let val = e.target.value.replace(/[^0-9.]/g, '');
                                                                if (val.split('.').length > 2) val = val.substring(0, val.length - 1);
                                                                if (val.length <= 7) handleStepChange(step.id, 'rewardPoints', val);
                                                            }}
                                                            onBlur={e => {
                                                                let val = e.target.value;
                                                                if (!val) { handleStepChange(step.id, 'rewardPoints', '50'); return; }
                                                                let num = parseFloat(val) || 0;
                                                                if (num > 100) num = 100;
                                                                let [intP, decP] = String(num).split('.');
                                                                handleStepChange(step.id, 'rewardPoints', decP ? `${intP}.${decP}` : intP);
                                                            }}
                                                            style={{ width: '48px', background: 'transparent', border: 'none', color: '#F59E0B', padding: 0, fontSize: '0.85rem', fontWeight: 700, outline: 'none', textAlign: 'center' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flexShrink: 0, minWidth: '180px' }}>
                                                    <DatePicker 
                                                        value={step.deadline}
                                                        onChange={val => handleStepChange(step.id, 'deadline', val)}
                                                        placeholder="Step deadline"
                                                        required
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeStep(step.id)}
                                                    style={{
                                                        padding: '0.5rem',
                                                        color: '#4B5563',
                                                        cursor: 'pointer',
                                                        borderRadius: '8px',
                                                        background: 'none',
                                                        border: 'none'
                                                    }}
                                                    className="hover-danger"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    </Reorder.Item>
                                ))}
                            </AnimatePresence>
                        </Reorder.Group>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <AnimatePresence>
                        {statusMessage && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    marginRight: 'auto',
                                    color: statusMessage.type === 'success' ? '#10B981' : '#EF4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: '500'
                                }}
                            >
                                {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
                                {statusMessage.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            backgroundColor: 'transparent',
                            color: '#94A3B8',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'Inter'
                        }}
                    >
                        Save Draft
                    </motion.button>
                    <motion.button
                        type="button"
                        onClick={() => onSuccess && onSuccess()} // Simple cancel for now
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#64748B',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'Inter'
                        }}
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {loading ? 'Creating...' : <>Create & Assign Task <CheckCircle size={18} /></>}
                    </motion.button>
                </div>
            </form>
        </motion.div>
    );
};

export default CreateTaskTimeline;
