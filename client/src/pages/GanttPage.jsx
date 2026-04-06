import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
    Calendar, Layers, ChevronLeft, 
    ChevronRight, ZoomIn, ZoomOut, 
    Filter, Download, Layout, Clock 
} from 'lucide-react';
import { 
    format, addDays, startOfWeek, 
    eachDayOfInterval, isSameDay, 
    differenceInDays, startOfMonth, 
    endOfMonth 
} from 'date-fns';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;

const GanttPage = () => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewRange, setViewRange] = useState({
        start: startOfMonth(new Date()),
        end: addDays(endOfMonth(new Date()), 30) // 2 month window
    });
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [tasksRes, projectsRes] = await Promise.all([
                fetch(`${API}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/api/projects`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const tasksData = await tasksRes.json();
            const projectsData = await projectsRes.json();
            setTasks(tasksData);
            setProjects(projectsData);
        } catch (error) {
            toast.error('Failed to calibrate the Compass');
        } finally {
            setLoading(false);
        }
    };

    const days = eachDayOfInterval({ start: viewRange.start, end: viewRange.end });
    const dayWidth = 40; // px per day

    const getTaskStyle = (task) => {
        const start = new Date(task.startDate || task.createdAt);
        const end = new Date(task.endDate || addDays(start, 1));
        const offset = differenceInDays(start, viewRange.start);
        const duration = differenceInDays(end, start) || 1;

        return {
            left: offset * dayWidth,
            width: duration * dayWidth,
            backgroundColor: task.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.15)',
            borderColor: task.status === 'completed' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
            color: task.status === 'completed' ? '#10B981' : '#F59E0B'
        };
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '2rem', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                        The <span style={{ color: '#F59E0B' }}>Compass</span>
                    </h1>
                    <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Project roadmaps & temporal task distributions.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#CBD5E1', padding: '0.6rem 1.2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                        <Filter size={18} /> Filter
                    </button>
                    <button style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', padding: '0.6rem 1.2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>
                        <Download size={18} /> Export Roadmap
                    </button>
                </div>
            </div>

            {/* Gantt Container */}
            <div style={{ 
                flex: 1, 
                background: 'rgba(15, 23, 42, 0.5)', 
                backdropFilter: 'blur(20px)', 
                borderRadius: '24px', 
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Timeline Header */}
                <div style={{ 
                    display: 'flex', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    <div style={{ width: '250px', flexShrink: 0, padding: '1rem', color: '#64748B', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Project Node</div>
                    <div style={{ flex: 1, overflowX: 'auto', display: 'flex' }} className="hide-scrollbar">
                        {days.map((day, i) => (
                            <div key={i} style={{ 
                                width: dayWidth, flexShrink: 0, padding: '0.75rem 0', textAlign: 'center',
                                borderLeft: '1px solid rgba(255,255,255,0.03)', 
                                color: isSameDay(day, new Date()) ? '#F59E0B' : '#475569',
                                fontSize: '0.65rem', fontWeight: isSameDay(day, new Date()) ? 800 : 500
                            }}>
                                <div>{format(day, 'E')}</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{format(day, 'd')}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows */}
                <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    {projects.map((project) => {
                        const projectTasks = tasks.filter(t => t.project?._id === project._id || t.project === project._id);
                        return (
                            <div key={project._id} style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <div style={{ 
                                    width: '250px', flexShrink: 0, padding: '1rem',
                                    background: 'rgba(255,255,255,0.01)',
                                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                                }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: project.color || '#F59E0B' }} />
                                    <span style={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.85rem' }}>{project.name}</span>
                                </div>
                                <div style={{ flex: 1, position: 'relative', height: '50px', background: 'rgba(0,0,0,0.05)' }}>
                                    {/* Grid Lines Overlay */}
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                                        {days.map((_, i) => (
                                            <div key={i} style={{ width: dayWidth, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.03)' }} />
                                        ))}
                                    </div>
                                    
                                    {/* Task Bars */}
                                    <div style={{ position: 'relative', height: '100%', padding: '10px 0' }}>
                                        {projectTasks.map(task => (
                                            <motion.div
                                                key={task._id}
                                                whileHover={{ scale: 1.05, zIndex: 10, filter: 'brightness(1.2)' }}
                                                style={{
                                                    position: 'absolute', height: '30px', 
                                                    borderRadius: '8px', border: '1px solid',
                                                    display: 'flex', alignItems: 'center', padding: '0 0.8rem',
                                                    fontSize: '0.7rem', fontWeight: 700,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                    cursor: 'pointer',
                                                    ...getTaskStyle(task)
                                                }}
                                            >
                                                {task.title}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default GanttPage;
