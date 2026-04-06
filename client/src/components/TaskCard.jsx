import { useState, useCallback } from 'react';
import {
    Calendar, AlertTriangle, Flame, ChevronDown, ChevronUp,
    CheckCircle2, Circle, Clock, Trophy, Star, Zap, Users, Archive, X,
    FileText, History, Layout, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { formatDate, isOverdue as checkIsOverdue, getDaysOverdue } from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';
import { TaskComments } from './TaskComments';
import { TaskTimeTracker } from './TaskTimeTracker';
import AuditTrail from './AuditTrail';
import TaskFileVault from './TaskFileVault';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const getPriorityColor = (p) => ({
    critical: { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444' },
    high:     { bg: 'rgba(249,115,22,0.15)', text: '#f97316' },
    medium:   { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
    low:      { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
}[p] || { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' });

const isGoalOnTime = (goal) => {
    if (!goal.completedAt || !goal.deadline) return null;
    return new Date(goal.completedAt) <= new Date(goal.deadline);
};

/* ─── Progress Ring ─────────────────────────────────────────────────────── */
const ProgressRing = ({ pct, size = 36, stroke = 3 }) => {
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const color = pct === 100 ? '#10B981' : '#F59E0B';
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
            <motion.circle
                cx={size/2} cy={size/2} r={r} fill="none"
                stroke={color} strokeWidth={stroke}
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                strokeLinecap="round"
            />
        </svg>
    );
};

/* ─── Single Goal Row ───────────────────────────────────────────────────── */
const GoalRow = ({ goal, onToggle, isReadOnly }) => {
    const [loading, setLoading] = useState(false);

    const handleToggle = async (e) => {
        e.stopPropagation();
        if (isReadOnly || loading || goal.isCompleted) return;
        setLoading(true);
        await onToggle(goal._id);
        setLoading(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 0.8rem', borderRadius: 10,
                background: goal.isCompleted ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                border: goal.isCompleted ? '1px solid rgba(16,185,129,0.1)' : '1px solid rgba(255,255,255,0.04)',
                cursor: (!isReadOnly && !goal.isCompleted) ? 'pointer' : 'default',
            }}
            onClick={handleToggle}
            whileHover={(!isReadOnly && !goal.isCompleted) ? { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' } : {}}
        >
            <div style={{
                width: 18, height: 18, borderRadius: 5, border: '1.5px solid rgba(255,255,255,0.2)',
                background: goal.isCompleted ? '#10B981' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {goal.isCompleted && <CheckCircle2 size={12} color="#fff" />}
            </div>
            <span style={{ 
                flex: 1, fontSize: '0.8rem', color: goal.isCompleted ? '#64748B' : '#CBD5E1',
                textDecoration: goal.isCompleted ? 'line-through' : 'none'
            }}>{goal.title}</span>
            {goal.rewardPoints > 0 && (
                <span style={{ fontSize: '0.65rem', color: '#F59E0B', fontWeight: 700 }}>+{goal.rewardPoints}pts</span>
            )}
        </motion.div>
    );
};

/* ─── Main TaskCard ─────────────────────────────────────────────────────── */
const TaskCard = ({ task, onGoalComplete, onStatusUpdate, isReadOnly = false, isAdmin = false, onAwardPoints }) => {
    const [showComments, setShowComments] = useState(false);
    const [showVault, setShowVault] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const { isDark } = useTheme();

    const completedGoals = task.goals?.filter(g => g.isCompleted).length || 0;
    const totalGoals = task.goals?.length || 0;
    const progress = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

    const isOverdue = checkIsOverdue(task.endDate) && progress < 100;
    const priorityStyle = getPriorityColor(task.priority || 'medium');

    const handleGoalToggle = useCallback(async (goalId) => {
        try {
            const res = await fetch(`${API}/api/tasks/goals/${goalId}/toggle`, {
                method: 'PATCH',
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            if (onGoalComplete) onGoalComplete(goalId, data);
            toast.success('Goal updated');
        } catch {
            toast.error('Failed to update goal');
        }
    }, [onGoalComplete]);

    const handleArchive = async (e) => {
        e.stopPropagation();
        try {
            const res = await fetch(`${API}/api/tasks/${task._id}/archive`, {
                method: 'PUT',
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error('Archive failed');
            toast.success('Task archived');
            if (onStatusUpdate) onStatusUpdate(task._id, 'archived');
        } catch {
            toast.error('Failed to archive task');
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)',
                borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)',
                padding: '1.25rem', marginBottom: '1rem', position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: expanded ? '0 20px 40px rgba(0,0,0,0.4)' : 'none'
            }}
            whileHover={{ borderColor: 'rgba(245,158,11,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ 
                            fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', 
                            padding: '0.15rem 0.5rem', borderRadius: '4px',
                            background: priorityStyle.bg, color: priorityStyle.text 
                        }}>{task.priority}</span>
                        {task.project && (
                            <span style={{ fontSize: '0.6rem', color: '#3B82F6', fontWeight: 700 }}>{task.project.name}</span>
                        )}
                        {task.archiveType && (
                            <span style={{ fontSize: '0.6rem', color: '#64748B', fontWeight: 700 }}>Archived ({task.archiveType})</span>
                        )}
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.25rem' }}>{task.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#94A3B8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {task.description}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={(e) => { e.stopPropagation(); setShowHistory(true); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '0.4rem', color: '#64748B', cursor: 'pointer' }} title="Chronicle">
                            <History size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setShowVault(true); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '0.4rem', color: task.attachments?.length > 0 ? '#F59E0B' : '#64748B', cursor: 'pointer' }} title="Vault">
                            <Archive size={16} />
                        </button>
                    </div>
                    <ProgressRing pct={progress} />
                </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748B', fontSize: '0.7rem' }}>
                    <Calendar size={14} />
                    <span style={{ color: isOverdue ? '#EF4444' : 'inherit' }}>{formatDate(task.endDate)}</span>
                </div>
                {task.rewardPoints > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#F59E0B', fontSize: '0.7rem', fontWeight: 700 }}>
                        <Star size={14} fill="#F59E0B" />
                        {task.rewardPoints} pts
                    </div>
                )}
                {task.assignedTo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                         <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#3B82F6', color: '#fff', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {task.assignedTo.name?.charAt(0)}
                        </div>
                        <span style={{ color: '#64748B', fontSize: '0.7rem' }}>{task.assignedTo.name}</span>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                            {task.goals?.map(goal => (
                                <GoalRow key={goal._id} goal={goal} onToggle={handleGoalToggle} isReadOnly={isReadOnly} />
                            ))}
                        </div>
                        
                        <TaskTimeTracker task={task} />
                        
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#CBD5E1', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                    <MessageSquare size={14} /> Comments
                                </div>
                            </button>
                            {isAdmin && task.status === 'completed' && !task.isArchived && (
                                <button onClick={handleArchive} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', fontSize: '0.8rem', cursor: 'pointer' }}>
                                    Archive Task
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals & Components */}
            <AuditTrail taskId={task._id} isOpen={showHistory} onClose={() => setShowHistory(false)} />
            <TaskComments taskId={task._id} isOpen={showComments} onClose={() => setShowComments(false)} />

            <AnimatePresence>
                {showVault && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVault(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }} />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            style={{ 
                                position: 'relative', width: '90%', maxWidth: '600px', background: '#0F172A', 
                                border: '1px solid rgba(245,158,11,0.2)', borderRadius: '24px', padding: '2rem',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', maxHeight: '85vh', overflowY: 'auto'
                            }}
                            className="custom-scrollbar"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ color: '#F8FAFC', fontSize: '1.5rem', fontWeight: 900 }}>The Vault</h3>
                                    <p style={{ color: '#64748B', fontSize: '0.8rem' }}>Assets management for {task.title}</p>
                                </div>
                                <button onClick={() => setShowVault(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <TaskFileVault 
                                taskId={task._id} 
                                attachments={task.attachments || []} 
                                onUploadSuccess={() => {}}
                                onDeleteSuccess={() => {}}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TaskCard;
