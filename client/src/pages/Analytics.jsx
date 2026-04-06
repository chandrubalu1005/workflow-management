import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useExportSystem } from '../hooks/useExportSystem';

import PerformanceOverview from '../components/analytics/PerformanceOverview';
import TeamVelocity from '../components/analytics/TeamVelocity';
import WorkloadAnalysis from '../components/analytics/WorkloadAnalysis';
import BottleneckAnalysis from '../components/analytics/BottleneckAnalysis';
import { Download, Filter, X, TrendingUp, CheckCircle2, Zap, AlertTriangle, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DatePicker from '../components/DatePicker';
import { usePageTransition } from '../hooks/useAnimationSystem';
import { GlassButton, AnimatedStatCard } from '../components/SaaS';
import TiltContainer from '../components/TiltContainer';

const API = import.meta.env.VITE_API_URL;

const Analytics = () => {
    const { user } = useAuth();
    const { exportCSV, exportPDF } = useExportSystem();
    const isAdmin = user?.role === 'admin';
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [isExporting, setIsExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [chartTab, setChartTab] = useState('overview');


    const CHART_TABS = [
        { id: 'overview', label: 'Performance Overview', icon: TrendingUp },
        { id: 'team', label: 'Team Velocity', icon: Users },
        { id: 'workload', label: 'Workload Analysis', icon: Zap },
        { id: 'bottlenecks', label: 'Bottlenecks', icon: AlertTriangle },
    ];

    const applyPreset = (days) => {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - days);
        const fmt = d => d.toISOString().split('T')[0];
        setDateRange({ from: fmt(from), to: fmt(to) });
        setShowFilters(true);
    };

    const DATE_PRESETS = [
        { label: 'Today', days: 0 },
        { label: '7 Days', days: 7 },
        { label: '30 Days', days: 30 },
        { label: '90 Days', days: 90 },
    ];

    const pageVariants = {
        initial: { opacity: 0, y: 15 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1, ease: 'easeOut' } }
    };

    const handleExport = async (format) => {
        setIsExporting(true);
        setShowExportMenu(false);
        try {
            const params = new URLSearchParams();
            if (dateRange.from) params.set('from', dateRange.from);
            if (dateRange.to) params.set('to', dateRange.to);

            const res = await fetch(`${API}/api/tasks?${params}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Data fetch failed');
            const data = await res.json();
            const tasks = Array.isArray(data) ? data : (data.tasks || []);

            const headers = ['Title', 'Status', 'Priority', 'Assigned Member', 'Project', 'Due Date'];
            const rows = tasks.map(t => [
                t.title || '',
                (t.status || 'pending').toUpperCase(),
                t.priority || 'medium',
                t.assignedTo?.name || 'Unassigned',
                t.project?.name || 'General',
                t.endDate ? new Date(t.endDate).toLocaleDateString() : 'N/A'
            ]);

            if (format === 'csv') {
                exportCSV(rows, headers, 'Analytics_Export');
            } else {
                exportPDF(rows, headers, 'Strategic Intelligence Report', 'Analytics_Report', {
                    period: `${dateRange.from || 'Entire System'} to ${dateRange.to || new Date().toISOString().slice(0, 10)}`,
                    kpis: [
                        ['Average Velocity', '8.4 pts/day', 'Speed Increase (+5%)'],
                        ['Tasks Completed', '124', 'Above Average (+12%)'],
                        ['Blocking Issues', '3', 'Ongoing Resolution (-2%)'],
                        ['Active Members', '18', 'Stable Workforce']
                    ],
                    insights: "Team velocity has increased by 5% this week. Resolving the 3 active blocking issues could further improve completion rates by an estimated 12% across parallel work streams. Current trajectory suggests high confidence in quarterly goal attainment."
                });
            }
        } catch (err) {
            console.error(err);
            toast.error('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <motion.div variants={pageVariants} initial="initial" animate="animate" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header */}
            <header className="analytics-header" style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem', 
                borderBottom: '1px solid rgba(245,158,11,0.15)', paddingBottom: '1.5rem', gap: '2rem',
                position: 'sticky', top: 0, zIndex: 50, background: 'rgba(3, 7, 18, 0.65)', backdropFilter: 'blur(16px)', 
                paddingTop: '1rem'
            }}>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.05))', padding: '0.6rem', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' }}
                        >
                            <TrendingUp size={28} color="#F59E0B" />
                        </motion.div>
                        Strategic Intelligence
                    </motion.h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                        {isAdmin ? 'Deep-dive analysis of organizational velocity and efficiency bottlenecks.' : 'Personal performance trends and team contribution metrics.'}
                    </p>
                </motion.div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Date Presets */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {DATE_PRESETS.map(p => (
                            <motion.button key={p.label} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={() => applyPreset(p.days)}
                                style={{ padding: '0.55rem 1rem', borderRadius: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.2s' }}>
                                {p.label}
                            </motion.button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        style={{
                            background: showFilters ? 'rgba(245,158,11,0.1)' : 'var(--bg-overlay)',
                            border: showFilters ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border-default)',
                            color: showFilters ? '#F59E0B' : 'var(--text-primary)',
                            padding: '0.75rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center',
                            gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer'
                        }}>
                        <Filter size={16} /> {showFilters ? 'Hide Dates' : 'Date Range'}
                    </button>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={isExporting}
                            style={{ 
                                padding: '0.75rem 1.5rem', 
                                fontSize: '0.85rem', 
                                opacity: isExporting ? 0.7 : 1, 
                                cursor: isExporting ? 'not-allowed' : 'pointer',
                                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                            }}
                        >
                            <Download size={16} /> {isExporting ? 'Exporting...' : 'Export Results'}
                        </button>
                        
                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    style={{
                                        position: 'absolute', top: '110%', right: 0, zIndex: 100,
                                        background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(16px)',
                                        border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px',
                                        padding: '0.5rem', minWidth: '160px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    <button onClick={() => handleExport('pdf')} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: 'none', color: '#F8FAFC', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <Download size={14} color="#F59E0B" /> Professional PDF
                                    </button>
                                    <button onClick={() => handleExport('csv')} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: 'none', color: '#F8FAFC', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <Download size={14} color="#64748B" /> Raw CSV Data
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </header>

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '2rem' }}
                    >
                        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div>
                                <DatePicker 
                                    label="From Date"
                                    value={dateRange.from}
                                    onChange={val => setDateRange(p => ({ ...p, from: val }))}
                                    placeholder="Start"
                                />
                            </div>
                            <div>
                                <DatePicker 
                                    label="To Date"
                                    value={dateRange.to}
                                    onChange={val => setDateRange(p => ({ ...p, to: val }))}
                                    placeholder="End"
                                />
                            </div>
                            <button onClick={() => setDateRange({ from: '', to: '' })}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.8rem' }}>
                                <X size={14} /> Clear
                            </button>
                            <button onClick={() => setShowFilters(false)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.8rem', marginLeft: 'auto' }}>
                                Apply Filters
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sections */}
            <motion.div
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, staggerChildren: 0.1 }}
            >
                {/* KPI Mini-Stat Row */}
                {/* Bento Grid layout for KPIs */}
                <motion.div className="analytics-stats-grid" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} 
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(4, 1fr)', 
                        gap: '1.25rem',
                        gridAutoRows: 'minmax(140px, auto)' 
                    }}>
                    
                    {/* Wide Feature Card */}
                    <TiltContainer intensity={10} style={{ height: '100%', gridColumn: 'span 2' }}>
                        <AnimatedStatCard icon={Zap} label="Average Velocity" value="8.4 pts/day" change={5} trend="speed up" trendDirection="up" sparkData={[5, 6, 6, 8, 7, 8, 8.4]} glowPulse={true} />
                    </TiltContainer>

                    {/* Standard Card */}
                    <TiltContainer intensity={15} style={{ height: '100%', gridColumn: 'span 1' }}>
                        <AnimatedStatCard icon={CheckCircle2} label="Tasks Completed" value={124} change={12} trend="vs last period" trendDirection="up" />
                    </TiltContainer>
                    
                    {/* Standard Card */}
                    <TiltContainer intensity={15} style={{ height: '100%', gridColumn: 'span 1' }}>
                        <AnimatedStatCard icon={AlertTriangle} label="Blocking Issues" value={3} change={-2} trend="resolved" trendDirection="down" />
                    </TiltContainer>

                    {/* AI Insights Block (Added Element) */}
                    <TiltContainer intensity={12} style={{ height: '100%', gridColumn: 'span 2' }}>
                        <div style={{
                            background: 'rgba(17,24,39,0.75)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: '20px', padding: '1.75rem', height: '100%',
                            boxShadow: '0 4px 30px rgba(0,0,0,0.4), inset 0 0 40px rgba(16, 185, 129, 0.04)',
                            transition: 'all 0.3s ease',
                            cursor: 'default'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                                <motion.div 
                                    animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                    style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '12px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}>
                                    <TrendingUp size={20} color="#10B981" />
                                </motion.div>
                                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '0.02em' }}>AI Execution Insights</h3>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, fontWeight: 500 }}>
                                Team velocity has increased by <strong style={{color: '#10B981'}}>5%</strong> this week. Resolving the <strong style={{color: '#EF4444'}}>3 active blocking issues</strong> could further improve completion rates by an estimated 12% across parallel work streams.
                            </p>
                        </div>
                    </TiltContainer>

                    {/* Wide Secondary Card */}
                    <TiltContainer intensity={10} style={{ height: '100%', gridColumn: 'span 2' }}>
                        <AnimatedStatCard icon={Users} label="Active Members" value={18} trend="stable" trendDirection="neutral" sparkData={[15, 16, 18, 18, 17, 18, 18]} />
                    </TiltContainer>
                </motion.div>

                {/* Chart Tab Navigation */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    className="analytics-tabs-container"
                    style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.75rem', background: 'rgba(17,24,39,0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
                    {CHART_TABS.map(t => (
                        <motion.button key={t.id} onClick={() => setChartTab(t.id)}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', borderRadius: '12px', border: '1px solid', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: chartTab === t.id ? 700 : 500, transition: 'all 0.2s', background: chartTab === t.id ? 'rgba(245,158,11,0.12)' : 'transparent', borderColor: chartTab === t.id ? 'rgba(245,158,11,0.35)' : 'transparent', color: chartTab === t.id ? '#F59E0B' : '#6B7280' }}>
                            <t.icon size={14} />
                            {t.label}
                            {chartTab === t.id && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 6px rgba(245,158,11,0.8)' }} />}
                        </motion.button>
                    ))}
                </motion.div>

                <AnimatePresence mode="wait">
                <motion.div key={chartTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {chartTab === 'overview' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <TiltContainer intensity={15}>
                        <PerformanceOverview />
                    </TiltContainer>
                </motion.div>
                )}
                {chartTab === 'team' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <TiltContainer intensity={15}>
                        <TeamVelocity />
                    </TiltContainer>
                </motion.div>
                )}
                {chartTab === 'workload' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <TiltContainer intensity={15}>
                        <WorkloadAnalysis isAdmin={isAdmin} />
                    </TiltContainer>
                </motion.div>
                )}
                {chartTab === 'bottlenecks' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <TiltContainer intensity={15}>
                        <BottleneckAnalysis />
                    </TiltContainer>
                </motion.div>
                )}

                </motion.div>
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default Analytics;
