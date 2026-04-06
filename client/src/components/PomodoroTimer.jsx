import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, X, Clock } from 'lucide-react';

const PomodoroTimer = ({ onClose }) => {
    const [seconds, setSeconds] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // focus, break

    useEffect(() => {
        let interval = null;
        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds(prev => prev - 1);
            }, 1000);
        } else if (seconds === 0) {
            clearInterval(interval);
            setIsActive(false);
            const nextMode = mode === 'focus' ? 'break' : 'focus';
            setMode(nextMode);
            setSeconds(nextMode === 'focus' ? 25 * 60 : 5 * 60);
        }
        return () => clearInterval(interval);
    }, [isActive, seconds, mode]);

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <motion.div
            drag
            dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                zIndex: 1000,
                padding: '1rem',
                borderRadius: '20px',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                width: '180px',
                cursor: 'grab'
            }}
            whileDrag={{ cursor: 'grabbing' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={14} color="var(--brand-primary)" />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                        {mode === 'focus' ? 'Focusing' : 'Break Time'}
                    </span>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                    <X size={14} />
                </button>
            </div>

            <div style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', color: '#F8FAFC', fontFamily: 'JetBrains Mono, monospace', marginBottom: '1rem' }}>
                {formatTime(seconds)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button
                    onClick={() => setIsActive(!isActive)}
                    style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#F59E0B'
                    }}
                >
                    {isActive ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                    onClick={() => { setIsActive(false); setSeconds(mode === 'focus' ? 25 * 60 : 5 * 60); }}
                    style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-muted)'
                    }}
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            {/* Visual indicator of progress */}
            <div style={{ marginTop: '1rem', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: `${(seconds / (mode === 'focus' ? 25 * 60 : 5 * 60)) * 100}%` }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #F59E0B, #DC2626)' }}
                />
            </div>
        </motion.div>
    );
};

export default PomodoroTimer;
