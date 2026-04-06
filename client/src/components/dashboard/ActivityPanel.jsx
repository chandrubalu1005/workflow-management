import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

const ActivityPanel = ({ activity = [] }) => {
    const navigate = useNavigate();

    return (
        <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-wp-amber/10 text-[#F59E0B]" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                        <Activity size={18} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-200">Live Activity Feed</h3>
                </div>
            </div>

            <div className="relative space-y-0 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Vertical Timeline Line */}
                {activity?.length > 0 && (
                    <div className="absolute left-[20px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-wp-amber/40 via-wp-amber/10 to-transparent z-0" style={{ background: 'linear-gradient(to bottom, rgba(245,158,11,0.4), rgba(245,158,11,0.05), transparent)' }} />
                )}

                {!activity || activity.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-slate-500 italic text-sm">
                        No recent activity recorded.
                    </div>
                ) : (
                    activity.map((log, idx) => {
                        let detailsObj = {};
                        try { detailsObj = JSON.parse(log.details || '{}'); } catch (_) {}
                        const title = detailsObj.title || detailsObj.taskTitle || log.action?.replace(/_/g, ' ') || 'Activity';
                        
                        return (
                        <div key={log._id || idx} className="relative flex items-start gap-4 p-3 z-10 hover:bg-white/[0.04] rounded-xl transition-colors duration-300 group cursor-default">
                            {/* Timeline Node */}
                            <div className="relative mt-1">
                                <div className="w-10 h-10 rounded-full bg-[#111827] border-2 border-[#1E293B] flex items-center justify-center p-0.5 z-10 relative group-hover:border-[#F59E0B]/50 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#F59E0B]/20 to-transparent flex items-center justify-center text-[#F59E0B]">
                                        <Activity size={14} />
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-[#F59E0B] rounded-full blur-[8px] opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none" />
                            </div>

                            <div className="flex-1 min-w-0 pt-1 pb-2 border-b border-white/[0.03] group-last:border-transparent">
                                <p className="text-[0.85rem] text-slate-200 leading-snug">
                                    <span className="font-bold text-white tracking-wide">{log.user?.name || log.user || 'System'}</span>{' '} 
                                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors">{title}</span>
                                </p>
                                <p className="text-[0.65rem] text-[#F59E0B]/70 font-mono mt-1.5 uppercase tracking-widest font-semibold flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]/50 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                                    {new Date(log.createdAt || log.timestamp || Date.now()).toLocaleTimeString()} • {log.action?.toUpperCase().replace(/_/g, ' ')}
                                </p>
                            </div>
                        </div>
                    )})
                )}
            </div>

            <button
                onClick={() => navigate('/admin/logs')}
                className="w-full mt-6 py-3 rounded-xl border border-white/10 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-[#F59E0B] hover:border-[#F59E0B]/30 transition-all bg-white/5"
            >
                View Full System Logs
            </button>
        </div>
    );
};

export default ActivityPanel;
