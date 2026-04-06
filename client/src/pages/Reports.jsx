import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, Trophy, ArrowUpRight, BarChart2, Search, Filter, RotateCcw,
    Calendar as CalendarIcon, Archive, Download, Activity, LayoutList,
    Target, Zap, Loader, AlertTriangle, CheckCircle, Clock, Users
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import toast from 'react-hot-toast';
import TiltContainer from '../components/TiltContainer';
import { useExportSystem } from '../hooks/useExportSystem';
import { AnimatePresence } from 'framer-motion';


const API = import.meta.env.VITE_API_URL;

/* ── Ambient Gold Color Palette ────────────────────────── */
const GOLD_COLORS = [
    '#FDE68A', // Lightest gold
    '#FBBF24', // Light gold
    '#F59E0B', // Primary amber/gold
    '#D97706', // Dark gold
    '#92400E', // Deepest gold/brown
];

/* ── Executive Components ────────────────────────── */

const ambientGlowStyle = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(100px)',
    pointerEvents: 'none',
    zIndex: -1,
    background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
};

const ExecutiveCard = ({ children, delay = 0, style = {} }) => (
    <TiltContainer intensity={15} style={{ height: '100%' }}>
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
            style={{
                background: 'linear-gradient(180deg, rgba(15,15,15,0.8) 0%, rgba(10,10,10,0.9) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                border: '1px solid rgba(245,158,11,0.12)',
                padding: '1.5rem',
                position: 'relative',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                height: '100%',
                ...style
            }}
        >
            {/* Subtle top edge highlight */}
            <div style={{
                position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)'
            }} />
            {children}
        </motion.div>
    </TiltContainer>
);

