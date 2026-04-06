import { motion } from 'framer-motion';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { BrainCircuit, TrendingUp } from 'lucide-react';

const ZoneCard = ({ title, icon: Icon, children, span = 1, className = "" }) => (
    <div
        className={`glass-panel p-6 ${span === 2 ? 'lg:col-span-2' : ''} ${className} flex flex-col`}
        style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '1rem' }}
    >
        <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Icon size={18} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: '#f1f5f9' }}>{title}</h3>
        </div>
        <div className="w-full" style={{ height: '320px', position: 'relative' }}>
            {children}
        </div>
    </div>
);

const IntelligenceRadar = ({ overview, trend }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
            <ZoneCard title="Intelligence Radar" icon={BrainCircuit}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={overview?.radarData || []}>
                        <PolarGrid stroke="rgba(255,255,255,0.2)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                        <Radar name="Score" dataKey="value" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={3} />
                        <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </ZoneCard>
            <ZoneCard title="Operational Trend" icon={TrendingUp} span={2}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                        <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                            itemStyle={{ color: '#F59E0B' }}
                        />
                        <Area type="monotone" dataKey="completed" stroke="#F59E0B" strokeWidth={4} fill="url(#trendGrad)" />
                    </AreaChart>
                </ResponsiveContainer>
            </ZoneCard>
        </motion.div>
    );
};

export default IntelligenceRadar;
