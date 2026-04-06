import { useState } from 'react';
import { DndContext, closestCorners, DragOverlay, defaultDropAnimationSideEffects, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { GripVertical, Calendar, AlertCircle, Clock, Wand2, Sparkles, Archive } from 'lucide-react';
import MagneticButton from './MagneticButton';
import { toast } from 'react-hot-toast';
import TiltContainer from './TiltContainer';
import { triggerConfetti } from '../utils/confetti';

/* ── Priority Dot ────────────────────────────────────────── */
const PriorityDot = ({ priority }) => {
    const cfg = {
        critical: { color: '#EF4444', glow: 'rgba(239,68,68,0.5)', label: 'Critical' },
        high: { color: '#F97316', glow: 'rgba(249,115,22,0.4)', label: 'High' },
        medium: { color: '#F59E0B', glow: 'rgba(245,158,11,0.4)', label: 'Medium' },
        low: { color: '#10B981', glow: 'rgba(16,185,129,0.4)', label: 'Low' },
    };
    const c = cfg[priority] || cfg.low;
    return (
        <span title={c.label} style={{
            display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
            background: c.color, flexShrink: 0,
            boxShadow: `0 0 6px ${c.glow}, 0 0 10px ${c.glow}`,
            animation: priority === 'critical' || priority === 'high' ? 'pulse-dot 1.5s infinite' : 'none',
        }} />
    );
};

/* ── SVG Progress Ring ───────────────────────────────────── */
const ProgressRing = ({ percent = 0, size = 32, stroke = 3 }) => {
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    const color = percent === 100 ? '#10B981' : percent > 50 ? '#F59E0B' : '#F59E0B';
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }} />
        </svg>
    );
};

