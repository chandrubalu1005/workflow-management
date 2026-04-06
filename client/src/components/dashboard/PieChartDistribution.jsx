import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Award } from 'lucide-react';

const COLORS = ['#F59E0B', '#FBBF24', '#10B981', '#F97316', '#EF4444'];

const PieChartDistribution = ({ roles, isAdmin }) => {
    return (
        <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                    <Users size={18} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-200">Workforce Snapshot</h3>
            </div>

            {isAdmin ? (
                <div className="space-y-6">
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={roles} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                                    {roles?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {roles?.slice(0, 4).map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[10px] text-slate-300 font-bold uppercase truncate tracking-wider">{r.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#F59E0B]/10 to-transparent border border-[#F59E0B]/10" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
                        <Award size={32} className="text-[#FBBF24] mb-4" />
                        <p className="text-sm text-slate-100 font-medium italic leading-relaxed">
                            "You are completing tasks 15% faster than last month. Keep the momentum going!"
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Daily Goal</span>
                            <span className="text-[#FBBF24]">75%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} className="h-full shadow-[0_0_15px_rgba(245,158,11,0.4)]" style={{ background: '#F59E0B' }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PieChartDistribution;
