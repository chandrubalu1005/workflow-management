import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
    Plus, Search, Filter, Layers, Clock, Star 
} from 'lucide-react';
import { 
    format, addMonths, subMonths, startOfMonth, 
    endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
    isSameDay, addDays, eachDayOfInterval 
} from 'date-fns';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;

const CalendarPage = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, [currentMonth]);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setTasks(data);
        } catch (error) {
            toast.error('Failed to sync calendar');
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                    The Chronicle <span style={{ color: '#F59E0B' }}>Calendar</span>
                </h1>
                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Temporal landscape of all active workflow nodes.</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: '0.5rem' }}><ChevronLeft size={20} /></button>
                <div style={{ color: '#F8FAFC', fontWeight: 800, minWidth: '140px', textAlign: 'center', fontSize: '1.1rem' }}>
                    {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: '0.5rem' }}><ChevronRight size={20} /></button>
            </div>
        </div>
    );

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '1rem' }}>
                {days.map(d => (
                    <div key={d} style={{ textAlign: 'center', color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {d}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', overflow: 'hidden' }}>
                {calendarDays.map(day => {
                    const dayTasks = tasks.filter(t => t.endDate && isSameDay(new Date(t.endDate), day));
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div
                            key={day.toString()}
                            style={{
                                minHeight: '140px',
                                background: isCurrentMonth ? '#0F172A' : '#0B1220',
                                padding: '1rem',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                        >
                            <div style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                marginBottom: '0.5rem' 
                            }}>
                                <span style={{ 
                                    fontSize: '0.9rem', fontWeight: 800,
                                    color: isToday ? '#F59E0B' : (isCurrentMonth ? '#F8FAFC' : '#334155'),
                                    background: isToday ? 'rgba(245,158,11,0.1)' : 'transparent',
                                    padding: isToday ? '0.2rem 0.5rem' : '0',
                                    borderRadius: '6px'
                                }}>
                                    {format(day, 'd')}
                                </span>
                                {isCurrentMonth && (
                                    <button style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer' }}><Plus size={14} /></button>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {dayTasks.slice(0, 3).map(task => (
                                    <motion.div
                                        key={task._id}
                                        initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                                        style={{
                                            fontSize: '0.7rem', fontWeight: 600,
                                            padding: '0.35rem 0.6rem', borderRadius: '6px',
                                            background: task.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.08)',
                                            color: task.status === 'completed' ? '#10B981' : '#F59E0B',
                                            border: `1px solid ${task.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            cursor: 'pointer'
                                        }}
                                        whileHover={{ scale: 1.02, x: 2 }}
                                    >
                                        {task.title}
                                    </motion.div>
                                ))}
                                {dayTasks.length > 3 && (
                                    <div style={{ fontSize: '0.65rem', color: '#64748B', textAlign: 'center', marginTop: '0.2rem' }}>
                                        + {dayTasks.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}
        >
            {renderHeader()}
            
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                {renderDays()}
                {loading ? (
                    <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                        Synchronizing calendar...
                    </div>
                ) : renderCells()}
            </div>
        </motion.div>
    );
};

export default CalendarPage;