/* ── Assignee Badge ────────────────────────────────────────── */
const AssigneeBadge = ({ assignees }) => {
    const list = Array.isArray(assignees) ? assignees : (assignees ? [assignees] : []);
    if (!list.length) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.65rem', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, letterSpacing: '0.02em' }}>Unassigned</span>
        </div>
    );
    
    // Display the first assignee clearly, with a count for the rest
    const a = list[0];
    const name = typeof a === 'string' ? a : (a?.name || a?.email || 'System User');
    const initials = name.substring(0, 2).toUpperCase();
    
    return (
        <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            padding: '0.35rem 0.8rem 0.35rem 0.4rem', 
            background: 'linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.7))',
            backdropFilter: 'blur(8px)',
            borderRadius: '24px', 
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s',
            cursor: 'default'
        }} className="assignee-badge">
            <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: `linear-gradient(135deg, var(--brand-primary, #F59E0B), #D97706)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 800, color: '#111827',
                boxShadow: '0 0 10px rgba(245,158,11,0.4)'
            }}>
                {initials}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F8FAFC', letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
                {name}
            </span>
            {list.length > 1 && (
                <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 800, marginLeft: '0.1rem', paddingLeft: '0.4rem', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
                    +{list.length - 1}
                </span>
            )}
        </div>
    );
};

/* ── Sortable Task Card (Frost & Magic) ──────────────────── */
const SortableKanbanCard = ({ task, isAdmin, onGoalComplete, onDecompose }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
    const { transitioning } = useTheme();
    const [isMagical, setIsMagical] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isMagical ? 100 : 1
    };

    const isOverdue = task.endDate && new Date(task.endDate) < new Date() && task.status !== 'completed';
    const goals = Array.isArray(task.goals) ? task.goals : [];
    const completedGoals = goals.filter(g => g.completed).length;
    const progressPct = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : (task.status === 'completed' ? 100 : 0);

    const handleMagicDecompose = async (e) => {
        e.stopPropagation();
        setIsMagical(true);
        setTimeout(async () => {
            await onDecompose(task._id);
            setIsMagical(false);
        }, 1200);
    };

    const handleArchive = async (e) => {
        e.stopPropagation();
        const API = import.meta.env.VITE_API_URL;
        const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
        
        try {
            const res = await fetch(`${API}/api/tasks/${task._id}/archive`, {
                method: 'PUT',
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error('Archive failed');
            toast.success('Task moved to Reports');
            // Notify parent to refresh list
            if (onGoalComplete) onGoalComplete('refresh'); 
        } catch (error) {
            toast.error('Failed to move task to reports');
        }
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            animate={isMagical ? {
                scale: [1, 1.05, 1],
                boxShadow: [
                    '0 0 0px var(--shadow-glow)',
                    '0 0 40px var(--shadow-glow)',
                    '0 0 0px var(--shadow-glow)'
                ]
            } : (isOverdue ? { x: [0, -4, 4, -4, 4, 0] } : {})}
            transition={isMagical ? { duration: 1.2 } : (isOverdue ? { repeat: Infinity, repeatDelay: 5, duration: 0.4 } : {})}
        >
            <TiltContainer intensity={15} style={{ height: '100%' }}>
                <div style={{
                    background: 'linear-gradient(rgba(26, 32, 44, 0.45), rgba(17, 24, 39, 0.65))',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: isOverdue ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '20px',
                    padding: '1.25rem',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    boxShadow: task.status === 'completed' ? '0 8px 32px rgba(16,185,129,0.1)' : (isOverdue ? '0 8px 32px rgba(239,68,68,0.15)' : '0 8px 24px rgba(0,0,0,0.2)'),
                    transition: 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    scale: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                    {...listeners}
                    onMouseOver={e => {
                        if (!isOverdue && task.status !== 'completed') e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)';
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.boxShadow = isOverdue ? '0 12px 40px rgba(239,68,68,0.3)' : (task.status === 'completed' ? '0 12px 40px rgba(16,185,129,0.2)' : '0 12px 30px rgba(245,158,11,0.12)');
                        e.currentTarget.style.background = 'linear-gradient(rgba(31, 41, 55, 0.7), rgba(17, 24, 39, 0.9))';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.borderColor = isOverdue ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = isOverdue ? '0 8px 32px rgba(239,68,68,0.15)' : (task.status === 'completed' ? '0 8px 32px rgba(16,185,129,0.1)' : '0 8px 24px rgba(0,0,0,0.2)');
                        e.currentTarget.style.background = 'linear-gradient(rgba(26, 32, 44, 0.45), rgba(17, 24, 39, 0.65))';
                    }}>

                    {/* Magic Sparkles */}
                    <AnimatePresence>
                        {isMagical && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, background: 'radial-gradient(circle at center, rgba(245,158,11,0.2), transparent 70%)' }}>
                                <div className="animate-shimmer" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', width: '200%' }} />
                                <motion.div
                                    animate={{ y: [-10, -50], opacity: [0, 1, 0], scale: [0, 1.8] }}
                                    transition={{ repeat: Infinity, duration: 0.6 }}
                                    style={{ position: 'absolute', top: '50%', left: '50%' }}>
                                    <Sparkles size={24} color="#FACC15" />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Overdue stripe */}
                    {isOverdue && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #EF4444, #F97316)', borderRadius: '20px 20px 0 0', boxShadow: '0 0 12px rgba(239,68,68,0.6)' }} />}

                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', flex: 1, minWidth: 0, marginTop: '0.2rem' }}>
                            <div style={{ marginTop: '0.25rem' }}><PriorityDot priority={task.priority} /></div>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                                {task.title}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, marginLeft: '0.75rem' }}>
                            {isAdmin && (
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <MagneticButton strength={0.3} onClick={handleMagicDecompose}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '8px',
                                            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', 
                                            border: '1px solid rgba(245,158,11,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#F59E0B', cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(245,158,11,0.1)'
                                        }}>
                                            <Wand2 size={14} />
                                        </div>
                                    </MagneticButton>

                                    {task.status === 'completed' && (
                                        <MagneticButton strength={0.3} onClick={handleArchive}>
                                            <div title="Move to Reports" style={{
                                                width: '28px', height: '28px', borderRadius: '8px',
                                                background: 'rgba(255,255,255,0.05)', 
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#A3A3A3', cursor: 'pointer',
                                            }}>
                                                <Archive size={14} />
                                            </div>
                                        </MagneticButton>
                                    )}
                                </div>
                            )}
                            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '50%', padding: '2px', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.3)' }}>
                                <ProgressRing percent={progressPct} size={32} stroke={3} />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {task.description && (
                        <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '1rem', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {task.description}
                        </p>
                    )}

                    {/* Goals (subtasks) - Expanded area slightly */}
                    <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                        {goals.slice(0, 4).map((g, i) => (
                            <motion.div
                                key={g._id || i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.3 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.2rem 0', borderRadius: '6px' }}
                                whileHover={{ x: 2, background: 'rgba(255,255,255,0.02)' }}
                                onClick={() => onGoalComplete && onGoalComplete(g._id)}>
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '5px',
                                    border: `1.5px solid ${g.isCompleted ? '#10B981' : 'rgba(255,255,255,0.2)'}`,
                                    background: g.isCompleted ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease',
                                    boxShadow: g.isCompleted ? '0 0 8px rgba(16,185,129,0.2)' : 'inset 0 1px 3px rgba(0,0,0,0.3)'
                                }}>
                                    <AnimatePresence>
                                        {g.isCompleted && (
                                            <motion.span
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                style={{ fontSize: '12px', color: '#10B981', fontWeight: 900 }}
                                            >
                                                ✓
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: g.isCompleted ? '#64748B' : '#CBD5E1', textDecoration: g.isCompleted ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>
                                    {g.title || g.text}
                                </span>
                            </motion.div>
                        ))}
                        {goals.length > 4 && (
                            <div style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 700, marginTop: '4px', background: 'rgba(245,158,11,0.08)', padding: '0.2rem 0.5rem', borderRadius: '12px', display: 'inline-block', width: 'fit-content' }}>
                                +{goals.length - 4} more objectives
                            </div>
                        )}
                    </div>

                    {/* Bottom row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <AssigneeBadge assignees={task.assignedTo || task.assignees} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isOverdue && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#EF4444', fontWeight: 700, background: 'rgba(239,68,68,0.1)', padding: '0.25rem 0.5rem', borderRadius: '12px' }}>
                                    <AlertCircle size={12} strokeWidth={2.5} /> Overdue
                                </span>
                            )}
                            {task.endDate && !isOverdue && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <Calendar size={12} color="#64748B" />
                                    {new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </TiltContainer>
        </motion.div>
    );
};

/* ── Kanban Column ───────────────────────────────────────── */
const KanbanCol = ({ id, title, count, children, isDragOver }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    const colConfig = {
        pending: { color: '#64748B', label: 'To Do', badge: 'rgba(100,116,139,0.15)' },
        'in-progress': { color: '#F59E0B', label: 'In Progress', badge: 'rgba(245,158,11,0.15)' },
        review: { color: '#F59E0B', label: 'Review', badge: 'rgba(245,158,11,0.15)' },
        completed: { color: '#10B981', label: 'Done', badge: 'rgba(16,185,129,0.15)' },
    };
    const cfg = colConfig[id] || colConfig.pending;

    return (
        <div 
            className="kanban-column"
            style={{
                flex: 1, minWidth: '280px', maxWidth: '340px',
                background: isOver
                    ? 'rgba(17,24,39,0.95)'
                    : 'rgba(11,18,32,0.6)',
                border: `1px solid ${isOver ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.07)'}`,
                borderTop: `3px solid ${cfg.color}`,
                boxShadow: isOver
                    ? `0 0 40px rgba(245,158,11,0.12), inset 0 0 30px rgba(245,158,11,0.04)`
                    : 'none',
                borderRadius: '18px',
                display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.2s, background 0.25s, box-shadow 0.25s',
                overflow: 'hidden',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}>
            {/* Column Header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${isOver ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`, transition: 'border-color 0.2s' }}>
                <motion.div 
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    animate={isOver ? { y: [-2, 2, -2] } : { y: 0 }}
                    transition={{ duration: 0.4, repeat: isOver ? Infinity : 0 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <motion.span
                            animate={isOver ? { scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] } : { scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, repeat: isOver ? Infinity : 0 }}
                            style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, boxShadow: `0 0 8px ${cfg.color}80`, display: 'block' }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isOver ? '#F59E0B' : 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'color 0.2s' }}>
                            {cfg.label}
                        </span>
                    </div>
                    <motion.span 
                        style={{ padding: '0.15rem 0.6rem', borderRadius: '999px', background: cfg.badge, color: cfg.color, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}
                        animate={isOver ? { scale: 1.1 } : { scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                    >
                        {count}
                    </motion.span>
                </motion.div>
            </div>

            {/* Drop zone */}
            <div ref={setNodeRef} style={{ flex: 1, padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '200px', overflowY: 'auto' }}
                className="scrollbar-thin">
                {children}
                {count === 0 && (
                    <motion.div
                        animate={isOver
                            ? { borderColor: ['rgba(245,158,11,0.4)', 'rgba(245,158,11,0.8)', 'rgba(245,158,11,0.4)'], scale: [1, 1.01, 1] }
                            : { borderColor: 'rgba(255,255,255,0.08)', scale: 1 }
                        }
                        transition={{ duration: 1, repeat: isOver ? Infinity : 0 }}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isOver ? 'rgba(245,158,11,0.7)' : 'var(--text-muted)',
                            fontSize: '0.8rem', fontStyle: 'italic',
                            border: '2px dashed rgba(255,255,255,0.08)',
                            borderRadius: '12px', padding: '2rem', textAlign: 'center',
                            transition: 'color 0.2s',
                            background: isOver ? 'rgba(245,158,11,0.03)' : 'transparent'
                        }}
                    >
                        {isOver ? '⬇ Drop here' : 'Drop tasks here'}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

