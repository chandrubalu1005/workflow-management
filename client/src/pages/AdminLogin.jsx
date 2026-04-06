import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Mail, Lock, Eye, EyeOff, Loader2, Check, Shield, ArrowLeft, KeySquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

/* ── CSS Animations ─────────────────────── */
const shakeAnimation = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
        20%, 40%, 60%, 80% { transform: translateX(8px); }
    }
    @keyframes pulse-border {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4), 0 20px 40px rgba(0,0,0,0.4); }
        50% { box-shadow: 0 0 0 8px rgba(239,68,68,0), 0 20px 40px rgba(0,0,0,0.4); }
    }
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = shakeAnimation;
    document.head.appendChild(style);
}

/* ── Premium Security Background (Geometric - No Waves) ─────────────────────── */
const SecurityBackground = () => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: '#0F0909' }}>
        {/* Base Depth */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #1A0F1C 0%, #0F0909 100%)' }} />
        
        {/* Cyber Grid (Red) */}
        <div className="cyber-grid-bg" style={{ 
            opacity: 0.3, 
            backgroundImage: 'linear-gradient(rgba(239, 68, 68, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 68, 68, 0.04) 1px, transparent 1px)' 
        }} />
        
        {/* Security Scan Line */}
        <div className="scan-line" style={{ 
            background: 'linear-gradient(to bottom, transparent, rgba(239, 68, 68, 0.12), transparent)',
            animationDuration: '6s'
        }} />

        {/* Floating Security Nodes (Diamonds) */}
        {[...Array(8)].map((_, i) => (
            <motion.div
                key={i}
                initial={{ 
                    top: `${Math.random() * 100}%`, 
                    left: `${Math.random() * 100}%`,
                    opacity: 0,
                    scale: 0.3
                }}
                animate={{ 
                    opacity: [0, 0.4, 0],
                    scale: [0.3, 0.8, 0.3],
                    y: [0, -60, 0],
                    rotate: [45, 225, 405]
                }}
                transition={{ 
                    duration: 12 + Math.random() * 8, 
                    repeat: Infinity, 
                    delay: i * 1,
                    ease: "linear"
                }}
                style={{
                    position: 'absolute',
                    width: '10px', height: '10px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.03)',
                    transform: 'rotate(45deg)',
                    pointerEvents: 'none',
                    willChange: 'transform, opacity'
                }}
            />
        ))}
    </div>
);

