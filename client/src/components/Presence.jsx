import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Circle, Zap, Clock } from 'lucide-react';

const Presence = () => {
    const { onlineUsers } = useSocket();

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10B981';
            case 'focused': return '#F59E0B';
            case 'idle': return '#64748B';
            default: return '#475569';
        }
    };

    return (
        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Team Radar</h3>
                <span style={{ fontSize: '0.7rem', color: '#64748B', marginLeft: 'auto' }}>{onlineUsers.length} Online</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <AnimatePresence>
                    {onlineUsers.map((user) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                        >
                            <div style={{ position: 'relative' }}>
                                <div style={{ 
                                    width: '28px', height: '28px', borderRadius: '50%', 
                                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', 
                                    color: '#fff', fontSize: '0.7rem', fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '2px solid rgba(255,255,255,0.05)'
                                }}>
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ 
                                    position: 'absolute', bottom: '-1px', right: '-1px', 
                                    width: '10px', height: '10px', borderRadius: '50%', 
                                    background: getStatusColor(user.status),
                                    border: '2px solid #0F172A'
                                }} />
                            </div>
                            
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user.name}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'capitalize' }}>
                                    {user.status || 'Active'}
                                </div>
                            </div>

                            {user.status === 'active' && <Zap size={10} className="text-amber-400" />}
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {onlineUsers.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#475569', fontSize: '0.7rem', padding: '0.5rem 0' }}>
                        Scanning for signals...
                    </div>
                )}
            </div>
        </div>
    );
};

export default Presence;
