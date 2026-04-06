import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, User, Tag, 
    CheckCircle2, AlertCircle, RefreshCw, 
    FileText, Plus, ArrowRight, MessageSquare 
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const API = import.meta.env.VITE_API_URL;

const AuditTrail = ({ taskId, isOpen, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && taskId) {
            fetchHistory();
        }
    }, [isOpen, taskId]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/tasks/${taskId}/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setHistory(prev => Array.isArray(prev) ? prev : []);
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'STATUS_UPDATE': return <RefreshCw size={14} className="text-blue-400" />;
            case 'TASK_CREATED': return <Plus size={14} className="text-green-400" />;
            case 'FILE_UPLOAD': return <FileText size={14} className="text-amber-400" />;
            case 'UPDATE_PRIORITY': return <AlertCircle size={14} className="text-red-400" />;
            default: return <Tag size={14} className="text-slate-400" />;
        }
    };

    const formatValue = (val) => {
        if (val === null || val === undefined) return 'None';
        if (typeof val === 'string') return val;
        return JSON.stringify(val);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0, 
                            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                            zIndex: 1000
                        }}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed', top: 0, right: 0, bottom: 0,
                            width: '400px', maxWidth: '100%',
                            background: '#0F172A', 
                            borderLeft: '1px solid rgba(255,255,255,0.08)',
                            padding: '2rem', zIndex: 1001,
                            boxShadow: '-20px 0 50px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ color: '#F8FAFC', fontSize: '1.25rem', fontWeight: 800 }}>The Chronicle</h2>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>Close</button>
                        </div>

                        {loading ? (
                            <div style={{ color: '#64748B', textAlign: 'center', marginTop: '2rem' }}>Consulting the archives...</div>
                        ) : (
                            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                                {history.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#64748B', marginTop: '4rem' }}>
                                        <Clock size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                        <p>No recorded history for this node.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                                        {/* Timeline Line */}
                                        <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.05)' }} />

                                        {history.map((item, idx) => (
                                            <motion.div
                                                key={item._id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}
                                            >
                                                <div style={{ 
                                                    width: '16px', height: '16px', borderRadius: '50%', 
                                                    background: '#1E293B', border: '2px solid rgba(255,255,255,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    marginTop: '4px', flexShrink: 0
                                                }}>
                                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#F59E0B' }} />
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                                        <span style={{ color: '#F59E0B', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            {item.action?.replace('_', ' ')}
                                                        </span>
                                                        <span style={{ color: '#475569', fontSize: '0.65rem' }}>{formatDate(item.createdAt)}</span>
                                                    </div>

                                                    <div style={{ color: '#CBD5E1', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                                        {item.details || `Modified ${item.field}`}
                                                    </div>

                                                    {item.oldValue !== undefined && item.newValue !== undefined && (
                                                        <div style={{ 
                                                            display: 'flex', alignItems: 'center', gap: '0.5rem', 
                                                            background: 'rgba(0,0,0,0.2)', padding: '0.5rem', 
                                                            borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' 
                                                        }}>
                                                            <span style={{ color: '#64748B', textDecoration: 'line-through', fontSize: '0.75rem' }}>{formatValue(item.oldValue)}</span>
                                                            <ArrowRight size={12} color="#475569" />
                                                            <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>{formatValue(item.newValue)}</span>
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                                                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#3B82F6', color: '#fff', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {item.user?.name?.charAt(0)}
                                                        </div>
                                                        <span style={{ color: '#64748B', fontSize: '0.7rem' }}>{item.user?.name}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AuditTrail;