/* ── Floating Label Input ───────────────────────────────── */
const FloatingInput = ({ label, type = 'text', value, onChange, icon: Icon, extra }) => {
    const [focused, setFocused] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const hasValue = (value && value.length > 0);
    const inputType = type === 'password' ? (showPass ? 'text' : 'password') : type;

    return (
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <style>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0px 1000px #0b1220 inset !important;
                    -webkit-text-fill-color: #F8FAFC !important;
                    transition: background-color 5000s ease-in-out 0s;
                }
            `}</style>
            
            <div style={{
                position: 'relative',
                border: `1px solid ${focused ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.08)'}`, // Red accent for Admin context
                borderRadius: '12px',
                background: focused ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.22s ease',
                boxShadow: focused ? '0 0 0 3px rgba(239,68,68,0.1), 0 0 15px rgba(239,68,68,0.05)' : 'none',
            }}>
                <Icon size={16} color={focused ? '#EF4444' : '#64748B'}
                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2, transition: 'color 0.2s' }} />

                <label style={{
                    position: 'absolute', left: '2.6rem',
                    top: (focused || hasValue) ? '0.75rem' : '50%',
                    transform: (focused || hasValue) ? 'translateY(-50%) scale(0.85)' : 'translateY(-50%)',
                    transformOrigin: 'left',
                    color: focused ? '#EF4444' : '#64748B',
                    fontSize: '0.85rem', pointerEvents: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 2, opacity: (focused || hasValue) ? 0.9 : 0.6
                }}>
                    {label}
                </label>

                <input
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    required
                    aria-label={label}
                    style={{
                        width: '100%', paddingTop: '1.5rem', paddingBottom: '0.65rem',
                        paddingLeft: '2.6rem', paddingRight: type === 'password' ? '3rem' : '1rem',
                        background: 'transparent', border: 'none', outline: 'none',
                        color: '#F8FAFC', fontSize: '0.95rem', fontFamily: 'Inter',
                        boxSizing: 'border-box',
                    }}
                />

                {type === 'password' && (
                    <button type="button" onClick={() => setShowPass(v => !v)}
                        aria-label="Toggle password visibility"
                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', zIndex: 3 }}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
            {extra && <div style={{ marginTop: '0.1rem', paddingLeft: '0.25rem' }}>{extra}</div>}
        </div>
    );
};

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success'
    
    const [isShaking, setIsShaking] = useState(false);
    
    const { login, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Redirect already-authenticated users away from the login page
    useEffect(() => {
        if (!authLoading && user) navigate('/dashboard', { replace: true });
    }, [user, navigate, authLoading]);

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        window.scrollTo(0, 0); // Focus management helper
        
        setStatus('loading');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, intendedRole: 'admin' }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Login failed');

            // Success Animation Sequence
            setStatus('success');
            
            setTimeout(() => {
                login(data.user, data.token);
                toast(`Welcome back, Admin ${data.user.name.split(' ')[0]} 🛡️`, {
                    icon: null,
                    style: {
                        background: 'rgba(17,24,39,0.9)',
                        color: '#F8FAFC',
                        border: '1px solid rgba(239,68,68,0.3)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    },
                    position: 'bottom-center',
                    duration: 4000
                });
            }, 2400);
            
        } catch (err) {
            triggerShake();
            toast.error(err.message, { style: { background: '#EF4444', color: '#fff' } });
            setStatus('idle');
        }
    };

    if (authLoading) return null;

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif',
            background: '#0F0909'
        }}>
            <SecurityBackground />

            <AnimatePresence mode="wait">
                {status !== 'success' && (
                    <motion.div
                        key="admin-login-form"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            width: '100%', maxWidth: '420px', margin: '0 1rem',
                            background: 'rgba(26, 15, 28, 0.75)',
                            backdropFilter: 'blur(30px) saturate(160%)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '24px',
                            padding: '3.5rem 2.75rem 2.75rem',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
                            zIndex: 10,
                            position: 'relative',
                            animation: isShaking ? 'shake 0.55s cubic-bezier(0.36,0.07,0.19,0.97) both' : 'none',
                        }}
                    >
                        {/* Security HUD Accents */}
                        <div style={{ position: 'absolute', top: '1rem', left: '1rem', color: '#EF4444', opacity: 0.5 }}><Shield size={14} /></div>
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#EF4444', opacity: 0.5 }}><KeySquare size={14} /></div>
                        
                        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', width: '20px', height: '2px', background: 'rgba(239,68,68,0.4)' }} />
                        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', width: '2px', height: '20px', background: 'rgba(239,68,68,0.4)' }} />
                        
                        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '20px', height: '2px', background: 'rgba(239,68,68,0.4)' }} />
                        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '2px', height: '20px', background: 'rgba(239,68,68,0.4)' }} />

                        {/* ── Header ── */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            style={{ textAlign: 'center', marginBottom: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                            <motion.div
                                style={{ marginBottom: '1.25rem' }}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <Logo size="md" withText={false} />
                            </motion.div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '0.4rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                Admin Portal
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                                >
                                    <Shield size={20} color="#EF4444" />
                                </motion.div>
                            </h1>
                            <p style={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 400 }}>
                                High-level clearance required
                            </p>
                        </motion.div>

                        {/* ── Form ── */}
                        <form onSubmit={handleSubmit}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key="step0"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                                >
                                    <FloatingInput
                                        label="Administrator Email" type="email"
                                        value={email} onChange={e => setEmail(e.target.value)} icon={Mail}
                                    />
                                    <FloatingInput
                                        label="Secure Password" type="password"
                                        value={password} onChange={e => setPassword(e.target.value)} icon={Lock}
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {/* ── Submit Button ── */}
                            <motion.button
                                type="submit"
                                disabled={status !== 'idle'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.35 }}
                                whileHover={status === 'idle' ? { scale: 1.02, boxShadow: '0 0 20px rgba(239,68,68,0.4)' } : {}}
                                whileTap={status === 'idle' ? { scale: 0.98 } : {}}
                                style={{
                                    width: '100%', marginTop: '2rem', padding: '0.85rem',
                                    borderRadius: '12px', border: '1px solid rgba(239,68,68,0.5)',
                                    cursor: status !== 'idle' ? 'not-allowed' : 'pointer',
                                    background: status === 'loading' 
                                        ? 'rgba(239,68,68,0.3)' 
                                        : 'linear-gradient(135deg, rgba(239,68,68,0.8) 0%, rgba(185,28,28,0.9) 100%)',
                                    color: '#fff', fontWeight: 700, fontSize: '1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    transition: 'all 0.2s', letterSpacing: '0.01em',
                                }}
                            >
                                {status === 'idle' && (<><Shield size={18} /> Authenticate</>)}
                                {status === 'loading' && <><Loader2 size={18} className="animate-spin" /> Verifying...</>}
                                {status === 'success' && <><Check size={20} strokeWidth={3} /> Success</>}
                            </motion.button>
                        </form>

                        {/* ── Footer ── */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.45 }}
                            style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                        >
                            <button type="button" onClick={() => navigate('/login')}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#64748B', fontSize: '0.8rem', fontWeight: 500,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                                    margin: '0 auto',
                                    transition: 'color 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.color = '#F8FAFC'}
                                onMouseOut={e => e.currentTarget.style.color = '#64748B'}
                            >
                                <ArrowLeft size={14} /> Back to employee login
                            </button>
                            {/* BYPASS: Simplified footer */}
                        </motion.div>
                    </motion.div>
                )}
                
                {/* ── Success State Animation (Thanos Snap Style - Admin Red) ── */}
                {status === 'success' && (
                    <motion.div
                        key="admin-success-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            background: '#0F0909',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        {/* The Thanos Snap Animation on Logo */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, filter: 'blur(20px)' }}
                            animate={{
                                scale: [0.8, 1, 1.05, 1.1, 8],
                                opacity: [0, 1, 1, 1, 0],
                                filter: ['blur(15px)', 'blur(0px)', 'blur(0px)', 'contrast(200%) blur(2px)', 'blur(40px)'],
                                rotate: [0, 0, 0, -2, 10]
                            }}
                            transition={{ duration: 2.4, times: [0, 0.3, 0.85, 0.92, 1], ease: 'easeInOut' }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
                        >
                            <Logo size="lg" withText={true} />
                            
                            {/* Dissolving particles mimicking the snap dust (Red themed) */}
                            {[...Array(24)].map((_, i) => {
                                const angle = Math.random() * Math.PI * 2;
                                const distance = Math.random() * 400 + 100;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                                        animate={{ 
                                            opacity: [0, 0, 1, 0], 
                                            x: [0, 0, Math.cos(angle) * distance, Math.cos(angle) * (distance + 200)], 
                                            y: [0, 0, Math.sin(angle) * distance - 50, Math.sin(angle) * (distance + 200) - 100],
                                            scale: [0, 0, Math.random() * 3 + 1, 0] 
                                        }}
                                        transition={{ duration: 2.4, times: [0, 0.92, 0.96, 1], ease: "easeOut" }}
                                        style={{
                                            position: 'absolute',
                                            width: Math.random() * 6 + 2,
                                            height: Math.random() * 6 + 2,
                                            background: i % 3 === 0 ? '#EF4444' : (i % 2 === 0 ? '#DC2626' : '#7F1D1D'),
                                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                            zIndex: 10,
                                            boxShadow: '0 0 10px rgba(239,68,68,0.5)'
                                        }}
                                    />
                                );
                            })}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminLogin;