const MetricCard = ({ label, value, icon: Icon, delay }) => (
    <ExecutiveCard delay={delay} style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ 
                    color: '#8B7355', fontSize: '0.75rem', fontWeight: 600, 
                    letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    {label}
                </p>
                <h3 style={{ 
                    fontSize: '2.5rem', fontWeight: 300, color: '#FDF6E3', margin: 0,
                    letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif'
                }}>
                    {value}
                </h3>
            </div>
            <div style={{ 
                width: 48, height: 48, borderRadius: '8px', 
                background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={22} color="#FBBF24" strokeWidth={1.5} />
            </div>
        </div>
        <div style={{ marginTop: '1.5rem', width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#FBBF24' }}>
            <TrendingUp size={14} />
            <span style={{ fontWeight: 500, letterSpacing: '0.05em' }}>OPTIMAL VARIANCE</span>
        </div>
    </ExecutiveCard>
);

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [archivedLoading, setArchivedLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'archived'
    const [searchTerm, setSearchTerm] = useState('');
    const [activeExportMenu, setActiveExportMenu] = useState(null); // ID of the active menu

    const { exportCSV, exportPDF } = useExportSystem();


    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';

    useEffect(() => { 
        if (activeTab === 'overview') fetchStats();
        else fetchArchivedTasks();
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/reports/dashboard-stats`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error(await res.text());
            setStats(await res.json());
        } catch (error) {
            toast.error('Could not load report data');
        } finally {
            setLoading(false);
        }
    };

    const fetchArchivedTasks = async () => {
        try {
            setArchivedLoading(true);
            const res = await fetch(`${API}/api/tasks/archived`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch archived tasks');
            setArchivedTasks(await res.json());
        } catch (error) {
            toast.error('Could not load archived tasks');
        } finally {
            setArchivedLoading(false);
        }
    };

    const handleRestore = async (taskId) => {
        try {
            const res = await fetch(`${API}/api/tasks/${taskId}/restore`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Restore failed');
            toast.success('Task restored successfully');
            fetchArchivedTasks();
        } catch (error) {
            toast.error('Restore failed');
        }
    };

    const handleExport = async (endpoint, filenamePrefix, format = 'csv') => {
        try {
            setExporting(true);
            setActiveExportMenu(null);
            
            if (format === 'pdf' && stats) {
                // Generate PDF locally using stats for a professional look
                const headers = ['Metric', 'Current Value', 'Goal Status'];
                const rows = [
                    ['Completion Rate', `${stats.kpis.completionRate}%`, 'OPTIMAL'],
                    ['Avg Turnaround', `${stats.kpis.avgCompletionTime}d`, 'STABLE'],
                    ['Risk Index', stats.kpis.overdueRisk, 'MONITORED']
                ];
                
                exportPDF(rows, headers, 'Executive Workflow Report', filenamePrefix, {
                    period: `Generated on ${new Date().toLocaleDateString()}`,
                    insights: "Strategic through-put velocity remains within optimal variance. Allocation across network states is 100% synced with current organizational goals."
                });
                return;
            }

            // Fallback to CSV from server for raw datasets
            const res = await fetch(`${API}/api/reports/${endpoint}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(`${filenamePrefix} exported as ${format.toUpperCase()}`);
        } catch (error) {
            console.error(error);
            toast.error(`Export failed`);
        } finally {
            setExporting(false);
        }
    };


    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ 
                    background: '#0A0A0A', border: '1px solid rgba(245, 158, 11, 0.3)', 
                    padding: '1rem', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' 
                }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500, color: '#FDF6E3', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
                    {payload.map((entry, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: entry.color }} />
                            <p style={{ margin: 0, color: '#A3A3A3', fontSize: '0.75rem', fontWeight: 400 }}>
                                {entry.name}: <span style={{ color: '#FBBF24', fontWeight: 600 }}>{entry.value}</span>
                            </p>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const filteredArchived = archivedTasks.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ minHeight: '100%', paddingBottom: '4rem', background: '#030303', color: '#E5E5E5', position: 'relative', overflow: 'hidden' }}>
            
            {/* Ambient Background Glows */}
            <div style={{ ...ambientGlowStyle, top: '-20%', left: '10%', width: '800px', height: '800px', opacity: 0.6 }} />
            <div style={{ ...ambientGlowStyle, bottom: '-10%', right: '-10%', width: '600px', height: '600px', opacity: 0.4 }} />

            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* ── Header Area ── */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                    className="projects-header"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}
                >
                    <div>
                        <p style={{ color: '#F59E0B', fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600 }}>
                            Intelligence & Archival
                        </p>
                        <h1 style={{ fontSize: '3rem', fontWeight: 200, color: '#FFFFFF', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
                            Workflow <span style={{ color: '#FBBF24', fontStyle: 'italic', fontWeight: 300 }}>Reports</span>
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                        {activeTab === 'overview' && (
                            <div style={{ position: 'relative' }}>
                                <motion.button
                                    whileHover={{ backgroundColor: 'rgba(245,158,11,0.1)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setActiveExportMenu(activeExportMenu === 'main' ? null : 'main')}
                                    disabled={exporting}
                                    style={{ 
                                        background: 'transparent', border: '1px solid rgba(245,158,11,0.4)', color: '#FBBF24', 
                                        padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 500, fontSize: '0.8rem', 
                                        letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s',
                                        display: 'flex', alignItems: 'center', gap: '0.75rem'
                                    }}
                                >
                                    {exporting ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                                    Generate Report
                                </motion.button>
                                
                                <AnimatePresence>
                                    {activeExportMenu === 'main' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                            style={{
                                                position: 'absolute', top: '110%', right: 0, zIndex: 100,
                                                background: '#0A0A0A', border: '1px solid rgba(245,158,11,0.3)',
                                                borderRadius: '8px', padding: '0.5rem', minWidth: '160px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
                                            }}
                                        >
                                            <button onClick={() => handleExport('export-goals', 'workflow-report', 'pdf')} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: 'none', color: '#E5E5E5', cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontSize: '0.75rem' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>PDF Report</button>
                                            <button onClick={() => handleExport('export-goals', 'workflow-report', 'csv')} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: 'none', color: '#E5E5E5', cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontSize: '0.75rem' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>CSV Data</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                </motion.div>

                {/* ── Tab Navigation ── */}
                <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
                    {[
                        { id: 'overview', label: 'Executive Overview', icon: BarChart2 },
                        { id: 'archived', label: 'Archived Tasks', icon: Archive }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'none', border: 'none', color: activeTab === tab.id ? '#FBBF24' : '#737373',
                                padding: '1rem 0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                                position: 'relative', display: 'flex', alignItems: 'center', gap: '0.6rem',
                                transition: 'color 0.3s'
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTab"
                                    style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: '#FBBF24' }} 
                                />
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' ? (
                    loading || !stats ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10rem 0', gap: '1.5rem' }}>
                            <Loader size={32} color="#FBBF24" className="animate-spin" style={{ animationDuration: '2s' }} />
                            <span style={{ color: '#8B7355', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Gathering Intelligence...</span>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                            {/* KPI Grid */}
                            <div className="analytics-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                                <MetricCard label="Completion Rate" value={`${stats.kpis.completionRate}%`} icon={CheckCircle} delay={0.1} />
                                <MetricCard label="Avg Turnaround" value={`${stats.kpis.avgCompletionTime}d`} icon={Clock} delay={0.2} />
                                <MetricCard label="Risk Index" value={stats.kpis.overdueRisk} icon={AlertTriangle} delay={0.3} />
                            </div>

                            <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <ExecutiveCard delay={0.4} style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 300, color: '#FFFFFF', margin: '0 0 0.25rem 0' }}>Throughput Velocity</h3>
                                        <p style={{ fontSize: '0.75rem', color: '#8B7355', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>30-Day Historical Trend</p>
                                    </div>
                                    <div style={{ flex: 1, minHeight: 0 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.velocityTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                                <XAxis dataKey="date" stroke="#525252" fontSize={10} tickMargin={15} axisLine={false} tickLine={false} />
                                                <YAxis stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Area type="monotone" dataKey="created" name="Initiated" stroke="#FDE68A" strokeWidth={2} fill="url(#lightGoldGradient)" />
                                                <Area type="monotone" dataKey="completed" name="Resolved" stroke="#F59E0B" strokeWidth={2} fill="url(#goldGradient)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ExecutiveCard>

                                <ExecutiveCard delay={0.5} style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 300, color: '#FFFFFF', margin: '0 0 0.25rem 0' }}>Allocation</h3>
                                        <p style={{ fontSize: '0.75rem', color: '#8B7355', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Network State</p>
                                    </div>
                                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={stats.statusDistribution} cx="50%" cy="50%" innerRadius={90} outerRadius={120} paddingAngle={2} dataKey="value" stroke="none">
                                                    {stats.statusDistribution.map((_, i) => (
                                                        <Cell key={i} fill={GOLD_COLORS[i % GOLD_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                                            <span style={{ fontSize: '2rem', fontWeight: 300, color: '#FFFFFF', lineHeight: 1 }}>100<span style={{ fontSize: '1.2rem', color: '#FBBF24' }}>%</span></span>
                                            <span style={{ fontSize: '0.65rem', color: '#8B7355', letterSpacing: '0.2em', marginTop: '0.25rem' }}>SYNCED</span>
                                        </div>
                                    </div>
                                </ExecutiveCard>
                            </div>

                            <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.8fr)', gap: '1.5rem' }}>
                                <ExecutiveCard delay={0.6}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                        <div><h3 style={{ fontSize: '1.2rem', fontWeight: 300, color: '#FFFFFF' }}>Top Nodes</h3></div>
                                        <Trophy size={18} color="#FBBF24" />
                                    </div>
                                    {stats.topPerformers.map((user, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ color: '#E5E5E5' }}>{user.name}</span>
                                            <span style={{ color: '#FBBF24' }}>{user.points} PTS</span>
                                        </div>
                                    ))}
                                </ExecutiveCard>

                                <ExecutiveCard delay={0.7}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 300, color: '#FFFFFF', marginBottom: '2rem' }}>Workload Distribution</h3>
                                    <div style={{ height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.teamWorkload} margin={{ left: -20, top: 10, right: 0, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                                <XAxis dataKey="name" stroke="#525252" fontSize={10} tickMargin={15} axisLine={false} tickLine={false} />
                                                <YAxis stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
                                                <RechartsTooltip cursor={{ fill: 'rgba(245,158,11,0.05)' }} content={<CustomTooltip />} />
                                                <Bar dataKey="tasks" fill={GOLD_COLORS[1]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ExecutiveCard>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                                {[
                                    { title: 'Raw Dataset', icon: LayoutList, endpoint: 'export-tasks', prefix: 'tasks-db', color: '#8B7355' },
                                    { title: 'Objective Metrics', icon: Target, endpoint: 'export-goals', prefix: 'objectives-report', color: '#8B7355' },
                                    { title: 'Velocity Archive', icon: BarChart2, endpoint: 'export-velocity', prefix: 'velocity-archive', color: '#8B7355' }
                                ].map((card, i) => (
                                    <div key={i} style={{ position: 'relative', height: '100%' }}>
                                        <TiltContainer intensity={15} style={{ height: '100%' }}>
                                            <motion.button
                                                whileHover={{ backgroundColor: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.3)' }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setActiveExportMenu(activeExportMenu === card.endpoint ? null : card.endpoint)}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                                                    background: 'rgba(15,15,15,0.5)', border: '1px solid rgba(255,255,255,0.05)', 
                                                    borderRadius: '8px', padding: '1.25rem 1.5rem', color: '#A3A3A3', 
                                                    cursor: 'pointer', transition: 'all 0.3s', textAlign: 'left', height: '100%'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <card.icon size={18} color={card.color} />
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.05em', color: '#E5E5E5' }}>{card.title}</span>
                                                </div>
                                                <Download size={16} color="#525252" />
                                            </motion.button>
                                        </TiltContainer>

                                        <AnimatePresence>
                                            {activeExportMenu === card.endpoint && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                                    style={{
                                                        position: 'absolute', bottom: '110%', left: 0, right: 0, zIndex: 100,
                                                        background: '#111', border: '1px solid rgba(245,158,11,0.2)',
                                                        borderRadius: '8px', padding: '0.4rem', boxShadow: '0 -10px 30px rgba(0,0,0,0.9)'
                                                    }}
                                                >
                                                    <button onClick={() => handleExport(card.endpoint, card.prefix, 'csv')} style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: 'none', color: '#A3A3A3', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.color = '#FBBF24'} onMouseLeave={e => e.currentTarget.style.color = '#A3A3A3'}>Export CSV</button>
                                                    <button onClick={() => handleExport(card.endpoint, card.prefix, 'pdf')} style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: 'none', color: '#A3A3A3', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.color = '#FBBF24'} onMouseLeave={e => e.currentTarget.style.color = '#A3A3A3'}>Export PDF</button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                ))}
                            </div>
                        </motion.div>
                    )
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                        {/* ── Archived Tasks View ── */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ position: 'relative', width: '400px' }}>
                                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#737373' }} size={16} />
                                <input
                                    type="text"
                                    placeholder="Search archive title or assignee..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '8px', padding: '0.75rem 1rem 0.75rem 2.75rem', color: '#FFFFFF', fontSize: '0.85rem'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.75rem 1.25rem', color: '#A3A3A3', fontSize: '0.8rem', cursor: 'pointer' }}>
                                    <Filter size={14} /> Filter
                                </button>
                            </div>
                        </div>

                        {archivedLoading ? (
                            <div style={{ padding: '5rem', textAlign: 'center' }}><Loader size={24} className="animate-spin" color="#FBBF24" /></div>
                        ) : (
                            <div style={{ background: 'rgba(15,15,15,0.6)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <tr>
                                            {['Task Detail', 'Assigned To', 'Completed At', 'Archived At', 'Origin', 'Actions'].map(h => (
                                                <th key={h} style={{ padding: '1.25rem 1.5rem', fontSize: '0.7rem', color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredArchived.length > 0 ? filteredArchived.map((task, i) => (
                                            <tr key={task._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }} className="hover:bg-white/[0.02]">
                                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                                    <div style={{ fontWeight: 600, color: '#E5E5E5', marginBottom: '0.25rem' }}>{task.title}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#737373' }}>{task.project?.name || 'No Project'}</div>
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', color: '#000', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {task.assignedTo?.name?.[0] || '?'}
                                                        </div>
                                                        <div style={{ color: '#A3A3A3', fontSize: '0.85rem' }}>{task.assignedTo?.name || 'Unassigned'}</div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem', color: '#737373', fontSize: '0.8rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={12} color="#10B981" /> {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'}</div>
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem', color: '#737373', fontSize: '0.8rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={12} /> {task.archivedAt ? new Date(task.archivedAt).toLocaleDateString() : 'N/A'}</div>
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                                    <span style={{ 
                                                        fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px',
                                                        background: task.archiveType === 'auto' ? 'rgba(139,92,246,0.1)' : 'rgba(245,158,11,0.1)',
                                                        color: task.archiveType === 'auto' ? '#A78BFA' : '#FBBF24',
                                                        textTransform: 'uppercase', letterSpacing: '0.05em'
                                                    }}>
                                                        {task.archiveType || 'Manual'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                                    {isAdmin && (
                                                        <button 
                                                            onClick={() => handleRestore(task._id)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#FBBF24', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                                            onMouseOver={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}
                                                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                        >
                                                            <RotateCcw size={12} /> Restore
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="6" style={{ padding: '5rem', textAlign: 'center', color: '#737373', fontSize: '0.9rem' }}>No archived tasks found matching your criteria.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Reports;
