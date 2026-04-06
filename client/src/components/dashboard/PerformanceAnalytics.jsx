import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

const ZoneCard = ({ title, icon: Icon, children, span = 1, className = "" }) => (
    <div
        className={`glass-panel p-6 ${span === 2 ? 'lg:col-span-2' : ''} ${className} flex flex-col`}
        style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '1rem' }}
    >
        <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                <Icon size={18} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: '#f1f5f9' }}>{title}</h3>
        </div>
        <div className="w-full" style={{ height: '320px', position: 'relative' }}>
            {children}
        </div>
    </div>
);

const UtilizationRing = ({ util = 0 }) => (
    <div className="flex flex-col items-center justify-center py-4" style={{ height: '100%' }}>
        <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                <circle cx="96" cy="96" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
                <motion.circle
                    cx="96" cy="96" r="80"
                    stroke="#F59E0B" strokeWidth="12" fill="transparent"
                    strokeDasharray={502}
                    initial={{ strokeDashoffset: 502 }}
                    animate={{ strokeDashoffset: 502 - (502 * util) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black font-mono text-white">{util}%</span>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Global Load</span>
            </div>
        </div>
    </div>
);

const PerformanceAnalytics = ({ trend, overview }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ZoneCard title="Productivity Analysis" icon={TrendingUp} span={2}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="mainGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                        <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                            itemStyle={{ color: '#FBBF24' }}
                        />
                        <Area type="monotone" dataKey="completed" stroke="#F59E0B" strokeWidth={4} fill="url(#mainGrad)" />
                    </AreaChart>
                </ResponsiveContainer>
            </ZoneCard>

            <ZoneCard title="Load Distribution" icon={Activity}>
                <UtilizationRing util={overview?.utilizationAvg || 0} />
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                        <p className="text-2xl font-black text-wp-red">{overview?.overloadedCount || 0}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Critical</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                        <p className="text-2xl font-black text-wp-emerald">{(overview?.totalUsers || 0) - (overview?.overloadedCount || 0)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Optimal</p>
                    </div>
                </div>
            </ZoneCard>
        </div>
    );
};

export default PerformanceAnalytics;
