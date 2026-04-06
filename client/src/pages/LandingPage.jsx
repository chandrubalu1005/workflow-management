import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform, AnimatePresence, useInView, useMotionValue } from 'framer-motion';
import {
    BarChart2, Zap, Shield, ArrowRight, ChevronRight,
    Users, CheckSquare, Activity, Star, CheckCircle2,
    Database, Users as UsersIcon, Workflow, FileText
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import Logo from '../components/Logo';

/* ── Hooks ──────────────────────────────────────────────── */
function useMousePosition() {
    const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
    useEffect(() => {
        const handler = (e) => setPos({
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight,
        });
        window.addEventListener('mousemove', handler);
        return () => window.removeEventListener('mousemove', handler);
    }, []);
    return pos;
}

const useAnimatedCounter = (endValue, duration = 1.5) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-50px" });

    useEffect(() => {
        if (!inView) return;
        let startTime;
        const animate = (time) => {
            if (!startTime) startTime = time;
            const progress = (time - startTime) / (duration * 1000);
            if (progress < 1) {
                setCount(Math.min(endValue, Math.floor(endValue * progress)));
                requestAnimationFrame(animate);
            } else {
                setCount(endValue);
            }
        };
        requestAnimationFrame(animate);
    }, [inView, endValue, duration]);

    return { count, ref };
};

/* ── Components ─────────────────────────────────────────── */

// Drifting Background Gradient
const MotionBackground = memo(() => (
    <motion.div
        style={{
            position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle at top, #1A2438 0%, #0B1220 100%)',
            backgroundSize: '200% 200%'
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
    />
));

// Floating Ambient Particles Array
const AmbientParticles = memo(() => {
    const particles = Array.from({ length: 35 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100 + 20, // start slightly lower
        s: Math.random() * 2.5 + 1,
        d: Math.random() * 15 + 15,
        delay: Math.random() * 5
    }));
    return (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {/* Ambient Top Glow */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -20%, rgba(245,158,11,0.12), transparent 70%)' }} />
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                        y: [`${p.y}vh`, `${p.y - 45}vh`],
                        x: [`${p.x}vw`, `${p.x + (Math.random() * 10 - 5)}vw`],
                        opacity: [0, 0.7, 0],
                        scale: [0.5, 1.2, 0.5]
                    }}
                    transition={{ duration: p.d, delay: p.delay, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute', width: p.s, height: p.s, borderRadius: '50%',
                        background: '#F59E0B', 
                        opacity: 0.4,
                        boxShadow: '0 0 8px rgba(245,158,11,0.4)',
                        willChange: 'transform, opacity' // GPU Hint
                    }}
                />
            ))}
        </div>
    );
});

// Border-beam button
const BorderBeamButton = ({ children, onClick, className = '' }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.button
            onClick={onClick}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(245,158,11,0.5)' }}
            whileTap={{ scale: 0.96 }}
            className={className}
            style={{
                position: 'relative', padding: '0.8rem 1.8rem', borderRadius: '12px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: 'white', fontWeight: 700, fontSize: '0.95rem', border: 'none',
                cursor: 'pointer', overflow: 'hidden', display: 'inline-flex',
                alignItems: 'center', gap: '0.6rem', fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 15px rgba(245,158,11,0.3)', transition: 'all 0.2s',
                willChange: 'transform'
            }}
        >
            <span style={{
                position: 'absolute', inset: 0, borderRadius: '12px', padding: '1px',
                background: 'conic-gradient(from var(--angle, 0deg), transparent 70%, #fff 80%, transparent 90%)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                animation: 'spin-border 2.5s linear infinite', pointerEvents: 'none'
            }} />
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {children}
            </span>
        </motion.button>
    );
};

