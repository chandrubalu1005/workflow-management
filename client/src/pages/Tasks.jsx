import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Tabs from '../components/Tabs';
import CreateTaskTimeline from '../components/CreateTaskTimeline';
import KanbanBoard from '../components/KanbanBoard';
import { AlertCircle, Loader, Search, Calendar, ChevronRight, Plus, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { ViewToggle } from '../components/SaaS';
import { useExportSystem } from '../hooks/useExportSystem';


const Tasks = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState('newest');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [presetFilter, setPresetFilter] = useState(null); // 'my-tasks' | 'urgent' | 'due-today'
    const [showMobileCreate, setShowMobileCreate] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const { exportCSV, exportPDF } = useExportSystem();


    useEffect(() => {
        fetchTasks();
    }, [refreshTrigger]);

    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL || window.location.origin);
        socket.on('tasks_refresh', () => {
            setRefreshTrigger(prev => prev + 1);
        });
        return () => socket.disconnect();
    }, []);

    const exportToICS = () => {
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Workflow Management//EN\n";
        tasks.filter(t => t.endDate).forEach(t => {
            const dtend = new Date(t.endDate).toISOString().replace(/-|:|\.\d+/g, "");
            icsContent += `BEGIN:VEVENT\nUID:${t._id}\nDTSTAMP:${dtend}\nDTSTART:${dtend}\nDTEND:${dtend}\nSUMMARY:${t.title}\nDESCRIPTION:${t.description || ''}\nEND:VEVENT\n`;
        });
        icsContent += "END:VCALENDAR";
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my_tasks.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDataExport = (format) => {
        setShowExportMenu(false);
        const headers = ['Task Title', 'Status', 'Priority', 'Project', 'Deadline', 'Assigned To'];
        const rows = processedTasks.map(t => [
            t.title || '',
            t.status || 'pending',
            t.priority || 'medium',
            t.project?.name || '—',
            t.endDate ? new Date(t.endDate).toLocaleDateString() : '—',
            t.assignedTo?.name || 'Unassigned'
        ]);

        if (format === 'csv') {
            exportCSV(rows, headers, 'Tasks_List');
        } else {
            exportPDF(rows, headers, 'Active Tasks Report', 'Tasks_Report', {
                period: `Filtered: ${filter} | Priority: ${priorityFilter}`,
                insights: `Currently viewing ${processedTasks.length} tasks. ${overdueTasks.length} tasks are currently overdue and require immediate attention.`
            });
        }
    };


    const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401) throw new Error('Session expired. Please login again.');
                throw new Error('Failed to fetch tasks');
            }
            const data = await response.json();
            setTasks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setError(error.message);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleGoalComplete = async (goalId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/goals/${goalId}/toggle`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const processedTasks = tasks.filter(task => {
        if (!task) return false;
        const title = task.title || '';
        const status = task.status || 'pending';
        const pri = task.priority || 'medium';

        const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
        const isCompleted = status === 'completed';
        const isOverdue = !isCompleted && task.endDate && new Date(task.endDate) < new Date();
        const matchesPriority = priorityFilter === 'all' || pri === priorityFilter;
        const today = new Date(); today.setHours(23, 59, 59, 999);
        const isDueToday = task.endDate && new Date(task.endDate) <= today && new Date(task.endDate) >= new Date(new Date().setHours(0,0,0,0));

        // Preset filters override status/priority filters
        if (presetFilter === 'my-tasks') return task.assignedTo?._id === user?._id && matchesSearch;
        if (presetFilter === 'urgent') return (pri === 'critical' || pri === 'high') && !isCompleted && matchesSearch;
        if (presetFilter === 'due-today') return isDueToday && !isCompleted && matchesSearch;

        if (!matchesPriority) return false;
        if (filter === 'active') return !isCompleted && matchesSearch;
        if (filter === 'completed') return isCompleted && matchesSearch;
        if (filter === 'overdue') return isOverdue && matchesSearch;
        return matchesSearch;
    }).sort((a, b) => {
        switch (sortConfig) {
            case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
            case 'due-soon':
                if (!a.endDate) return 1;
                if (!b.endDate) return -1;
                return new Date(a.endDate) - new Date(b.endDate);
            case 'priority':
                const pw = { critical: 4, high: 3, medium: 2, low: 1 };
                return (pw[b.priority] || 0) - (pw[a.priority] || 0);
            case 'newest':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    const handleStatusChange = async (taskId, newStatus) => {
        if (newStatus === 'refresh') {
            fetchTasks();
            return;
        }
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error('Failed to update status');
        } catch (error) {
            console.error('Status update failed:', error);
            fetchTasks();
        }
    };

    const handleAwardPoints = async (taskId, points) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/award-points`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ points })
            });
            if (!response.ok) throw new Error('Failed to award points');
            const data = await response.json();
            toast.success(`Awarded ${points} points! 🎉`);
            fetchTasks();
            return data;
        } catch (error) {
            console.error('Award points failed:', error);
            toast.error('Failed to award points');
        }
    };

    const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.endDate && new Date(t.endDate) < new Date());
    const TaskListView = (
        <TaskList
            tasks={processedTasks}
            loading={loading}
            error={error}
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            onGoalComplete={handleGoalComplete}
            isAdmin={isAdmin}
            onRetry={fetchTasks}
            onStatusChange={handleStatusChange}
            onAwardPoints={handleAwardPoints}
            overdueTasks={overdueTasks}
            presetFilter={presetFilter}
            setPresetFilter={setPresetFilter}
            currentUserId={user?._id}
            exportToICS={exportToICS}
            onDataExport={handleDataExport}
            showExportMenu={showExportMenu}
            setShowExportMenu={setShowExportMenu}
        />

    );

    if (isAdmin) {
        const tabs = [
            { label: 'All Tasks', content: TaskListView },
            { label: 'Create New Task', content: <CreateTaskTimeline onSuccess={() => setRefreshTrigger(prev => prev + 1)} /> }
        ];
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#F8FAFC' }}>Task Management</h2>
                    <button className="mobile-fab hover-scale" onClick={() => setShowMobileCreate(true)}>
                        <Plus size={24} />
                    </button>
                </div>
                
                <div style={{ background: 'transparent', border: 'none', padding: 0 }} className="glass-panel-override desktop-tabs">
                    <Tabs tabs={tabs} />
                </div>

                <div className="mobile-only-task-view">
                    {TaskListView}
                </div>

                {/* Mobile Bottom Sheet for Task Creation */}
                <AnimatePresence>
                    {showMobileCreate && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowMobileCreate(false)}
                                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999 }}
                            />
                            <motion.div
                                drag="y"
                                dragConstraints={{ top: 0, bottom: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(e, info) => { if (info.offset.y > 150) setShowMobileCreate(false); }}
                                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-card)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 1000, maxHeight: '90vh', overflowY: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <div style={{ width: '40px', height: '5px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', margin: '0 auto 1rem auto', cursor: 'grab' }} />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-2rem', position: 'relative', zIndex: 10 }}>
                                    <button onClick={() => setShowMobileCreate(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '0.4rem', color: '#fff', cursor: 'pointer' }}><X size={16}/></button>
                                </div>
                                <CreateTaskTimeline onSuccess={() => { setRefreshTrigger(prev => prev + 1); setShowMobileCreate(false); }} />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                style={{ marginBottom: '2.5rem' }}
            >
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                    Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, <span style={{ color: '#F59E0B' }}>{user?.name?.split(' ')[0] || 'there'}</span> 👋
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>
                    {loading ? 'Getting things ready...' : `You have ${processedTasks.filter(t => t.status !== 'completed').length} active tasks matching your filters.`}
                </p>
            </motion.div>
            {TaskListView}
        </motion.div>
    );
};

