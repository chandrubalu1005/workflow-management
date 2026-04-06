import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const LevelUpOverlay = ({ level, onComplete }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            if (onComplete) onComplete();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const levelColors = {
        1: '#CD7F32', // Bronze
        2: '#C0C0C0', // Silver
        3: '#FFD700', // Gold
        4: '#E5E4E2'  // Platinum
    };

    const levelNames = {
        1: 'Bronze Initiative',
        2: 'Silver Specialist',
        3: 'Gold Guardian',
        4: 'Platinum Architect'
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 2000,
                        background: 'rgba(11, 14, 20, 0.95)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.5, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                        style={{ textAlign: 'center' }}
                    >
                        <motion.div
                            animate={{ rotate: 360, y: [0, -20, 0] }}
                            transition={{ rotate: { duration: 10, repeat: Infinity, ease: 'linear' }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
                            style={{ position: 'relative', display: 'inline-block', marginBottom: '2rem' }}
                        >
                            <Trophy size={120} color={levelColors[level]} style={{ filter: `drop-shadow(0 0 30px ${levelColors[level]}66)` }} />
                            <motion.div
                                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ position: 'absolute', top: '-10px', right: '-10px' }}
                            >
                                <Sparkles size={40} color={levelColors[level]} />
                            </motion.div>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            transition={{ delay: 0.3 }}
                            style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}
                        >
                            Orchestrator Ascension
                        </motion.h2>

                        <motion.h1
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, type: 'spring' }}
                            style={{ fontSize: '4.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1.5rem' }}
                        >
                            LEVEL UP!
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            style={{ padding: '0.75rem 2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '40px', border: `1px solid ${levelColors[level]}44`, display: 'inline-flex', alignItems: 'center', gap: '1rem' }}
                        >
                            <Star size={20} color={levelColors[level]} fill={levelColors[level]} />
                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{levelNames[level]} REACHED</span>
                        </motion.div>
                    </motion.div>

                    {/* Fun Particles/Confetti Emulation */}
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: (Math.random() - 0.5) * 600, y: (Math.random() - 0.5) * 600 }}
                            transition={{ duration: 2, delay: 0.5 + Math.random(), repeat: Infinity }}
                            style={{ position: 'absolute', width: '8px', height: '8px', borderRadius: '50%', background: levelColors[level], boxShadow: `0 0 10px ${levelColors[level]}` }}
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LevelUpOverlay;
