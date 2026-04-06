import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, ArrowLeft, Calendar, 
    Users, CheckCircle, Clock, AlertCircle, X 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import CreateTaskForm from '../components/CreateTaskForm';
import MagneticButton from '../components/MagneticButton';
import ProjectLedger from '../components/ProjectLedger';

const ProjectDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddTask, setShowAddTask] = useState(false);
    const [activeTab, setActiveTab] = useState('tasks');

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch project details');

            const data = await response.json();
            setProject(data.project);
            setTasks(data.tasks || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete task');

            toast.success('Task removed from project');
            setTasks(tasks.filter(t => t._id !== taskId));
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleUpdateFinancials = async (financialData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(financialData)
            });

            if (!response.ok) throw new Error('Failed to update financials');

            const updatedProject = await response.json();
            setProject(updatedProject);
            return updatedProject;
        } catch (err) {
            toast.error(err.message);
            throw err;
        }
    };

    if (loading) return (
        <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', gap: '1rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 40, height: 40, border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#F59E0B', borderRadius: '50%' }} />
            <div style={{ fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', fontSize: '0.85rem' }}>LOADING PROJECT_DATA...</div>
        </div>
    );

    if (error) return (
        <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <AlertCircle size={32} color="#EF4444" />
            </div>
            <h2 style={{ color: '#F8FAFC', marginBottom: '0.5rem' }}>Project Access Error</h2>
            <p style={{ color: 'var(--color-error)' }}>{error}</p>
            <Link to="/projects" style={{ display: 'inline-block', marginTop: '1.5rem', color: '#F59E0B', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>Return to Projects</Link>
        </div>
    );

    if (!project) return null;

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Link to="/projects" className="hover-lift" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '20px', background: 'rgba(255,255,255,0.05)' }}>
                <ArrowLeft size={16} /> Back to Projects
            </Link>

            {/* Cinematic Header */}
            <div className="glass-panel animate-fade-in" style={{ 
                padding: '2.5rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden',
                background: project.status === 'completed' ? 'radial-gradient(150% 150% at 50% -20%, rgba(16,185,129,0.15) 0%, rgba(11,18,32,0.85) 100%)' : 'radial-gradient(150% 150% at 50% -20%, rgba(245,158,11,0.15) 0%, rgba(11,18,32,0.85) 100%)',
                borderTop: `1px solid ${project.status === 'completed' ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`
            }}>
                <div style={{ position: 'absolute', top: '-150px', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '300px', background: project.status === 'completed' ? '#10B981' : '#F59E0B', filter: 'blur(120px)', opacity: 0.15, zIndex: 0, pointerEvents: 'none' }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '2rem' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#F8FAFC' }}>{project.name}</h1>
                                <span style={{
                                    padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                                    backgroundColor: project.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                    color: project.status === 'completed' ? '#34D399' : '#F59E0B',
                                    border: `1px solid ${project.status === 'completed' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                                }}>
                                    {project.status}
                                </span>
                            </div>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '700px' }}>{project.description}</p>
                        </div>

                        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 12px ${project.status === 'completed' ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)'})` }}>
                                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                                <motion.circle
                                    cx="60" cy="60" r="54" fill="none" stroke={project.status === 'completed' ? '#10B981' : '#F59E0B'} strokeWidth="8"
                                    strokeDasharray="339.292"
                                    strokeDashoffset={339.292 * (1 - progress / 100)}
                                    strokeLinecap="round"
                                    initial={{ strokeDashoffset: 339.292 }}
                                    animate={{ strokeDashoffset: 339.292 * (1 - progress / 100) }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', fontFamily: 'JetBrains Mono' }}>{progress}%</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}><Calendar size={20} /></div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Timeline</div>
                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                    {new Date(project.startDate).toLocaleDateString()} — {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                                </div>
                            </div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}><Users size={20} /></div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Team Size</div>
                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{project.members?.length || 0} Members</div>
                            </div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}><CheckCircle size={20} /></div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Task Progress</div>
                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{completedTasks} / {tasks.length} Completed</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabbed Interface — Adaptive Layout */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: project.members?.length > 0 ? '1fr 320px' : '1fr', 
                gap: '2.5rem',
                alignItems: 'start'
            }}>
                <div>
                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <button 
                            onClick={() => setActiveTab('tasks')}
                            style={{ 
                                padding: '1rem 0.5rem', background: 'none', border: 'none', 
                                color: activeTab === 'tasks' ? '#F59E0B' : '#64748B',
                                borderBottom: activeTab === 'tasks' ? '2px solid #F59E0B' : '2px solid transparent',
                                fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                                textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem'
                            }}
                        >Tasks</button>
                        <button 
                            onClick={() => setActiveTab('financials')}
                            style={{ 
                                padding: '1rem 0.5rem', background: 'none', border: 'none', 
                                color: activeTab === 'financials' ? '#F59E0B' : '#64748B',
                                borderBottom: activeTab === 'financials' ? '2px solid #F59E0B' : '2px solid transparent',
                                fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                                textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem'
                            }}
                        >Financials</button>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'tasks' ? (
                            <motion.div key="tasks" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC' }}>Project Tasks</h2>
                                    {isAdmin && (
                                        <MagneticButton onClick={() => setShowAddTask(true)}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: '#F59E0B', color: '#000', borderRadius: '12px', fontWeight: '800', fontSize: '0.85rem' }}>
                                                <Plus size={16} /> Add Task
                                            </div>
                                        </MagneticButton>
                                    )}
                                </div>
                                {tasks.length === 0 ? (
                                    <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: '#64748B', borderStyle: 'dashed' }}>
                                        <CheckCircle size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                        <p>Total node clearance. No active tasks detected.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {tasks.map(task => (
                                            <motion.div
                                                key={task._id}
                                                whileHover={{ x: 5 }}
                                                className="glass-panel"
                                                style={{ 
                                                    padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                    borderLeft: `4px solid ${task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F59E0B' : '#10B981'}` 
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: '700', color: '#F8FAFC', marginBottom: '0.35rem', fontSize: '1.05rem' }}>{task.title}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Users size={12} /> {task.assignedTo?.name || 'Unassigned'}</span>
                                                        {task.endDate && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} /> {new Date(task.endDate).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '6px', background: task.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: task.status === 'completed' ? '#10B981' : '#F59E0B', textTransform: 'uppercase' }}>{task.status}</div>
                                                    {isAdmin && (
                                                        <button onClick={() => handleDeleteTask(task._id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="financials" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                <ProjectLedger project={project} onUpdate={handleUpdateFinancials} isAdmin={isAdmin} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Team Sidebar — Only render if operatives detected */}
                {project.members?.length > 0 && (
                    <motion.aside
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ position: 'sticky', top: '2rem' }}
                    >
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                            The <span style={{ color: '#F59E0B' }}>Team</span>
                        </h2>
                        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                            {project.members.map(member => (
                                <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', border: '1px solid rgba(245,158,11,0.15)' }}>
                                        {member.name.charAt(0)}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} /> ACTIVE_OPERATIVE
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.aside>
                )}
            </div>

            {/* Add Task Modal */}
            <AnimatePresence>
                {showAddTask && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddTask(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ position: 'relative', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: '#0F172A', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem' }}>
                             <CreateTaskForm projectId={id} onSuccess={() => { setShowAddTask(false); fetchProjectDetails(); }} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ProjectDetails;
