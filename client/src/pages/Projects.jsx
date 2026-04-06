import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Calendar, Users, Folder, MoreVertical, X, Check, Grid, List, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import SmartAssignModal from '../components/SmartAssignModal';
import { toast } from 'react-hot-toast';
import DatePicker from '../components/DatePicker';
import TiltContainer from '../components/TiltContainer';

const Projects = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('projects-view') || 'grid');
    const [sortBy, setSortBy] = useState('newest');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'active',
        members: []
    });
    const [showAssignModal, setShowAssignModal] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, [refreshTrigger]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();
            setProjects(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to create project');

            toast.success('Project initiated with smart allocation');
            setShowCreateModal(false);
            setRefreshTrigger(prev => prev + 1);
            setFormData({
                name: '',
                description: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                status: 'active',
                members: []
            });
        } catch (err) {
            toast.error(err.message);
        }
    };

    const toggleMember = (user) => {
        const userId = user._id;
        setFormData(prev => ({
            ...prev,
            members: prev.members.includes(userId)
                ? prev.members.filter(id => id !== userId)
                : [...prev.members, userId]
        }));
    };

    const getProjectHealth = (project) => {
        if (project.status === 'completed') return { label: 'Completed', cls: 'on-track' };
        if (!project.endDate) return { label: 'No Date', cls: 'at-risk' };
        const daysLeft = Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        const progress = project.totalTasks > 0 ? (project.completedTasks || 0) / project.totalTasks : 0;
        if (daysLeft < 0) return { label: 'Delayed', cls: 'delayed' };
        if (daysLeft < 7 && progress < 0.7) return { label: 'At Risk', cls: 'at-risk' };
        return { label: 'On Track', cls: 'on-track' };
    };

    const getDaysLeft = (endDate) => {
        if (!endDate) return null;
        const d = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
        return d;
    };

    const filteredProjects = projects
        .filter(p =>
            (statusFilter === 'all' || p.status === statusFilter) &&
            (
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'status') return a.status.localeCompare(b.status);
            if (sortBy === 'progress') {
                const pa = a.totalTasks > 0 ? (a.completedTasks || 0) / a.totalTasks : 0;
                const pb = b.totalTasks > 0 ? (b.completedTasks || 0) / b.totalTasks : 0;
                return pb - pa;
            }
            // newest (default)
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="projects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#F8FAFC', marginBottom: '0.3rem' }}>Projects</h1>
                    <p style={{ color: '#4B5563', fontSize: '0.9rem' }}>Manage your team's initiatives and goals.</p>
                </div>
                <button className="mobile-fab hover-scale" onClick={() => setShowCreateModal(true)}>
                    <Plus size={24} />
                </button>
                {(isAdmin || true) && (
                    <motion.button
                        className="desktop-only-btn"
                        onClick={() => setShowCreateModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', color: '#111827', fontFamily: 'Inter', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,158,11,0.2)' }}
                    >
                        <Plus size={18} />
                        New Project
                    </motion.button>
                )}
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {['all', 'active', 'completed', 'archived'].map(s => (
                    <motion.button
                        key={s}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setStatusFilter(s)}
                        style={{
                            padding: '0.45rem 1.1rem', borderRadius: '10px', cursor: 'pointer',
                            fontFamily: 'Inter', fontSize: '0.825rem', fontWeight: statusFilter === s ? 700 : 500,
                            background: statusFilter === s ? 'rgba(245,158,11,0.15)' : 'var(--glass-bg)',
                            border: statusFilter === s ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border-default)',
                            color: statusFilter === s ? '#F59E0B' : 'var(--text-muted)',
                            textTransform: 'capitalize', transition: 'all 0.2s',
                        }}
                    >{s === 'all' ? 'All Projects' : s}</motion.button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.875rem', borderRadius: '10px', background: 'var(--glass-bg)', border: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{filteredProjects.length}</span>
                    <span>project{filteredProjects.length !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Controls Row: Search + View Toggle + Sort */}
            <div className="projects-controls" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '0.75rem 1.25rem', marginBottom: '1.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Search size={18} style={{ color: '#374151', flexShrink: 0 }} />
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#CBD5E1', fontSize: '0.9rem', width: '100%', outline: 'none', fontFamily: 'Inter', minWidth: '150px' }}
                />
                {/* Sort Dropdown */}
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.35rem 0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)', outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    <option value="newest">Newest</option>
                    <option value="name">Name A-Z</option>
                    <option value="status">By Status</option>
                    <option value="progress">By Progress</option>
                </select>
                {/* View Toggle */}
                <div className="view-toggle" style={{ flexShrink: 0 }}>
                    <button className={`view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => { setViewMode('grid'); localStorage.setItem('projects-view', 'grid'); }}><Grid size={15} /></button>
                    <button className={`view-toggle-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => { setViewMode('list'); localStorage.setItem('projects-view', 'list'); }}><List size={15} /></button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ height: viewMode === 'list' ? '80px' : '280px', background: 'var(--bg-card)', borderRadius: '18px', padding: '1.5rem', border: '1px solid var(--border-default)' }} className="skeleton skeleton-card" />
                    ))}
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#EF4444' }}>{error}</div>
            ) : filteredProjects.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Folder size={32} color="#F59E0B" /></div>
                    <p className="empty-state-title">No projects found</p>
                    <p className="empty-state-desc">{searchTerm ? 'Try adjusting your search term.' : 'Create your first project to get started!'}</p>
                </div>
            ) : (
                <motion.div
                    className="projects-grid"
                    initial="hidden" animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                    style={{ display: viewMode === 'list' ? 'flex' : 'grid', flexDirection: 'column', gap: '1.25rem' }}>
                    {filteredProjects.map((project, index) => (
                        <TiltContainer key={project._id} intensity={15} style={{ height: '100%' }}>
                            <motion.div
                                className="project-card"
                                variants={{
                                    hidden: { opacity: 0, y: 20, scale: 0.92 },
                                    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } }
                                }}
                                whileHover={{ y: -8, scale: 1.02, borderColor: 'rgba(245,158,11,0.5)', boxShadow: '0 20px 48px rgba(0,0,0,0.5), 0 0 40px rgba(245,158,11,0.15)' }}
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '18px', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', height: '100%' }}
                            >
                                <Link to={`/projects/${project._id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                        <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                                            <Folder size={22} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                                            {/* Health badge */}
                                            <span className={`health-badge ${getProjectHealth(project).cls}`}>
                                                {getProjectHealth(project).cls === 'on-track' ? '●' : getProjectHealth(project).cls === 'at-risk' ? '◐' : '✕'} {getProjectHealth(project).label}
                                            </span>
                                            {/* Due date countdown */}
                                            {project.endDate && getDaysLeft(project.endDate) !== null && (
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: getDaysLeft(project.endDate) < 3 ? '#EF4444' : getDaysLeft(project.endDate) < 7 ? '#F59E0B' : '#6B7280' }}>
                                                    {getDaysLeft(project.endDate) < 0 ? `${Math.abs(getDaysLeft(project.endDate))}d overdue` : `${getDaysLeft(project.endDate)}d left`}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{project.name}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
                                        {project.description || 'No description provided.'}
                                    </p>

                                    {/* Progress Ring */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Completion</div>
                                            <div style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
                                                <span style={{ color: project.status === 'completed' ? '#10B981' : '#F59E0B' }}>{project.completedTasks || 0}</span> / {project.totalTasks || 0} Tasks
                                            </div>
                                        </div>
                                        <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="40" height="40" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 6px ${project.status === 'completed' ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'})` }}>
                                                <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
                                                <motion.circle
                                                    cx="20" cy="20" r="16"
                                                    stroke={project.status === 'completed' ? '#10B981' : '#F59E0B'}
                                                    strokeWidth="3" fill="none" strokeLinecap="round"
                                                    initial={{ strokeDasharray: '100 100', strokeDashoffset: 100 }}
                                                    whileInView={{ strokeDashoffset: 100 - ((project.status === 'completed' ? 100 : Math.round((project.completedTasks || 0) / Math.max(project.totalTasks || 1, 1) * 100)) / 100 * 100) }}
                                                    viewport={{ once: true }} transition={{ duration: 1.2, ease: 'easeOut' }}
                                                />
                                            </svg>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: project.status === 'completed' ? '#10B981' : '#F59E0B', fontFamily: 'JetBrains Mono' }}>
                                                {project.status === 'completed' ? '100' : Math.round((project.completedTasks || 0) / Math.max(project.totalTasks || 1, 1) * 100)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.875rem', marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}>
                                            <Calendar size={13} color="#F59E0B" />
                                            <span>{new Date(project.startDate).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            <Users size={13} color="#F59E0B" />
                                            <span>{project.members?.length || 0} Members</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        </TiltContainer>
                    ))}
                </motion.div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '20px', padding: '2rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Create New Project</h2>
                                <button onClick={() => setShowCreateModal(false)} style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#4B5563', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
                            </div>

                            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Project Name</label>
                                    <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Q4 Marketing Campaign"
                                        style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F8FAFC', outline: 'none', fontFamily: 'Inter', fontSize: '0.875rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Project goals and details..."
                                        style={{ width: '100%', minHeight: '90px', resize: 'vertical', padding: '0.65rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F8FAFC', outline: 'none', fontFamily: 'Inter', fontSize: '0.875rem' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.875rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <DatePicker 
                                            label="Start Date"
                                            value={formData.startDate}
                                            onChange={val => setFormData({ ...formData, startDate: val })}
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <DatePicker 
                                            label="End Date"
                                            value={formData.endDate}
                                            onChange={val => setFormData({ ...formData, endDate: val })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Workforce Selection ({formData.members.length})</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignModal(true)}
                                        style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', outline: 'none', fontFamily: 'Inter', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <Users size={16} />
                                        {formData.members.length === 0 ? 'Identify Best Match' : `${formData.members.length} Specialists Selected`}
                                    </button>
                                </div>
                                <motion.button type="submit" whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(245,158,11,0.35)' }} whileTap={{ scale: 0.98 }}
                                    style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '12px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', color: '#111827', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.9rem' }}>
                                    Create Project
                                </motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SmartAssignModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                onSelect={(val) => {
                    if (val.type === 'individual') {
                        // For project creation, we just need the ID to add to members array
                        const userId = val.targetId;
                        setFormData(prev => ({
                            ...prev,
                            members: prev.members.includes(userId)
                                ? prev.members.filter(id => id !== userId)
                                : [...prev.members, userId]
                        }));
                    }
                }}
                currentValue={null} // Not strictly needed for multi-select here, but we can pass something if we want
            />
        </motion.div>
    );
};

export default Projects;