/* ── Main KanbanBoard ────────────────────────────────────── */
const KanbanBoard = ({ tasks, onStatusChange, onGoalComplete, isAdmin, onAwardPoints }) => {
    const [activeId, setActiveId] = useState(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
    );

    const columns = [
        { id: 'pending', title: 'To Do' },
        { id: 'in-progress', title: 'In Progress' },
        { id: 'review', title: 'Review' },
        { id: 'completed', title: 'Done' },
    ];

    const getByStatus = (status) => tasks.filter(t => t.status === status);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeTask = tasks.find(t => t._id === active.id);
        if (!activeTask) return;

        let newStatus = over.id;
        const overTask = tasks.find(t => t._id === over.id);
        if (overTask) newStatus = overTask.status;

        if (activeTask.status !== newStatus && columns.some(c => c.id === newStatus)) {
            // Block normal users from moving out of review or into done
            if (!isAdmin) {
                if (activeTask.status === 'review' && newStatus !== 'completed') {
                    toast.error('Tasks under review cannot be modified until an admin verifies them.');
                    return;
                }
                if (newStatus === 'completed') {
                    if (activeTask.status === 'review') {
                        toast.error('Waiting for admin manual review.');
                        return;
                    }
                    newStatus = 'review';
                    toast.success('Task submitted for admin review!');
                }
            }

            onStatusChange(active.id, newStatus);
            if (newStatus === 'completed') triggerConfetti();
        }
    };

    const activeTask = activeId ? tasks.find(t => t._id === activeId) : null;

    const handleDecompose = async (taskId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/decompose`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Magic failed');
            const data = await response.json();
            toast.success(data.message);
            // Internal state refresh should be handled by the parent
            if (onStatusChange) onStatusChange(taskId, 'refresh');
        } catch (error) {
            toast.error('The magic wand failed to cast its spell.');
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={e => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
            <motion.div 
                style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', minHeight: 'calc(100vh - 250px)', alignItems: 'flex-start' }}
                className="scrollbar-hide kanban-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
            >
                {columns.map((col, idx) => (
                    <motion.div
                        key={col.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <KanbanCol key={col.id} id={col.id} title={col.title} count={getByStatus(col.id).length}>
                            <SortableContext items={getByStatus(col.id).map(t => t._id)} strategy={verticalListSortingStrategy}>
                                <AnimatePresence>
                                    {getByStatus(col.id).map((task, taskIdx) => (
                                        <motion.div
                                            key={task._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 + taskIdx * 0.05, duration: 0.3 }}
                                        >
                                            <SortableKanbanCard task={task} isAdmin={isAdmin} onGoalComplete={onGoalComplete} onDecompose={handleDecompose} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </SortableContext>
                        </KanbanCol>
                    </motion.div>
                ))}
            </motion.div>

            <DragOverlay adjustScale={true}>
                {activeTask && (
                    <div style={{
                        background: 'rgba(17,24,39,0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '2px solid var(--brand-primary)',
                        borderRadius: '20px', 
                        padding: '1.25rem',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(245,158,11,0.2)',
                        width: '320px',
                        cursor: 'grabbing',
                        transform: 'rotate(2deg)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <PriorityDot priority={activeTask.priority} />
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>{activeTask.title}</span>
                        </div>
                        <div style={{ marginTop: '0.8rem', fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                            Reassigning Task…
                        </div>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
