import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutTemplate, Plus, Edit3, Trash2, Copy, Search,
    ChevronDown, ChevronRight, Tag, Clock, Star, ArrowRight,
    ArrowUp, ArrowDown, Type
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Shimmer } from '../../components/Shimmer';
import { triggerConfetti } from '../../utils/confetti';

const API = import.meta.env.VITE_API_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

const CATEGORIES = ['General', 'Engineering', 'Design', 'Marketing', 'HR', 'Product', 'Operations'];
const PRIORITY_COLORS = { low: '#6B7280', medium: '#F59E0B', high: '#EF4444', critical: '#DC2626' };
const ICONS = ['📋', '⚡', '🏗️', '🎨', '🔍', '🚀', '🛠️', '📈', '🤝', '🛡️', '📅', '💻'];
const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#D97706', '#EF4444', '#EC4899', '#64748B'];

const emptyTemplate = () => ({
    name: '', description: '', category: 'General', icon: '📋', color: '#F59E0B',
    tasks: [], defaultRoles: [], variables: [], isDraft: true, isPublic: true
});

const getCategoryStyle = (cat) => {
    switch (cat) {
        case 'Engineering': return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' }; // Amber
        case 'Management': return { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' }; // Blue
        case 'Design': return { bg: 'rgba(156,163,175,0.1)', color: '#9CA3AF' }; // Neutral (Purple removed)
        default: return { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' }; // Default neutral
    }
};

const TemplateEditorPanel = ({ template, onClose, onSave, isSaving }) => {
    const [form, setForm] = useState(template || emptyTemplate());
    const [activeTab, setActiveTab] = useState('general');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newVarName, setNewVarName] = useState('');
    const isEdit = !!template?._id;

    const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const addTask = () => {
        if (!newTaskTitle.trim()) return;
        update('tasks', [...form.tasks, {
            title: newTaskTitle.trim(), priority: 'medium', estimatedDays: 1,
            completionMode: 'individual', defaultRole: '', order: form.tasks.length
        }]);
        setNewTaskTitle('');
    };

    const removeTask = (i) => update('tasks', form.tasks.filter((_, idx) => idx !== i));
    const updateTask = (i, k, v) => {
        const tasks = [...form.tasks];
        tasks[i] = { ...tasks[i], [k]: v };
        update('tasks', tasks);
    };
    const moveTask = (i, dir) => {
        if (i + dir < 0 || i + dir >= form.tasks.length) return;
        const tasks = [...form.tasks];
        const temp = tasks[i];
        tasks[i] = tasks[i + dir];
        tasks[i + dir] = temp;
        // Re-assign order based on index
        tasks.forEach((t, idx) => t.order = idx);
        update('tasks', tasks);
    };

    const addVariable = () => {
        const name = newVarName.trim().replace(/[^a-zA-Z0-9_]/g, '');
        if (!name || form.variables.some(v => v.name === name)) return;
        update('variables', [...(form.variables || []), { name, description: '', defaultValue: '' }]);
        setNewVarName('');
    };
    const removeVariable = (i) => update('variables', form.variables.filter((_, idx) => idx !== i));
    const updateVariable = (i, k, v) => {
        const vars = [...form.variables];
        vars[i] = { ...vars[i], [k]: v };
        update('variables', vars);
    };

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9998 }} />
            <motion.div initial={{ opacity: 0, x: 400 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 400 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '580px', background: 'var(--bg-card)', borderLeft: '1px solid var(--color-border)', zIndex: 9999, display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 80px rgba(0,0,0,0.6)' }}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>
                        {isEdit ? 'Edit Template' : 'New Blueprint'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 1.5rem' }}>
                    {['general', 'tasks', 'variables'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            style={{ padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid var(--brand-primary)' : '2px solid transparent', color: activeTab === tab ? 'var(--brand-primary)' : 'var(--text-muted)', fontWeight: activeTab === tab ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                            {tab === 'tasks' ? `Tasks (${form.tasks.length})` : tab === 'variables' ? `Variables (${form.variables?.length || 0})` : tab}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {activeTab === 'general' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Template Name *</label>
                                <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Website Launch"
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'Inter', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                            </div>

                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Description</label>
                                <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="Markdown descriptions supported..."
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'Inter', fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Tip: Use variables like [ClientName] if defined in the Variables tab.</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Category</label>
                                    <select value={form.category} onChange={e => update('category', e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-main)', fontFamily: 'Inter', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Icon</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: 'var(--bg-overlay)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
                                        {ICONS.map(icon => (
                                            <button key={icon} onClick={() => update('icon', icon)}
                                                style={{ background: form.icon === icon ? 'rgba(245,158,11,0.2)' : 'transparent', border: form.icon === icon ? '1px solid var(--brand-primary)' : '1px solid transparent', borderRadius: '6px', padding: '0.25rem', cursor: 'pointer', fontSize: '1.2rem', transition: 'all 0.2s' }}>
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Theme Color</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: 'var(--bg-overlay)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
                                        {COLORS.map(color => (
                                            <button key={color} onClick={() => update('color', color)}
                                                style={{ width: '28px', height: '28px', borderRadius: '50%', background: color, border: form.color === color ? '2px solid #fff' : 'none', cursor: 'pointer', boxShadow: form.color === color ? '0 0 10px rgba(255,255,255,0.3)' : 'none', transition: 'all 0.2s' }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addTask()}
                                    placeholder="Add task title..."
                                    style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'Inter', fontSize: '0.85rem', outline: 'none' }} />
                                <button onClick={addTask} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: 'var(--brand-primary)', border: 'none', color: '#111827', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 800, fontSize: '0.85rem' }}>Add</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {form.tasks.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>No tasks added yet. This template is empty!</div>
                                ) : form.tasks.map((task, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <button onClick={() => moveTask(i, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', color: i === 0 ? 'transparent' : 'var(--text-muted)', cursor: i === 0 ? 'default' : 'pointer', padding: 0 }}><ArrowUp size={14} /></button>
                                            <button onClick={() => moveTask(i, 1)} disabled={i === form.tasks.length - 1} style={{ background: 'none', border: 'none', color: i === form.tasks.length - 1 ? 'transparent' : 'var(--text-muted)', cursor: i === form.tasks.length - 1 ? 'default' : 'pointer', padding: 0 }}><ArrowDown size={14} /></button>
                                        </div>
                                        <span style={{ color: 'var(--brand-primary)', fontSize: '0.75rem', fontWeight: 800, minWidth: '20px' }}>{i + 1}.</span>
                                        <input value={task.title} onChange={e => updateTask(i, 'title', e.target.value)}
                                            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />

                                        <select value={task.priority} onChange={e => updateTask(i, 'priority', e.target.value)}
                                            style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: 'var(--bg-overlay)', border: `1px solid ${PRIORITY_COLORS[task.priority]}40`, color: PRIORITY_COLORS[task.priority], fontSize: '0.7rem', cursor: 'pointer', outline: 'none' }}>
                                            {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        <input type="number" value={task.estimatedDays} onChange={e => updateTask(i, 'estimatedDays', +e.target.value)} min={1}
                                            style={{ width: '50px', padding: '0.25rem 0.4rem', borderRadius: '6px', background: 'var(--bg-overlay)', border: '1px solid var(--color-border)', color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'right', fontFamily: 'JetBrains Mono', outline: 'none' }} />
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>days</span>
                                        <button onClick={() => removeTask(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '0 0.25rem', fontSize: '1rem' }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'variables' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '1rem', borderRadius: '10px' }}>
                                <div style={{ color: '#3B82F6', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Type size={14} /> How Variables Work</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                                    Add variables to dynamically fill content when this template is used. For example, add a variable named <b>ClientName</b>. Then in your task titles or descriptions, write <b>[ClientName]</b> to have it automatically replace.
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input value={newVarName} onChange={e => setNewVarName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                    onKeyDown={e => e.key === 'Enter' && addVariable()}
                                    placeholder="e.g. ClientName (No spaces)"
                                    style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'Inter', fontSize: '0.85rem', outline: 'none' }} />
                                <button onClick={addVariable} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 700, fontSize: '0.85rem' }}>Add Variable</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {(!form.variables || form.variables.length === 0) ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>No variables defined.</div>
                                ) : form.variables.map((v, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ color: 'var(--brand-primary)', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>[{v.name}]</div>
                                            <button onClick={() => removeVariable(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '0.9rem' }}>✕</button>
                                        </div>
                                        <input value={v.description} onChange={e => updateVariable(i, 'description', e.target.value)} placeholder="Description or prompt (e.g. Enter the client's full name)"
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'var(--bg-overlay)', border: '1px solid var(--color-border)', color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }} />
                                        <input value={v.defaultValue} onChange={e => updateVariable(i, 'defaultValue', e.target.value)} placeholder="Default Value (optional)"
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'var(--bg-overlay)', border: '1px solid var(--color-border)', color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', background: 'var(--bg-overlay)' }}>
                    <button onClick={onClose} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem' }}>Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => onSave({ ...form, isDraft: true })} disabled={isSaving || !form.name.trim()}
                        style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem', opacity: isSaving || !form.name.trim() ? 0.6 : 1 }}>
                        {isEdit && form.isDraft ? 'Save Draft' : 'Save as Draft'}
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => onSave({ ...form, isDraft: false })} disabled={isSaving || !form.name.trim() || form.tasks.length === 0}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', color: '#111827', fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem', opacity: isSaving || !form.name.trim() || form.tasks.length === 0 ? 0.6 : 1 }}>
                        {isSaving ? 'Processing...' : 'Publish Template'}
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
};

const UseTemplateVariablesModal = ({ template, onConfirm, onCancel }) => {
    // Collect variables from tasks/descriptions automatically if they weren't explicitly defined, as a fallback capability
    const [vars, setVars] = useState({});

    useEffect(() => {
        const initial = {};
        template.variables?.forEach(v => initial[v.name] = v.defaultValue || '');
        setVars(initial);
    }, [template]);

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9998 }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '440px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '20px', zIndex: 9999, padding: '2rem', boxShadow: 'var(--shadow-glow)' }}>
                <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '0.5rem', fontSize: '1.25rem' }}>Configure Template</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Please provide the missing variables to generate this project.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem', maxHeight: '50vh', overflowY: 'auto' }}>
                    {template.variables?.map(v => (
                        <div key={v.name}>
                            <label style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                                {v.name} <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            {v.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>{v.description}</div>}
                            <input value={vars[v.name] || ''} onChange={e => setVars({ ...vars, [v.name]: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-main)', fontFamily: 'Inter', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem', fontWeight: 600 }}>Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => onConfirm(vars)}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', color: '#111827', fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem' }}>
                        Deploy Project
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
};

const Templates = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterDraft, setFilterDraft] = useState('published'); // 'published', 'drafts', 'all'
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [previewTarget, setPreviewTarget] = useState(null);
    const [useTemplateVariablesTarget, setUseTemplateVariablesTarget] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTemplates = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (filterCategory) params.set('category', filterCategory);
            const res = await fetch(`${API}/api/templates?${params}`, { headers: headers() });
            if (res.ok) setTemplates(await res.json());
        } catch (_) { }
        setIsLoading(false);
    }, [search, filterCategory]);

    useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

    // Local filtering for Draft vs Published state
    const displayTemplates = templates.filter(t => {
        if (filterDraft === 'published') return !t.isDraft;
        if (filterDraft === 'drafts') return t.isDraft;
        return true;
    });

    const save = {
        mutate: async (form) => {
            try {
                const url = form._id ? `${API}/api/templates/${form._id}` : `${API}/api/templates`;
                const method = form._id ? 'PUT' : 'POST';
                const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(form) });
                if (!res.ok) throw new Error('Save failed');
                toast.success(form.isDraft ? 'Template saved as Draft!' : 'Template Published successfully!');
                if (!form.isDraft) triggerConfetti();
                fetchTemplates();
                setShowModal(false);
                setEditTarget(null);
            } catch (_) { toast.error('Failed to save'); }
        }, isPending: false
    };

    const del = {
        mutate: async (id) => {
            await fetch(`${API}/api/templates/${id}`, { method: 'DELETE', headers: headers() });
            toast.success('Deleted');
            fetchTemplates();
        }
    };

    const duplicate = {
        mutate: async (id) => {
            await fetch(`${API}/api/templates/${id}/duplicate`, { method: 'POST', headers: headers() });
            toast.success('Cloned!');
            triggerConfetti({ count: 25 });
            fetchTemplates();
        }
    };

    const triggerUseTemplate = (template) => {
        if (template.variables && template.variables.length > 0) {
            setUseTemplateVariablesTarget(template);
        } else {
            useT.mutate({ id: template._id, variables: {} });
        }
    };

    const useT = {
        mutate: async ({ id, variables }) => {
            const res = await fetch(`${API}/api/templates/${id}/use`, { method: 'POST', headers: headers(), body: JSON.stringify({ variables }) });
            if (res.ok) {
                const data = await res.json();
                toast.success(`Project "${data.project?.name}" created from template!`);
                setUseTemplateVariablesTarget(null);
                setPreviewTarget(null);
            } else {
                toast.error('Failed to deploy project');
            }
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '0.25rem' }}>
                        Workflow Templates
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Standardize your processes with reusable mission blueprints</p>
                </div>
                {isAdmin && (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { setEditTarget(null); setShowModal(true); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem', borderRadius: '12px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', color: '#111827', fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem', boxShadow: '0 4px 20px rgba(245,158,11,0.2)' }}>
                        <Plus size={16} /> New Template
                    </motion.button>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
                        className="search-input" />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    style={{ padding: '0.6rem 0.9rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-muted)', fontFamily: 'Inter', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {isAdmin && (
                    <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '0.2rem' }}>
                        {['published', 'drafts', 'all'].map(status => (
                            <button key={status} onClick={() => setFilterDraft(status)}
                                style={{ padding: '0.4rem 0.8rem', background: filterDraft === status ? 'rgba(255,255,255,0.08)' : 'transparent', color: filterDraft === status ? 'var(--text-primary)' : 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                {status}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Grid */}
            {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{ height: '240px', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Shimmer width="44px" height="44px" borderRadius="12px" />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <Shimmer width="60%" height="16px" />
                                    <Shimmer width="40%" height="12px" />
                                </div>
                            </div>
                            <Shimmer width="100%" height="60px" borderRadius="10px" />
                        </div>
                    ))}
                </div>
            ) : displayTemplates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '24px', border: '1px dashed var(--border-default)' }}>
                    <LayoutTemplate size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>No templates found</div>
                    <div style={{ fontSize: '0.85rem' }}>{isAdmin ? 'Create your first template to populate this space.' : 'Filters returned no results.'}</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {displayTemplates.map((t, i) => (
                        <motion.div
                            key={t._id}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.4)' }}
                            style={{ background: '#111827', border: '1px solid var(--border-default)', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', transition: 'all 0.2s ease' }}>

                            {t.isDraft && (
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
                                    Draft
                                </div>
                            )}

                            <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${t.color || '#3B82F6'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                                    {t.icon || '📋'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0, marginTop: '0.2rem' }}>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '5px', background: getCategoryStyle(t.category).bg, color: getCategoryStyle(t.category).color, fontSize: '0.65rem', fontWeight: 700 }}>{t.category}</span>
                                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '5px', background: 'var(--bg-overlay)', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600 }}>
                                            {t.tasks?.length || 0} tasks
                                        </span>
                                        {t.variables && t.variables.length > 0 && (
                                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: '5px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: '0.65rem', fontWeight: 600 }}>
                                                {t.variables.length} vars
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {t.description && (
                                <div style={{ padding: '0 1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, flex: 1 }}>
                                    {t.description}
                                </div>
                            )}

                            <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', background: '#111827', borderTop: '1px solid var(--border-default)' }}>
                                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setPreviewTarget(t)}
                                    style={{ padding: '0.5rem 0.65rem', borderRadius: '8px', background: '#1F2937', border: '1px solid #374151', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    👁 Preview
                                </motion.button>

                                <motion.button whileHover={{ scale: 1.05 }} onClick={() => triggerUseTemplate(t)} disabled={t.isDraft}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: t.isDraft ? 'var(--bg-overlay)' : '#F59E0B', border: t.isDraft ? '1px solid var(--border-default)' : '1px solid #F59E0B', color: t.isDraft ? 'var(--text-muted)' : '#000', cursor: t.isDraft ? 'not-allowed' : 'pointer', fontFamily: 'Inter', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                    <ArrowRight size={12} /> {t.isDraft ? 'Draft' : 'Deploy'}
                                </motion.button>

                                {isAdmin && (
                                    <>
                                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setEditTarget(t); setShowModal(true); }}
                                            style={{ padding: '0.5rem 0.65rem', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <Edit3 size={13} />
                                        </motion.button>
                                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => duplicate.mutate(t._id)}
                                            style={{ padding: '0.5rem 0.65rem', borderRadius: '8px', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <Copy size={13} />
                                        </motion.button>
                                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => { if (window.confirm('Delete this template?')) del.mutate(t._id); }}
                                            style={{ padding: '0.5rem 0.65rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <Trash2 size={13} />
                                        </motion.button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showModal && <TemplateEditorPanel template={editTarget} onClose={() => { setShowModal(false); setEditTarget(null); }} onSave={save.mutate} isSaving={save.isPending} />}
            </AnimatePresence>

            {/* Variable Filling Modal via Use */}
            <AnimatePresence>
                {useTemplateVariablesTarget && (
                    <UseTemplateVariablesModal template={useTemplateVariablesTarget} onConfirm={(vars) => useT.mutate({ id: useTemplateVariablesTarget._id, variables: vars })} onCancel={() => setUseTemplateVariablesTarget(null)} />
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewTarget && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9998 }} />
                        <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
                            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '580px', maxHeight: '85vh', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--color-border)', borderRadius: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-glow)' }}>
                            <div style={{ padding: '2rem 2rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${previewTarget.color || '#3B82F6'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{previewTarget.icon || '📋'}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.25rem' }}>{previewTarget.name}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{previewTarget.description || 'No description'}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: '0.7rem', fontWeight: 700 }}>{previewTarget.category}</span>
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--bg-overlay)', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>{previewTarget.tasks?.length || 0} tasks</span>
                                        {previewTarget.variables?.length > 0 && <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: '0.7rem', fontWeight: 600 }}>{previewTarget.variables.length} Dynamic Variables</span>}
                                    </div>
                                </div>
                                <button onClick={() => setPreviewTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem' }}>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Timeline Blueprint</h3>
                                {(!previewTarget.tasks || previewTarget.tasks.length === 0) ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.875rem', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>No tasks defined in this template.</div>
                                ) : previewTarget.tasks.map((task, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', position: 'relative', paddingBottom: i === previewTarget.tasks.length - 1 ? 0 : '1.5rem' }}>
                                        {i !== previewTarget.tasks.length - 1 && <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: 0, width: '2px', background: 'var(--color-border)' }} />}
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid rgba(245,158,11,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#F59E0B', flexShrink: 0, zIndex: 1, marginTop: '2px' }}>{i + 1}</div>
                                        <div style={{ flex: 1, background: 'var(--bg-overlay)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border-default)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                                <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 700 }}>{task.title}</div>
                                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, background: PRIORITY_COLORS[task.priority] ? `${PRIORITY_COLORS[task.priority]}20` : 'rgba(107,114,128,0.1)', color: PRIORITY_COLORS[task.priority] || '#6B7280', textTransform: 'capitalize', flexShrink: 0 }}>{task.priority}</span>
                                            </div>
                                            {task.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{task.description}</div>}
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                {task.estimatedDays && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', background: 'rgba(255,255,255,0.02)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-default)' }}><Clock size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />{task.estimatedDays} Days</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem', background: 'var(--bg-overlay)' }}>
                                <button onClick={() => setPreviewTarget(null)} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem', fontWeight: 600 }}>Cancel</button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => { triggerUseTemplate(previewTarget); setPreviewTarget(null); }} disabled={previewTarget.isDraft}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: previewTarget.isDraft ? 'var(--bg-overlay)' : 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', color: previewTarget.isDraft ? 'var(--text-muted)' : '#111827', fontWeight: 800, cursor: previewTarget.isDraft ? 'not-allowed' : 'pointer', fontFamily: 'Inter', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: previewTarget.isDraft ? 0.6 : 1 }}>
                                    {previewTarget.isDraft ? 'Draft Status (Cannot Deploy)' : <><ArrowRight size={15} /> Use This Blueprint</>}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Templates;