// Stripe-style Feature Spotlight Card
const SpotlightCard = ({ icon: Icon, title, desc, delay = 0 }) => {
    const cardRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay, duration: 0.5 }}
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.03, y: -4 }}
            style={{
                position: 'relative', background: 'rgba(11,18,32,0.6)', backdropFilter: 'blur(10px)',
                borderRadius: '24px', padding: '2.5rem 2rem', border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem',
                borderImage: isHovered ? 'linear-gradient(to bottom right, rgba(245,158,11,0.5), transparent) 1' : 'none',
                boxShadow: isHovered ? '0 10px 40px rgba(0,0,0,0.5)' : 'none',
                willChange: 'transform'
            }}
        >
            {/* Mouse Spotlight (Rerender-free MotionValue) */}
            <motion.div
                style={{
                    position: 'absolute', 
                    top: -150, left: -150,
                    x: mouseX, 
                    y: mouseY,
                    width: 300, height: 300, 
                    background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 0,
                    opacity: isHovered ? 1 : 0
                }}
            />
            {/* Gradient Top Line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #F59E0B, transparent)', willChange: 'transform' }} />

            <div style={{ position: 'relative', zIndex: 1, backfaceVisibility: 'hidden' }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245,158,11,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245,158,11,0.2)'
                }}>
                    <Icon size={28} color="#F59E0B" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', marginTop: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
        </motion.div>
    );
};


// Animated Stats Counter Component
const StatCounter = ({ icon: Icon, label, endValue, suffix = '' }) => {
    const { count, ref } = useAnimatedCounter(endValue, 2);
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -6, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', borderColor: 'rgba(245,158,11,0.15)' }}
            style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'rgba(11,18,32,0.7)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px',
                padding: '1.25rem 1.75rem', transition: 'all 0.3s'
            }}
        >
            <div style={{
                width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245,158,11,0.3)'
            }}>
                <Icon size={22} color="#F59E0B" />
            </div>
            <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'baseline' }}>
                    {count}{suffix}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
            </div>
        </motion.div>
    );
};

/* ── Interactive SaaS Sections ──────────────────────────── */

const WorkflowVisualization = () => {
    return (
        <div style={{ position: 'relative', padding: '4rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            <style>{`
                @keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); } 70% { box-shadow: 0 0 0 15px rgba(245,158,11,0); } 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); } }
                .wf-node { animation: pulse-glow 2.5s infinite; }
            `}</style>

            {[
                { icon: Database, label: 'Projects' },
                { icon: UsersIcon, label: 'Teams' },
                { icon: FileText, label: 'Tasks' },
                { icon: BarChart2, label: 'Analytics' }
            ].map((node, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                    <motion.div
                        className="wf-node"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2, duration: 0.5 }}
                        style={{
                            width: 80, height: 80, borderRadius: 24, background: 'rgba(11,18,32,0.8)',
                            border: '1px solid rgba(245,158,11,0.3)', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#F59E0B',
                            boxShadow: 'inset 0 0 20px rgba(245,158,11,0.1)'
                        }}
                    >
                        <node.icon size={26} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#E2E8F0' }}>{node.label}</span>
                    </motion.div>

                    {i < 3 && (
                        <svg width="40" height="40" viewBox="0 0 100 20" style={{ opacity: 0.5 }}>
                            <line x1="0" y1="10" x2="100" y2="10" stroke="#F59E0B" strokeWidth="3" strokeDasharray="10 10">
                                <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1s" repeatCount="indefinite" />
                            </line>
                        </svg>
                    )}
                </div>
            ))}
        </div>
    );
};

const AnimatedKanbanBase = () => {
    return (
        <div className="landing-kanban-grid" style={{
            background: 'rgba(11,18,32,0.6)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '2rem',
            border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '3rem', position: 'relative'
        }}>
            {/* Columns */}
            {['To Do', 'In Progress', 'Done'].map(col => (
                <div key={col} className="landing-kanban-col" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: '1.5rem', minHeight: 400 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>{col}</div>

                    {/* Dummy static cards */}
                    {col === 'To Do' && <div style={{ height: 100, background: 'rgba(255,255,255,0.02)', borderRadius: 12, marginBottom: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }} />}
                    {col === 'Done' && <div style={{ height: 80, background: 'rgba(16,185,129,0.05)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }} />}
                </div>
            ))}

            {/* The Animated Floating Card */}
            <motion.div
                animate={{
                    x: [0, 310, 620], // Jumps between the 3 columns
                    y: [0, -20, 0, -20, 0], // Drag lift simulation
                    scale: [1, 1.05, 1, 1.05, 1], // Drag lift scale
                    boxShadow: ['0 4px 10px rgba(0,0,0,0.2)', '0 20px 30px rgba(0,0,0,0.5)', '0 4px 10px rgba(0,0,0,0.2)']
                }}
                transition={{
                    duration: 6,
                    times: [0, 0.45, 0.9], // Timing mapping for the 3 columns
                    repeat: Infinity, repeatDelay: 1, ease: "easeInOut"
                }}
                style={{
                    position: 'absolute', top: '5.5rem', left: '2rem', width: 'calc(33.33% - 2.5rem)',
                    background: 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))',
                    borderRadius: 16, padding: '1.25rem', border: '1px solid rgba(245,158,11,0.3)',
                    zIndex: 10, pointerEvents: 'none'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', borderRadius: 4, fontWeight: 700 }}>HIGH PRIORITY</span>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#F59E0B' }} />
                </div>
                <div style={{ fontWeight: 800, color: '#F8FAFC', marginBottom: '0.5rem' }}>Update Landing Portal SaaS Animations</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ height: 4, width: 30, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
                    <div style={{ height: 4, width: '40%', background: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
                </div>

                {/* Success Checkmark overlay at end of animation sequence */}
                <motion.div
                    animate={{ opacity: [0, 0, 1] }}
                    transition={{ duration: 6, times: [0, 0.8, 0.9], repeat: Infinity, repeatDelay: 1 }}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(16,185,129,0.15)', backdropFilter: 'blur(2px)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <motion.div animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.4, delay: 5.4, repeat: Infinity, repeatDelay: 6 }}>
                        <CheckCircle2 size={48} color="#10B981" />
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
};

/* ── Main Landing Page Component ────────────────────────── */
const LandingPage = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const { scrollY } = useScroll();

    useEffect(() => {
        const unsub = scrollY.on('change', v => setScrolled(v > 40));
        return unsub;
    }, [scrollY]);

    // Split text into words for stagger effect
    const titleWords = "Orchestrate Your Team's Success".split(" ");

    return (
        <div style={{ minHeight: '100vh', background: '#0B1220', color: '#F8FAFC', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
            <style>{`
                @property --angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
                @keyframes spin-border { to { --angle: 360deg; } }
                .nav-link { color: #94A3B8; text-decoration: none; font-size: 0.9rem; font-weight: 600; transition: color 0.2s; }
                .nav-link:hover { color: #F8FAFC; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
            `}</style>

            <MotionBackground />
            <AmbientParticles />

            {/* ── Glassmorphic Navbar ── */}
            <motion.nav
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0 2rem',
                    background: scrolled ? 'rgba(11,18,32,0.85)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(12px)' : 'none',
                    borderBottom: scrolled ? '1px solid rgba(245,158,11,0.15)' : '1px solid transparent',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                animate={{ height: scrolled ? '64px' : '80px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <Logo size="sm" animated={false} withText={true} />
                </div>

                <div className="landing-nav-links" style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                    <a className="nav-link" href="#platform">Platform</a>
                    <a className="nav-link" href="#workflows">Workflows</a>
                    <a className="nav-link" href="#pricing">Pricing</a>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <ThemeToggle />
                    <button onClick={() => navigate('/user-login')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '10px', background: 'transparent',
                            color: '#CBD5E1', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                            transition: 'color 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.color = '#F59E0B'}
                        onMouseOut={e => e.currentTarget.style.color = '#CBD5E1'}
                    >
                        User Portal
                    </button>
                    <button onClick={() => navigate('/admin-login')}
                        style={{
                            padding: '0.6rem 1.25rem', borderRadius: '10px', background: 'rgba(245,158,11,0.1)',
                            color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.2)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(245,158,11,0.3)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        Admin Portal
                    </button>
                </div>
            </motion.nav>

            {/* ── SaaS Hero Section ── */}
            <main className="landing-section" style={{ position: 'relative', zIndex: 1, padding: '7rem 2rem 5rem' }}>
                <section style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {/* Animated Badge Glow */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                            borderRadius: '999px', padding: '0.4rem 1rem', marginBottom: '2.5rem',
                            boxShadow: '0 0 12px rgba(245,158,11,0.35)'
                        }}
                    >
                        <Zap size={14} color="#F59E0B" />
                        <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 800, letterSpacing: '0.08em' }}>ENTERPRISE WORKFLOW PLATFORM v2.0</span>
                    </motion.div>

                    {/* Staggered Cinematic Headline */}
                    <motion.div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.5rem', position: 'relative' }}>
                        {/* Ambient glow behind text */}
                        <motion.div
                            animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.95, 1.05, 0.95] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', height: '140%', background: 'radial-gradient(ellipse, rgba(245,158,11,0.18) 0%, transparent 60%)', filter: 'blur(40px)', pointerEvents: 'none' }}
                        />

                        {titleWords.map((word, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                className="landing-hero-title"
                                style={{
                                    fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', fontWeight: 800, lineHeight: 1.1,
                                    letterSpacing: '-0.04em', color: '#F8FAFC', position: 'relative',
                                    ...(i === 3 ? { color: 'transparent', background: 'linear-gradient(135deg, #FBBF24, #D97706)', WebkitBackgroundClip: 'text' } : {})
                                }}
                            >
                                {word}
                                {i === 3 && (
                                    <motion.span
                                        animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #FDE68A, #F59E0B)', WebkitBackgroundClip: 'text', color: 'transparent', filter: 'blur(10px)', pointerEvents: 'none' }}
                                    >
                                        {word}
                                    </motion.span>
                                )}
                            </motion.span>
                        ))}
                    </motion.div>

                    <motion.p
                        className="landing-hero-desc"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
                        style={{ fontSize: '1.35rem', color: '#94A3B8', maxWidth: '720px', margin: '0 auto 3.5rem', lineHeight: 1.6, fontWeight: 400 }}
                    >
                        A powerful, intelligent workflow management hub built for modern software teams.
                        Unify your tasks, monitor performance, and ship faster.
                    </motion.p>

                    <motion.div className="landing-cta-group" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                        {/* Glowing radial pulse behind the CTA button */}
                        <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ position: 'absolute', top: '50%', left: '25%', transform: 'translate(-50%, -50%)', width: '140px', height: '60px', background: 'rgba(245,158,11,0.4)', borderRadius: '50%', filter: 'blur(24px)', zIndex: 0, pointerEvents: 'none' }}
                        />
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%' }}>
                            <BorderBeamButton className="landing-cta-btn" onClick={() => navigate('/user-login')}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Enter Workspace <motion.span whileHover={{ x: 6 }}><ArrowRight size={18} /></motion.span></span>
                            </BorderBeamButton>
                        </div>
                        <button onClick={() => window.open('https://github.com', '_blank')}
                            style={{
                                padding: '0.8rem 2rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                                color: '#F8FAFC', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s', backdropFilter: 'blur(5px)'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                            View Documentation
                        </button>
                    </motion.div>

                    {/* Stats */}
                    <motion.div className="landing-stats-group" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                        style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '5rem' }}>
                        <StatCounter icon={Users} label="Active Users" endValue={1284} suffix="+" />
                        <StatCounter icon={Workflow} label="Tasks Orchestrated" endValue={48} suffix="k+" />
                        <StatCounter icon={Activity} label="System Uptime" endValue={99.9} suffix="%" />
                    </motion.div>
                </section>

                {/* Visual Data System */}
                <section id="platform" style={{ padding: '8rem 0 2rem' }}>
                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Intelligent Orchestration</h2>
                        <p style={{ color: '#94A3B8', fontSize: '1.1rem' }}>Data flows seamlessly across the entire organization.</p>
                    </motion.div>
                    <WorkflowVisualization />
                </section>

                {/* Animated Kanban Section */}
                <section id="workflows" style={{ padding: '6rem 0', maxWidth: 1200, margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #F8FAFC, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Visual Task Management
                        </h2>
                        <p style={{ color: '#94A3B8', fontSize: '1.1rem' }}>Organize work with intelligent Kanban automation and real-time syncing.</p>
                    </motion.div>
                    <AnimatedKanbanBase />
                </section>

                {/* Feature Spotlights */}
                <section className="landing-section" style={{ padding: '6rem 0', maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                        <SpotlightCard
                            icon={BarChart2} title="Real-Time Analytics"
                            desc="Live insights into team productivity with beautiful charts, bento-style dashboards, and performance velocity metrics."
                            delay={0}
                        />
                        <SpotlightCard
                            icon={Zap} title="Workflow Automation"
                            desc="Streamline repetitive tasks with smart status flows, drag-and-drop mechanics, and deadline enforcements."
                            delay={0.1}
                        />
                        <SpotlightCard
                            icon={Shield} title="Enterprise Security"
                            desc="Role-based access control for Admins, cryptographically secure JWT auth, and full immutable activity audit logs."
                            delay={0.2}
                        />
                    </div>
                </section>

                {/* SaaS Pricing */}
                <section id="pricing" className="landing-section" style={{ padding: '6rem 0', maxWidth: 1200, margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Transparent Pricing</h2>
                        <p style={{ color: '#94A3B8', fontSize: '1.1rem' }}>Scale your operations from day one.</p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
                        {/* Starter */}
                        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            style={{ background: 'rgba(11,18,32,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: '3rem 2rem' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Starter</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem' }}>Free</div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', color: '#94A3B8' }}>
                                <li>✓ Basic workflow tools</li>
                                <li>✓ 1 Active Team</li>
                                <li>✓ Core analytics</li>
                            </ul>
                        </motion.div>

                        {/* Team (Highlighted) */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            style={{
                                background: 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)',
                                border: '1px solid rgba(245,158,11,0.4)', borderRadius: 24, padding: '4rem 2.5rem',
                                boxShadow: '0 0 40px rgba(245,158,11,0.25)', position: 'relative', transform: 'scale(1.05)'
                            }}>
                            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', background: '#F59E0B', color: '#000', padding: '0.4rem 1rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800 }}>MOST POPULAR</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#F59E0B' }}>Team</div>
                            <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'baseline' }}>$19 <span style={{ fontSize: '1rem', color: '#94A3B8', fontWeight: 500 }}>/user</span></div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#E2E8F0', fontWeight: 500 }}>
                                <li><span style={{ color: '#F59E0B' }}>✓</span> Advanced task automation</li>
                                <li><span style={{ color: '#F59E0B' }}>✓</span> Performance velocity reports</li>
                                <li><span style={{ color: '#F59E0B' }}>✓</span> Resource management</li>
                                <li><span style={{ color: '#F59E0B' }}>✓</span> Priority Support API</li>
                            </ul>
                            <button style={{ width: '100%', marginTop: '3rem', padding: '1rem', borderRadius: 12, background: '#F59E0B', color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer' }}>Upgrade Now</button>
                        </motion.div>

                        {/* Enterprise */}
                        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            style={{ background: 'rgba(11,18,32,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: '3rem 2rem' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Enterprise</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem' }}>Custom</div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', color: '#94A3B8' }}>
                                <li>✓ Dedicated bench management</li>
                                <li>✓ Multi-role RBAC arrays</li>
                                <li>✓ Workforce intelligence ML</li>
                            </ul>
                        </motion.div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '3rem 2rem', textAlign: 'center', marginTop: '4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Logo size="sm" animated={false} withText={true} />
                    </div>
                    <p style={{ color: '#64748B', fontSize: '0.85rem' }}>© 2026 WorkflowPro Enterprise SaaS Systems. Built for velocity.</p>
                </footer>
            </main>
        </div>
    );
};

export default LandingPage;