const PRIORITY_CHIPS = [
    { value: 'all', label: 'All Priority', color: 'var(--text-muted)', bg: 'var(--glass-bg)', border: 'var(--border-default)' },
    { value: 'critical', label: '🔴 Critical', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
    { value: 'high', label: '🟠 High', color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
    { value: 'medium', label: '🟡 Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    { value: 'low', label: '🟢 Low', color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
];

const TaskTableView = ({ tasks, onStatusChange }) => {
    return (
        <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-default)',
            borderRadius: '16px',
            overflow: 'hidden'
        }}>
            {/* Table Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(200px, 2fr) 120px 100px 150px 150px',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.2)',
                borderBottom: '1px solid var(--border-default)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                <div>Task Title</div>
                <div>Status</div>
                <div>Priority</div>
                <div>Project</div>
                <div style={{ textAlign: 'right' }}>Deadline</div>
            </div>

            {/* Table Body */}
            <div>
                {tasks.map((t, i) => {
                    const statusColors = {
                        pending: { bg: 'rgba(156,163,175,0.1)', color: '#9CA3AF' },
                        'in-progress': { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' },
                        review: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
                        completed: { bg: 'rgba(16,185,129,0.1)', color: '#10B981' }
                    };
                    const sc = statusColors[t.status || 'pending'];

                    return (
                        <motion.div
                            key={t._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="task-table-row"
                            gridTemplateColumns="minmax(200px, 2fr) 120px 100px 150px 150px"
                            style={{ display: 'grid' }}
                            onClick={() => {}} // Optional: details modal
                        >
                            <div style={{ fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className={`priority-dot priority-dot-${t.priority || 'medium'}`} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                            </div>
                            <div>
                                <select
                                    value={t.status || 'pending'}
                                    onChange={(e) => onStatusChange(t._id, e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        background: sc.bg,
                                        color: sc.color,
                                        border: '1px solid transparent',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        outline: 'none',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="review">Review</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                                {t.priority || 'medium'}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.project?.name || '—'}
                            </div>
                            <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}>
                                {t.endDate ? new Date(t.endDate).toLocaleDateString() : '—'}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

const TaskList = ({ tasks, loading, error, search, setSearch, filter, setFilter, priorityFilter, setPriorityFilter, sortConfig, setSortConfig, onGoalComplete, isAdmin, onRetry, onStatusChange, onAwardPoints, overdueTasks, presetFilter, setPresetFilter, currentUserId, exportToICS, onDataExport, showExportMenu, setShowExportMenu }) => {

    const [viewMode, setViewMode] = useState(() => localStorage.getItem('tasks-view') || 'kanban');
    const handleViewChange = (v) => { setViewMode(v); localStorage.setItem('tasks-view', v); };

    const hasActiveFilters = filter !== 'all' || priorityFilter !== 'all' || search || presetFilter;
    const clearAllFilters = () => { setFilter('all'); setPriorityFilter('all'); setSearch(''); setPresetFilter?.(null); };

    return (
        <div>
            {/* Preset Quick-Filter Pills */}
            <div className="filter-pills-container scrollbar-hide" style={{ marginBottom: '1rem', display: 'flex', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0 }}>Quick Filter:</span>
                {[
                    { key: 'my-tasks', label: '👤 My Tasks' },
                    { key: 'urgent', label: '🔥 Urgent' },
                    { key: 'due-today', label: '📅 Due Today' },
                ].map(p => (
                    <button key={p.key} onClick={() => setPresetFilter?.(presetFilter === p.key ? null : p.key)}
                        className={`filter-pill${presetFilter === p.key ? ' active' : ''}`} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {p.label}
                    </button>
                ))}
                {hasActiveFilters && (
                    <button onClick={clearAllFilters}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.65rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        ✕ Clear Filters
                    </button>
                )}
            </div>

            {/* Header Controls */}
            <div className="page-header-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="tabs-container scrollbar-hide" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', overflowX: 'auto', alignItems: 'center', paddingBottom: '4px' }}>
                    {[
                        { value: 'all', label: 'All Tasks' },
                        { value: 'active', label: 'Active' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'overdue', label: `⚠ Overdue ${overdueTasks?.length > 0 ? `(${overdueTasks.length})` : ''}` },
                    ].map(tab => (
                        <motion.button
                            key={tab.value}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setFilter(tab.value)}
                            style={{
                                padding: '0.45rem 1rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.825rem',
                                fontWeight: filter === tab.value ? 700 : 500,
                                background: filter === tab.value
                                    ? (tab.value === 'overdue' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)')
                                    : 'var(--glass-bg)',
                                border: filter === tab.value
                                    ? (tab.value === 'overdue' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(245,158,11,0.4)')
                                    : '1px solid var(--border-default)',
                                color: filter === tab.value
                                    ? (tab.value === 'overdue' ? '#EF4444' : '#F59E0B')
                                    : 'var(--text-muted)',
                                transition: 'all 0.2s',
                            }}
                        >{tab.label}</motion.button>
                    ))}
                    <div style={{ marginLeft: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select
                            className="form-select"
                            style={{ padding: '0.45rem 1rem', borderRadius: '10px', backgroundColor: 'var(--glass-bg)', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', fontSize: '0.825rem', outline: 'none' }}
                            value={sortConfig}
                            onChange={(e) => setSortConfig(e.target.value)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="due-soon">Due Soon</option>
                            <option value="priority">Priority</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowExportMenu(!showExportMenu)} className="form-select hover-scale" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '10px', backgroundColor: 'var(--glass-bg)', color: 'var(--color-text-main)', border: '1px solid var(--border-default)', fontSize: '0.825rem', cursor: 'pointer', outline: 'none' }}>
                            <Download size={14} color="#F59E0B" /> Export List
                        </button>
                        
                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    style={{
                                        position: 'absolute', top: '110%', right: 0, zIndex: 100,
                                        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                                        borderRadius: '8px', padding: '0.5rem', minWidth: '150px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    <button onClick={() => onDataExport('pdf')} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: 'none', color: '#F8FAFC', cursor: 'pointer', borderRadius: '6px', textAlign: 'left', fontSize: '0.75rem' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Professional PDF</button>
                                    <button onClick={() => onDataExport('csv')} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: 'none', color: '#F8FAFC', cursor: 'pointer', borderRadius: '6px', textAlign: 'left', fontSize: '0.75rem' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Raw CSV Data</button>
                                    <button onClick={exportToICS} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: 'none', color: '#F8FAFC', cursor: 'pointer', borderRadius: '6px', textAlign: 'left', fontSize: '0.75rem' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>iCal / ICS Sync</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {/* View Toggle */}
                    <ViewToggle view={viewMode} onChange={handleViewChange} />
                </div>

            </div>

            {/* Sub-header Filter & Search */}
            <div className="page-header-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Priority Filter Chips */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap', overflowX: 'auto', alignItems: 'center', paddingBottom: '4px' }} className="tabs-container scrollbar-hide">
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: '0.25rem', flexShrink: 0 }}>Priority:</span>
                    {PRIORITY_CHIPS.map(chip => (
                        <motion.button
                            key={chip.value}
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                            onClick={() => setPriorityFilter(chip.value)}
                            style={{
                                padding: '0.35rem 0.85rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.75rem', fontWeight: 600,
                                background: priorityFilter === chip.value ? chip.bg : 'transparent',
                                border: priorityFilter === chip.value ? `1px solid ${chip.border}` : '1px solid transparent',
                                color: priorityFilter === chip.value ? chip.color : 'var(--color-text-muted)',
                                transition: 'all 0.2s', flexShrink: 0, whiteSpace: 'nowrap'
                            }}
                        >{chip.label}</motion.button>
                    ))}
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        placeholder="Search tasks..."
                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 1rem 0.6rem 2.8rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: '#F8FAFC', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.85rem' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '6rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', color: 'var(--color-text-secondary)' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                        <Loader size={40} color="#F59E0B" />
                    </motion.div>
                    <p>Loading your workspace...</p>
                </div>
            ) : error ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ padding: '2rem', textAlign: 'center', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <AlertCircle size={24} />
                        <span style={{ fontWeight: 'bold' }}>Unable to load tasks</span>
                    </div>
                    <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>{error}</p>
                    <button onClick={onRetry} className="glass-button" style={{ color: '#EF4444', borderColor: '#EF4444' }}>
                        Try Again
                    </button>
                </motion.div>
            ) : tasks.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)', background: 'var(--glass-bg)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}
                >
                    <p style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>No tasks found.</p>
                    <p style={{ fontSize: '1rem', opacity: 0.7 }}>{isAdmin ? "Create a task to get started!" : "You have no assigned tasks yet."}</p>
                </motion.div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={viewMode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {viewMode === 'kanban' ? (
                            <KanbanBoard
                                tasks={tasks}
                                onStatusChange={onStatusChange}
                                onGoalComplete={onGoalComplete}
                                isAdmin={isAdmin}
                                onAwardPoints={onAwardPoints}
                            />
                        ) : (
                            <TaskTableView tasks={tasks} onStatusChange={onStatusChange} />
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default Tasks;
