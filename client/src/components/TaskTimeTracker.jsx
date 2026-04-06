import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Timer } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

export const TaskTimeTracker = ({ task, onTimeLogged }) => {
    const [isLogging, setIsLogging] = useState(false);
    const [hours, setHours] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const loggedHours = task.loggedHours || 0;
    const estimatedHours = task.estimatedHours || 0;
    const progress = estimatedHours > 0 ? Math.min(100, (loggedHours / estimatedHours) * 100) : 0;
    const isOverEstimate = estimatedHours > 0 && loggedHours > estimatedHours;

    const handleLogTime = async (e) => {
        e.preventDefault();
        const numHours = parseFloat(hours);
        if (isNaN(numHours) || numHours <= 0) return toast.error('Enter valid hours');

        setLoading(true);
        try {
            const res = await fetch(`${API}/api/tasks/${task._id}/time`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ hours: numHours, description })
            });
            if (!res.ok) throw new Error('Failed to log time');
            const data = await res.json();
            
            setIsLogging(false);
            setHours('');
            setDescription('');
            toast.success(`Logged ${numHours} hours!`);
            
            if (onTimeLogged) {
                // pass updated task back to parent
                onTimeLogged({ ...task, loggedHours: data.loggedHours });
            }
        } catch (error) {
            toast.error('Failed to log time');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(245,158,11,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Timer size={14} color="#F59E0B" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
                        Time Tracking
                    </span>
                </div>
                
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsLogging(!isLogging)}
                    style={{
                        background: 'transparent',
                        border: '1px dashed rgba(245,158,11,0.4)',
                        color: '#F59E0B',
                        borderRadius: '6px',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                    }}
                >
                    {isLogging ? 'Cancel Element' : <><Plus size={10} /> Log Time</>}
                </motion.button>
            </div>

            {/* Render Log Form if open */}
            <AnimatePresence>
                {isLogging && (
                    <motion.form 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '1rem' }}
                        onSubmit={handleLogTime}
                    >
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    placeholder="Hours (e.g. 1.5)"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    style={{
                                        width: '100px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 6, padding: '0.4rem 0.6rem',
                                        color: '#fff', fontSize: '0.8rem', outline: 'none'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="What did you work on?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 6, padding: '0.4rem 0.6rem',
                                        color: '#fff', fontSize: '0.8rem', outline: 'none'
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !hours}
                                style={{
                                    width: '100%', background: '#F59E0B', color: '#000', border: 'none',
                                    padding: '0.4rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                                    cursor: 'pointer', opacity: (loading || !hours) ? 0.6 : 1
                                }}
                            >
                                {loading ? 'Logging...' : 'Submit Log'}
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Progress Bar & Stats */}
            {estimatedHours > 0 ? (
                <>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', margin: '0.5rem 0' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1 }}
                            style={{
                                height: '100%', borderRadius: 2,
                                background: isOverEstimate ? '#EF4444' : '#F59E0B',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                        <span><strong style={{ color: isOverEstimate ? '#EF4444' : '#F59E0B' }}>{loggedHours}h</strong> logged</span>
                        <span>{estimatedHours}h estimated</span>
                    </div>
                </>
            ) : (
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} />
                    {loggedHours > 0 ? `${loggedHours} hours logged (no estimate set)` : 'No time logged yet'}
                </div>
            )}
        </div>
    );
};
