import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Clock, Users, Zap, ChevronDown, ChevronRight,
    Circle, AlertTriangle, Trophy, Star
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { triggerConfetti } from '../../utils/confetti';

const API = import.meta.env.VITE_API_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

const STATUS_STYLES = {
    pending:     { bg: 'rgba(107,114,128,0.12)', color: '#6B7280', label: 'Pending',     icon: Circle },
    'in-progress':{ bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'In Progress', icon: Clock },
    completed:   { bg: 'rgba(16,185,129,0.12)',  color: '#10B981', label: 'Completed',   icon: CheckCircle },
    blocked:     { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444', label: 'Blocked',     icon: Zap },
};

const PRIORITY_COLORS = { low: '#6B7280', medium: '#F59E0B', high: '#EF4444', critical: '#DC2626' };

/* ─── Deadline helper ─────────────────────────────────────────────────── */
const getDaysLeft = (endDate) => (endDate ? Math.ceil((new Date(endDate) - new Date()) / 86_400_000) : null);
const getUrgencyStyle = (d) => !d ? null
    : d < 0  ? { bg: 'rgba(239,68,68,0.15)',  color: '#EF4444', text: 'Overdue' }
    : d === 0 ? { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', text: 'Due Today' }
    : d <= 2  ? { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B', text: `${d}d left` }
    : null;

/* ─── Goal row inside expanded TaskRow ─────────────────────────────────── */
const GoalItem = ({ goal, onToggle }) => {
    const [busy, setBusy] = useState(false);
    const remaining = !goal.isCompleted ? getDaysLeft(goal.deadline) : null;
    const remainStyle = remaining !== null ? getUrgencyStyle(remaining) : null;

    const handle = async (e) => {
        e.stopPropagation();
        if (goal.isCompleted || busy) return;
        setBusy(true);
        await onToggle(goal._id, goal);
        setBusy(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            onClick={handle}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.55rem 0.75rem', borderRadius: 10,
                background: goal.isCompleted ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.025)',
                border: goal.isCompleted ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(255,255,255,0.05)',
                cursor: goal.isCompleted ? 'default' : 'pointer',
                transition: 'all 0.2s',
            }}
            whileHover={!goal.isCompleted ? { borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' } : {}}
        >
            {/* HUD Checkbox with Starburst */}
            <div style={{
                position: 'relative', width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: goal.isCompleted ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                background: goal.isCompleted ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.02)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: goal.isCompleted ? '0 0 12px rgba(16,185,129,0.4)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
                <AnimatePresence>
                    {goal.isCompleted && (
                        <>
                            <motion.div
                                initial={{ scale: 0.2, opacity: 1 }}
                                animate={{ scale: 2.2, opacity: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                style={{ position: 'absolute', width: '30px', height: '30px', background: 'radial-gradient(circle, rgba(16,185,129,0.8) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}
                            />
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                style={{ color: '#111827', fontSize: 11, fontWeight: 900, position: 'relative', zIndex: 1 }}>✓</motion.span>
                        </>
                    )}
                    {busy && (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                            style={{ width: 10, height: 10, border: '1.5px solid #F59E0B', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    )}
                </AnimatePresence>
            </div>

            {/* Subtask HUD Crosshairs (Subtle) */}
            <div style={{ position: 'absolute', top: '4px', right: '4px', width: '4px', height: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'absolute', bottom: '4px', left: '4px', width: '4px', height: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)' }} />

            {/* Title */}
            <span style={{
                flex: 1, fontSize: '0.8rem', lineHeight: 1.4,
                color: goal.isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-main)',
                textDecoration: goal.isCompleted ? 'line-through' : 'none',
                transition: 'all 0.2s',
            }}>{goal.title}</span>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                {remainStyle && (
                    <span style={{
                        fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 5,
                        background: remainStyle.bg, color: remainStyle.color,
                        display: 'flex', alignItems: 'center', gap: '0.2rem',
                    }}>
                        <Clock size={8} /> {remainStyle.text}
                    </span>
                )}
                {goal.isCompleted && goal.completedAt && goal.deadline &&
                    new Date(goal.completedAt) <= new Date(goal.deadline) && (
                    <span style={{
                        fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 5,
                        background: 'rgba(16,185,129,0.15)', color: '#10B981',
                        display: 'flex', alignItems: 'center', gap: '0.2rem',
                    }}><Trophy size={8} /> On Time</span>
                )}
                {goal.rewardPoints > 0 && (
                    <span style={{
                        fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: 5,
                        background: goal.isCompleted ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.07)',
                        color: '#F59E0B',
                        display: 'flex', alignItems: 'center', gap: '0.2rem',
                        boxShadow: goal.isCompleted ? '0 0 6px rgba(245,158,11,0.25)' : 'none',
                        transition: 'all 0.3s',
                    }}>
                        <Star size={8} fill={goal.isCompleted ? '#F59E0B' : 'none'} />
                        {goal.rewardPoints}pts
                    </span>
                )}
            </div>
        </motion.div>
    );
};

/* ─── Task row ──────────────────────────────────────────────────────────── */
const TaskRow = ({ task, onToggleTask, onToggleGoal, isTeam }) => {
    const [expanded, setExpanded] = useState(false);
    const s  = STATUS_STYLES[task.status] || STATUS_STYLES.pending;
    const pc = PRIORITY_COLORS[task.priority] || '#6B7280';
    const daysLeft = getDaysLeft(task.endDate);
    const urgency  = daysLeft === null ? null : daysLeft < 0 ? 'overdue' : daysLeft === 0 ? 'today' : daysLeft <= 2 ? 'soon' : null;
    const urgencyStyles = {
        overdue: { bg: 'rgba(239,68,68,0.15)',  color: '#EF4444', text: 'Overdue' },
        today:   { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', text: 'Due Today' },
        soon:    { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B', text: `${daysLeft}d left` },
    };
    const hasGoals = task.goals?.length > 0;
    const completedGoals = task.goals?.filter(g => g.isCompleted).length || 0;
    const totalGoals = task.goals?.length || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ borderColor: 'rgba(245,158,11,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
            style={{
                background: urgency === 'overdue' ? 'rgba(239,68,68,0.05)' : 'rgba(17,24,39,0.7)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${task.status === 'completed' ? 'rgba(16,185,129,0.15)' : urgency === 'overdue' ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
                borderLeft: `4px solid ${pc}`,
                borderRadius: 16, overflow: 'hidden', marginBottom: '0.75rem',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
        >
            {/* Header row */}
            <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', cursor: 'pointer' }}
                onClick={() => setExpanded(v => !v)}
            >
                {/* Completion toggle */}
                <button
                    onClick={e => { e.stopPropagation(); if (task.status !== 'completed') onToggleTask(task._id); }}
                    style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${pc}`,
                        background: task.status === 'completed' ? pc : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: task.status !== 'completed' ? 'pointer' : 'default', flexShrink: 0,
                        transition: 'all 0.2s',
                    }}
                >
                    {task.status === 'completed' && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>}
                </button>

                {/* Title + project */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        color: task.status === 'completed' ? 'var(--color-text-muted)' : 'var(--color-text-main)',
                        fontWeight: 600, fontSize: '0.875rem',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                        {task.project?.name && (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.68rem' }}>📁 {task.project.name}</span>
                        )}
                        {hasGoals && (
                            <span style={{
                                fontSize: '0.65rem', fontWeight: 600,
                                color: completedGoals === totalGoals ? '#10B981' : '#F59E0B',
                                background: completedGoals === totalGoals ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                padding: '0.05rem 0.4rem', borderRadius: 5,
                            }}>
                                {completedGoals}/{totalGoals} subtasks
                            </span>
                        )}
                    </div>
                </div>

                {/* Right badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    {urgency && urgencyStyles[urgency] && (
                        <span style={{ padding: '0.15rem 0.45rem', borderRadius: 6, background: urgencyStyles[urgency].bg, color: urgencyStyles[urgency].color, fontSize: '0.62rem', fontWeight: 700 }}>
                            {urgency === 'overdue' && '⚠ '}{urgencyStyles[urgency].text}
                        </span>
                    )}
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, background: s.bg, color: s.color, fontSize: '0.62rem', fontWeight: 700 }}>{s.label}</span>
                    {isTeam && <Users size={13} color="var(--color-text-muted)" />}
                    <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight size={14} color="var(--color-text-muted)" />
                    </motion.div>
                </div>
            </div>

            {/* Expanded goals section */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        key="goals"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ borderTop: '1px solid rgba(245,158,11,0.08)', padding: '0.75rem 1rem 0.75rem 1.25rem' }}>
                            {/* Description */}
                            {task.description && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '0.6rem' }}>
                                    {task.description}
                                </p>
                            )}

                            {/* Goals */}
                            {hasGoals ? (
                                <>
                                    <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Zap size={10} fill="#F59E0B" color="#F59E0B" /> Subtasks
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                        {task.goals.map(goal => (
                                            <GoalItem key={goal._id} goal={goal} onToggle={onToggleGoal} />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No subtasks defined.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/* ─── Main Page ─────────────────────────────────────────────────────────── */
const MyWork = () => {
    const { user } = useAuth();
    const [tab, setTab]                   = useState('my');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [tasks, setTasks]               = useState(null);
    const [isLoading, setIsLoading]       = useState(true);

    const fetchTasks = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/tasks?assignedTo=me`, { headers: headers() });
            if (res.ok) setTasks(await res.json());
        } catch (_) { }
        setIsLoading(false);
    }, []);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    /* ── Toggle whole task ── */
    const toggleTask = async (id) => {
        try {
            await fetch(`${API}/api/tasks/${id}`, {
                method: 'PATCH', headers: headers(),
                body: JSON.stringify({ status: 'completed' }),
            });
            toast.success('Task completed! 🎉');
            triggerConfetti();
            fetchTasks();
        } catch { toast.error('Failed to update task'); }
    };

    /* ── Toggle individual goal ── */
    const toggleGoal = async (goalId, goal) => {
        try {
            const res = await fetch(`${API}/api/tasks/goals/${goalId}/toggle`, {
                method: 'PUT', headers: headers(),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();

            const completedGoal = data.goal;
            const onTime = completedGoal?.deadline && completedGoal?.completedAt &&
                new Date(completedGoal.completedAt) <= new Date(completedGoal.deadline);
            const pts = completedGoal?.rewardPoints || 0;

            if (onTime && pts > 0) {
                // Confetti burst
                for (let i = 0; i < 35; i++) {
                    const p = document.createElement('div');
                    p.className = 'confetti-piece';
                    p.style.left = Math.random() * 100 + 'vw';
                    p.style.animationDuration = (Math.random() * 2 + 1) + 's';
                    p.style.animationDelay = Math.random() * 0.4 + 's';
                    const colors = ['#F59E0B','#10B981','#3B82F6','#EF4444'];
                    p.style.background = colors[Math.floor(Math.random() * colors.length)];
                    document.body.appendChild(p);
                    setTimeout(() => p.remove(), 3200);
                }
                toast.success(`🏆 +${pts} pts earned! On time!`, {
                    style: { background: '#0f172a', border: '1px solid rgba(245,158,11,0.4)', color: '#F59E0B', fontWeight: 700 },
                    duration: 4000, icon: '🌟',
                });
            } else if (completedGoal?.deadline) {
                toast('Done, but after the deadline — no points this time.', {
                    style: { background: '#1e293b', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' },
                    icon: '⏰', duration: 3000,
                });
            } else {
                toast.success('Subtask done!', { duration: 2000 });
            }

            // Optimistically update local task list
            fetchTasks();
        } catch { toast.error('Failed to update subtask'); }
    };

    const allTasks = Array.isArray(tasks) ? tasks : tasks?.tasks || [];
    const myTasks   = allTasks.filter(t => t.assignment?.type === 'individual' || !t.assignment?.type);
    const teamTasks = allTasks.filter(t => t.assignment?.type === 'team');

    const baseTasks   = tab === 'my' ? myTasks : teamTasks;
    const activeTasks = priorityFilter ? baseTasks.filter(t => t.priority === priorityFilter) : baseTasks;

    // Fixed: define completedTasksCount properly
    const completedTasksCount = allTasks.filter(t => t.status === 'completed').length;
    const done        = baseTasks.filter(t => t.status === 'completed').length;
    const pct         = baseTasks.length > 0 ? Math.round((done / baseTasks.length) * 100) : 0;
    const overdueCount = baseTasks.filter(t => t.endDate && new Date(t.endDate) < new Date() && t.status !== 'completed').length;

    /* ── 7-day calendar strip ── */
    const today = new Date(); today.setHours(0,0,0,0);
    const DAYS  = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today); d.setDate(today.getDate() + i);
        const dayTasks = allTasks.filter(t => {
            if (!t.endDate) return false;
            const ed = new Date(t.endDate); ed.setHours(0,0,0,0);
            return ed.getTime() === d.getTime();
        });
        return { date: d, dayName: DAYS[d.getDay()], dayNum: d.getDate(), tasks: dayTasks, isToday: i === 0 };
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: '2rem' }}>
            {/* Cinematic Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', position: 'relative' }}>
                {/* Ambient Glow */}
                <div style={{ position: 'absolute', top: '-120px', left: '-100px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: -1, pointerEvents: 'none' }} />
                
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F8FAFC', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', letterSpacing: '-0.03em' }}>
                        <div style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', padding: '0.6rem', borderRadius: '14px', display: 'flex', boxShadow: '0 8px 32px rgba(245,158,11,0.3)' }}>
                            <Zap size={28} color="#111827" fill="#111827" />
                        </div>
                        Executive Focus
                        {overdueCount > 0 && (
                            <motion.span 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(239,68,68,0.15)', color: '#EF4444', borderRadius: 20, padding: '0.2rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid rgba(239,68,68,0.3)', fontFamily: 'JetBrains Mono' }}
                            >
                                <AlertTriangle size={12} /> {overdueCount} OVERDUE
                            </motion.span>
                        )}
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
                        OPERATOR: <strong style={{ color: '#F59E0B' }}>{user?.name?.toUpperCase()}</strong> // SYS.PRIORITY_BOARD
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Active Tasks',    value: allTasks.filter(t => t.status !== 'completed').length, color: '#F59E0B' },
                    { label: 'Completed Tasks', value: completedTasksCount, color: '#10B981' },
                    { label: 'Team Assigned',   value: teamTasks.length, color: '#64748B' },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className="hover-lift"
                        style={{ background: 'var(--glass-bg)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '1.25rem', boxShadow: 'var(--shadow-md)' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '0.4rem' }}>{s.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono' }}>{s.value}</div>
                    </motion.div>
                ))}
                {/* Progress gauge */}
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="hover-lift"
                    style={{ background: 'rgba(17,24,39,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 16, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                    <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RadialBarChart width={70} height={70} cx={35} cy={35} innerRadius={22} outerRadius={35} barSize={6} startAngle={90} endAngle={90 - 3.6 * pct} data={[{ value: pct }]}>
                            <RadialBar dataKey="value" fill="#10B981" background={{ fill: 'rgba(16,185,129,0.05)' }} cornerRadius={10} />
                        </RadialBarChart>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.7rem', fontWeight: 900, color: '#10B981', fontFamily: 'JetBrains Mono' }}>
                            {pct}%
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: '#6B7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Mastery</div>
                        <div style={{ color: '#E2E8F0', fontSize: '0.8rem', fontWeight: 600 }}>Daily Sprint</div>
                    </div>
                </motion.div>
            </div>

            {/* 7-Day Calendar Strip */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
                {weekDays.map((day, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -2, background: 'rgba(245,158,11,0.05)' }}
                        style={{
                            background: day.isToday ? 'rgba(245,158,11,0.08)' : 'rgba(17,24,39,0.4)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${day.isToday ? 'rgba(245,158,11,0.3)' : day.tasks.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                            borderRadius: 12, padding: '0.75rem 0.5rem', textAlign: 'center',
                            transition: 'all 0.2s',
                            boxShadow: day.isToday ? '0 0 15px rgba(245,158,11,0.1)' : 'none'
                        }}
                    >
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: day.isToday ? '#F59E0B' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>{day.dayName}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: day.isToday ? '#F8FAFC' : '#CBD5E1', fontFamily: 'JetBrains Mono' }}>{day.dayNum}</div>
                        {day.tasks.length > 0 ? (
                            <div style={{ marginTop: '0.35rem', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
                            </div>
                        ) : (
                            <div style={{ height: '7.5px' }} />
                        )}
                    </motion.div>
                ))}
            </motion.div>

            {/* Priority Filter */}
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {[{ v: '', label: 'ALL.PRIORITY' }, { v: 'critical', label: 'CRITICAL' }, { v: 'high', label: 'HIGH' }, { v: 'medium', label: 'NORMAL' }, { v: 'low', label: 'LOW' }].map(p => (
                    <motion.button key={p.v} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setPriorityFilter(p.v)}
                        style={{ 
                            padding: '0.4rem 1rem', borderRadius: 10, 
                            border: `1px solid ${priorityFilter === p.v ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)'}`, 
                            background: priorityFilter === p.v ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)', 
                            color: priorityFilter === p.v ? '#F59E0B' : '#94A3B8', 
                            fontWeight: 800, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', letterSpacing: '0.05em', transition: 'all 0.2s',
                            boxShadow: priorityFilter === p.v ? '0 0 15px rgba(245,158,11,0.1)' : 'none'
                        }}>
                        {p.label}
                    </motion.button>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[{ id: 'my', label: `Personal // ${myTasks.length}` }, { id: 'team', label: `Team.Matrix // ${teamTasks.length}` }].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        style={{ 
                            padding: '0.6rem 1.4rem', borderRadius: 12, 
                            border: tab === t.id ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.08)', 
                            background: tab === t.id ? 'rgba(245,158,11,0.15)' : 'rgba(17,24,39,0.5)', 
                            color: tab === t.id ? '#F59E0B' : '#64748B', 
                            fontWeight: 800, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', letterSpacing: '0.03em', transition: 'all 0.3s'
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Task list */}
            {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ height: 56, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--color-border)', marginBottom: '0.5rem', animation: 'pulse 1.5s infinite' }} />
                ))
            ) : activeTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)' }}>
                    <CheckCircle size={48} color="#10B981" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <div style={{ fontWeight: 600 }}>All caught up!</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>No {priorityFilter ? `${priorityFilter}-priority ` : ''}tasks in this category.</div>
                </div>
            ) : (
                activeTasks.map(task => (
                    <TaskRow
                        key={task._id}
                        task={task}
                        onToggleTask={toggleTask}
                        onToggleGoal={toggleGoal}
                        isTeam={task.assignment?.type === 'team'}
                    />
                ))
            )}
        </motion.div>
    );
};

export default MyWork;
