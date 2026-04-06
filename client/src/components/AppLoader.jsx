import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Animated Hex Grid ─────────────────────────────────────── */
const HexGrid = () => {
    const hexes = Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: (i % 6) * 80 + (Math.floor(i / 6) % 2 === 0 ? 0 : 40),
        y: Math.floor(i / 6) * 70,
        delay: i * 0.06,
    }));

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.18 }}>
            <svg width="100%" height="100%" viewBox="0 0 480 220" preserveAspectRatio="xMidYMid slice">
                {hexes.map((h) => (
                    <motion.polygon
                        key={h.id}
                        points="30,0 60,17 60,51 30,68 0,51 0,17"
                        transform={`translate(${h.x}, ${h.y})`}
                        fill="none"
                        stroke="rgba(245,158,11,0.6)"
                        strokeWidth="0.8"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 1, 0.4, 1], scale: 1 }}
                        transition={{ duration: 1.2, delay: h.delay, ease: 'easeOut' }}
                    />
                ))}
            </svg>
        </div>
    );
};

/* ── Logo mark SVG ─────────────────────────────────────────── */
const LogoMark = ({ size = 64 }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <motion.path
            d="M32 4L56 18V46L32 60L8 46V18L32 4Z"
            fill="rgba(245,158,11,0.12)"
            stroke="#F59E0B"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.path
            d="M22 32L29 39L42 26"
            stroke="#FBBF24"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
    </svg>
);

/* ── Loading Bar ───────────────────────────────────────────── */
const LoadBar = ({ progress }) => (
    <div style={{
        width: '220px', height: '2px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '2px', overflow: 'hidden',
        margin: '0 auto'
    }}>
        <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
                height: '100%',
                background: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                borderRadius: '2px',
                boxShadow: '0 0 8px rgba(245,158,11,0.6)'
            }}
        />
    </div>
);

/* ── Floating Particles ────────────────────────────────────── */
const Particles = () => {
    const pts = Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 2 + 1,
        d: Math.random() * 6 + 4
    }));
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {pts.map(p => (
                <motion.div
                    key={p.id}
                    animate={{
                        y: [`${p.y}%`, `${(p.y + 30) % 100}%`],
                        opacity: [0.2, 0.7, 0.2]
                    }}
                    transition={{ duration: p.d, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
                    style={{
                        position: 'absolute', left: `${p.x}%`, top: 0,
                        width: p.s, height: p.s, borderRadius: '50%',
                        background: '#F59E0B', filter: 'blur(0.5px)'
                    }}
                />
            ))}
        </div>
    );
};

/* ── App Loader ────────────────────────────────────────────── */
const AppLoader = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Initializing workspace…');

    const steps = [
        { label: 'Authenticating session…',   target: 25 },
        { label: 'Loading workspace data…',   target: 55 },
        { label: 'Applying design system…',   target: 80 },
        { label: 'Ready. Entering portal…',   target: 100 },
    ];

    useEffect(() => {
        let stepIndex = 0;
        const run = () => {
            if (stepIndex >= steps.length) return;
            const step = steps[stepIndex];
            setStatus(step.label);
            setProgress(step.target);
            stepIndex++;
            if (stepIndex < steps.length) {
                setTimeout(run, 480);
            } else {
                setTimeout(() => onComplete?.(), 600);
            }
        };
        const init = setTimeout(run, 300);
        return () => clearTimeout(init);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'radial-gradient(ellipse at 40% 40%, #131e33 0%, #0B1220 60%)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden'
            }}
        >
            {/* Background elements */}
            <Particles />
            <HexGrid />

            {/* Ambient glow behind logo */}
            <div style={{
                position: 'absolute',
                width: '320px', height: '320px',
                background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(30px)',
                animation: 'pulse 3s ease-in-out infinite'
            }} />

            {/* Main Content */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>

                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'relative' }}
                >
                    {/* Halo ring */}
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute', inset: '-20px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)',
                            filter: 'blur(8px)'
                        }}
                    />
                    <LogoMark size={72} />
                </motion.div>

                {/* Brand name */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    style={{ textAlign: 'center' }}
                >
                    <div style={{
                        fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em',
                        fontFamily: 'Manrope, Inter, sans-serif',
                        background: 'linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                        Workflow<span style={{
                            background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>Pro</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(148,163,184,0.7)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, marginTop: '0.3rem' }}>
                        Enterprise Platform
                    </div>
                </motion.div>

                {/* Progress section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}
                >
                    <LoadBar progress={progress} />
                    <motion.p
                        key={status}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        style={{
                            fontSize: '0.75rem', color: 'rgba(148,163,184,0.65)',
                            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
                            fontWeight: 500
                        }}
                    >
                        {status}
                    </motion.p>
                </motion.div>
            </div>

            {/* Version tag */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                style={{
                    position: 'absolute', bottom: '2rem',
                    fontSize: '0.7rem', color: 'rgba(100,116,139,0.5)',
                    fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em'
                }}
            >
                v2.0.0 · Enterprise Edition
            </motion.div>
        </motion.div>
    );
};

export default AppLoader;
