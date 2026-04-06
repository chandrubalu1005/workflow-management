import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, History, X, Sparkles } from 'lucide-react';
// import confetti from 'canvas-confetti';

export const RewardCard = ({ user, onOpenHistory }) => {
    const [prevPoints, setPrevPoints] = useState(user?.totalRewardPoints || 0);
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        if (user?.totalRewardPoints > prevPoints) {
            setShowAnimation(true);
            // CSS Confetti
            for (let i = 0; i < 30; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti-piece';
                confetti.style.left = Math.random() * 100 + 'vw';
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), 3000);
            }
            setTimeout(() => setShowAnimation(false), 3000);
        }
        setPrevPoints(user?.totalRewardPoints || 0);
    }, [user?.totalRewardPoints]);

    // Calculate Level
    const getLevelInfo = (points) => {
        if (points >= 301) return { level: 4, title: 'Platinum 👑', next: null, min: 301, color: '#E5E4E2' };
        if (points >= 151) return { level: 3, title: 'Gold 🥇', next: 301, min: 151, color: '#FFD700' };
        if (points >= 51) return { level: 2, title: 'Silver 🥈', next: 151, min: 51, color: '#C0C0C0' };
        return { level: 1, title: 'Bronze 🥉', next: 51, min: 0, color: '#CD7F32' };
    };

    const levelInfo = getLevelInfo(user?.totalRewardPoints || 0);
    const progress = levelInfo.next
        ? ((user?.totalRewardPoints - levelInfo.min) / (levelInfo.next - levelInfo.min)) * 100
        : 100;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel card-shimmer"
            style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '1.5rem',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                transformStyle: 'preserve-3d',
                transform: 'perspective(1000px) rotateX(2deg)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Your Rewards</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trophy size={24} color="#FFD700" />
                        <motion.span
                            key={user?.totalRewardPoints}
                            initial={{ scale: 1.5, color: '#FFD700' }}
                            animate={{ scale: 1, color: 'var(--color-text-main)' }}
                            style={{ fontSize: '1.75rem', fontWeight: 'bold' }}
                        >
                            {user?.totalRewardPoints || 0}
                        </motion.span>
                        <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>pts</span>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpenHistory}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--color-text-main)'
                    }}
                    title="View History"
                >
                    <History size={18} />
                </motion.button>
            </div>

            <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <strong style={{ color: levelInfo.color }}>{levelInfo.title}</strong>
                    {levelInfo.next && <span>{Math.round(progress)}% to next level</span>}
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{
                            height: '100%',
                            background: `linear-gradient(90deg, ${levelInfo.color}, #FDB931)`,
                            boxShadow: `0 0 10px ${levelInfo.color}`
                        }}
                    />
                </div>
            </div>

            {/* Sparkle Animation */}
            <AnimatePresence>
                {showAnimation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        style={{ position: 'absolute', top: '10px', right: '50px', pointerEvents: 'none' }}
                    >
                        <Sparkles size={40} color="#FFD700" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export const RewardHistoryModal = ({ isOpen, onClose, history }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="glass-panel"
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--color-bg-primary)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-xl)'
                    }}
                >
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Reward History</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                        {history && history.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {history.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            background: 'var(--color-bg-secondary)',
                                            borderLeft: '4px solid #FFD700'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{item.taskTitle}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                {new Date(item.awardedAt).toLocaleDateString()} • {new Date(item.awardedAt).toLocaleTimeString()}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#FFD700', fontWeight: 'bold' }}>
                                            <Star size={16} fill="#FFD700" />
                                            +{item.pointsAwarded}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                                <Trophy size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                <p>No rewards earned yet.</p>
                                <p style={{ fontSize: '0.85rem' }}>Complete tasks to earn points!</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
