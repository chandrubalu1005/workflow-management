import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Lock, Briefcase, Loader2, ArrowRight,
    ArrowLeft, ShieldCheck, Eye, EyeOff, CheckCircle2, Building2, Phone, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── CSS Animations ─────────────────────── */
const slideAnimation = `
    @keyframes slide-in-left {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slide-out-right {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(-30px); }
    }
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = slideAnimation;
    document.head.appendChild(style);
}

/* ── Starfield Canvas ── */
const Starfield = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        const stars = Array.from({ length: 160 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 1.3 + 0.2,
            o: Math.random() * 0.6 + 0.1,
            s: Math.random() * 0.3 + 0.05,
        }));
        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            stars.forEach(s => {
                s.o += s.s * (Math.random() > 0.5 ? 1 : -1);
                s.o = Math.max(0.05, Math.min(0.75, s.o));
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(245,158,11,${s.o * 0.4})`; ctx.fill();
            });
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw); // Initiating loop properly
        
        const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize);
        
        return () => { 
            if (raf) cancelAnimationFrame(raf); 
            window.removeEventListener('resize', resize); 
        };
    }, []);
    return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', willChange: 'transform' }} />;
};

/* ── Password Strength ── */
const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
};
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

/* ── Floating Label Input ── */
const FloatingInput = ({ label, type = 'text', value, onChange, icon: Icon, error, suffix }) => {
    const [focused, setFocused] = useState(false);
    const [show, setShow] = useState(false);
    const hasValue = value && value.length > 0;
    const actualType = type === 'password' ? (show ? 'text' : 'password') : type;

    return (
        <div style={{ position: 'relative', marginBottom: error ? '0.35rem' : '1rem' }}>
            <div style={{
                position: 'relative',
                border: `1px solid ${error ? 'rgba(239,68,68,0.7)' : focused ? 'rgba(245,158,11,0.7)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: '14px',
                background: error ? 'rgba(239,68,68,0.04)' : focused ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.025)',
                transition: 'all 0.22s ease',
                boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.14)'}` : 'none',
            }}>
                <Icon size={16} color={error ? '#EF4444' : focused ? '#F59E0B' : '#4B5563'}
                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }} />
                <label style={{
                    position: 'absolute', left: '2.6rem',
                    top: (focused || hasValue) ? '0.7rem' : '50%',
                    transform: (focused || hasValue) ? 'translateY(-50%) scale(0.85)' : 'translateY(-50%)',
                    transformOrigin: 'left',
                    color: error ? '#EF4444' : focused ? '#F59E0B' : '#475569',
                    fontSize: '0.85rem', pointerEvents: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 2,
                    opacity: (focused || hasValue) ? 0.8 : 0.6
                }}>{label}</label>
                <input
                    type={actualType} value={value} onChange={onChange}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={{
                        width: '100%', paddingTop: '1.4rem', paddingBottom: '0.6rem',
                        paddingLeft: '2.6rem', paddingRight: suffix ? '2.8rem' : '1rem',
                        background: 'transparent', border: 'none', outline: 'none',
                        color: '#F1F5F9', fontSize: '0.95rem', fontFamily: 'Inter', boxSizing: 'border-box',
                    }}
                />
                {type === 'password' && (
                    <button type="button" onClick={() => setShow(s => !s)}
                        style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', zIndex: 2, display: 'flex' }}>
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
            </div>
            {error && <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '0.2rem', marginLeft: '0.5rem' }}>{error}</div>}
        </div>
    );
};

/* ── Step Indicator ── */
const StepIndicator = ({ current, total }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '2rem' }}>
        {Array.from({ length: total }, (_, i) => (
            <>
                <div key={`dot-${i}`} style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                    background: i < current ? '#F59E0B' : i === current ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `2px solid ${i <= current ? '#F59E0B' : 'rgba(255,255,255,0.1)'}`,
                    color: i < current ? '#000' : i === current ? '#F59E0B' : '#4B5563',
                    transition: 'all 0.3s',
                }}>
                    {i < current ? <CheckCircle2 size={13} /> : i + 1}
                </div>
                {i < total - 1 && (
                    <div key={`line-${i}`} style={{
                        flex: 1, height: 2,
                        background: i < current ? '#F59E0B' : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.4s'
                    }} />
                )}
            </>
        ))}
    </div>
);

/* ── Role Card ── */
const ROLES = [
    { id: 'developer', icon: '💻', label: 'Developer', desc: 'Build & engineer' },
    { id: 'designer', icon: '🎨', label: 'Designer', desc: 'Create & design' },
    { id: 'manager', icon: '📋', label: 'Manager', desc: 'Lead & coordinate' },
    { id: 'analyst', icon: '📊', label: 'Analyst', desc: 'Analyze & report' },
    { id: 'qa', icon: '🔍', label: 'QA Engineer', desc: 'Test & quality' },
    { id: 'other', icon: '🌐', label: 'Other', desc: 'Something else' },
];

const Signup = () => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirm: '',
        position: '', department: '', phone: '', roleCard: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle');
    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user, navigate]);

    const field = (key) => (e) => setFormData(p => ({ ...p, [key]: e.target.value }));

    const strength = getStrength(formData.password);

    /* Step validation */
    const validate = (s) => {
        const e = {};
        if (s === 0) {
            if (!formData.name.trim()) e.name = 'Full name is required';
            if (!formData.email.includes('@')) e.email = 'Enter a valid email address';
        }
        if (s === 1) {
            if (!formData.position.trim()) e.position = 'Job title is required';
        }
        if (s === 2) {
            if (formData.password.length < 6) e.password = 'Password must be at least 6 characters';
            if (formData.password !== formData.confirm) e.confirm = 'Passwords do not match';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validate(step)) setStep(s => s + 1); };
    const back = () => { setErrors({}); setStep(s => s - 1); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate(2)) return;
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name, email: formData.email,
                    password: formData.password, position: formData.position,
                    department: formData.department, phone: formData.phone
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Registration failed');
            
            setStatus('success');
            setTimeout(() => {
                login(data.user, data.token);
                toast.success('Welcome to WorkflowPro! 🎉 Your account is ready.');
                navigate('/dashboard');
            }, 800);
        } catch (err) {
            toast.error(err.message);
            setLoading(false);
        }
    };

    const STEPS = ['Personal', 'Role', 'Security'];

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(160deg, #060810 0%, #0b0f1c 50%, #060810 100%)',
            position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif',
        }}>
            <Starfield />
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-25%', left: '-10%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 65%)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 65%)', borderRadius: '50%' }} />
            </div>

            <AnimatePresence mode="wait">
                {status !== 'success' && (
                    <motion.div
                        key="signup-form"
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            width: '100%', maxWidth: '460px', margin: '1rem',
                            background: 'rgba(10,12,22,0.88)', backdropFilter: 'blur(28px)',
                            border: '1px solid rgba(245,158,11,0.12)', borderRadius: '24px',
                            padding: '2.5rem 2.5rem 2.25rem', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', zIndex: 10,
                        }}>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ textAlign: 'center', marginBottom: '2rem' }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        style={{
                            width: '56px', height: '56px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
                        }}
                    >
                        <ShieldCheck size={26} color="white" />
                    </motion.div>
                    <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>
                        Create Account
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                        Step {step + 1} of {STEPS.length} — <span style={{ color: '#F59E0B', fontWeight: 600 }}>{STEPS[step]}</span>
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <StepIndicator current={step} total={STEPS.length} />
                </motion.div>

                <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                        {/* ── Step 0: Personal Info ── */}
                        {step === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.1 }}
                                >
                                    <FloatingInput label="Full Name" value={formData.name} onChange={field('name')} icon={User} error={errors.name} />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                >
                                    <FloatingInput label="Work Email" type="email" value={formData.email} onChange={field('email')} icon={Mail} error={errors.email} />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                >
                                    <FloatingInput label="Phone (optional)" type="tel" value={formData.phone} onChange={field('phone')} icon={Phone} />
                                </motion.div>
                                <motion.button type="button" onClick={next}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.4 }}
                                    whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(245,158,11,0.35)' }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{ width: '100%', marginTop: '0.5rem', padding: '0.9rem', borderRadius: '14px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#111827', fontWeight: 700, fontSize: '1rem', fontFamily: 'Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    Continue <ArrowRight size={17} />
                                </motion.button>
                            </motion.div>
                        )}

                        {/* ── Step 1: Role & Department ── */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.1 }}
                                >
                                    <FloatingInput label="Job Title / Position" value={formData.position} onChange={field('position')} icon={Briefcase} error={errors.position} />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                >
                                    <FloatingInput label="Department (optional)" value={formData.department} onChange={field('department')} icon={Building2} />
                                </motion.div>

                                {/* Role card grid */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                    style={{ marginBottom: '1rem' }}
                                >
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>I work as a…</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                        {ROLES.map((r, idx) => (
                                            <motion.button key={r.id} type="button"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3, delay: 0.35 + idx * 0.05 }}
                                                onClick={() => setFormData(p => ({ ...p, roleCard: r.id, position: p.position || r.label }))}
                                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                                style={{
                                                    padding: '0.65rem 0.4rem', borderRadius: '12px', cursor: 'pointer', fontFamily: 'Inter',
                                                    background: formData.roleCard === r.id ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                                                    border: `1px solid ${formData.roleCard === r.id ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.08)'}`,
                                                    color: formData.roleCard === r.id ? '#F59E0B' : '#6B7280',
                                                    textAlign: 'center', transition: 'all 0.2s',
                                                }}>
                                                <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{r.icon}</div>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>{r.label}</div>
                                                <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>{r.desc}</div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.7 }}
                                    style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}
                                >
                                    <button type="button" onClick={back}
                                        style={{ flex: 1, padding: '0.9rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                    <motion.button type="button" onClick={next}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        style={{ flex: 2, padding: '0.9rem', borderRadius: '14px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#111827', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                        Continue <ArrowRight size={17} />
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* ── Step 2: Password ── */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                                <FloatingInput label="Secure Password" type="password" value={formData.password} onChange={field('password')} icon={Lock} error={errors.password} />

                                {/* Password strength bar */}
                                {formData.password && (
                                    <div style={{ marginBottom: '1rem', marginTop: '-0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '4px', marginBottom: '0.3rem' }}>
                                            {[1,2,3,4].map(i => (
                                                <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= strength ? STRENGTH_COLORS[strength] : 'rgba(255,255,255,0.07)', transition: 'background 0.3s' }} />
                                            ))}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: STRENGTH_COLORS[strength], fontWeight: 600 }}>
                                            {STRENGTH_LABELS[strength]}
                                            {strength < 3 && <span style={{ color: '#4B5563', fontWeight: 400 }}>  · Add uppercase, numbers or symbols</span>}
                                        </div>
                                    </div>
                                )}

                                <FloatingInput label="Confirm Password" type="password" value={formData.confirm} onChange={field('confirm')} icon={Lock} error={errors.confirm} />

                                {/* Match indicator */}
                                {formData.confirm && formData.password && (
                                    <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: formData.password === formData.confirm ? '#10B981' : '#EF4444' }}>
                                        <CheckCircle2 size={12} />
                                        {formData.password === formData.confirm ? 'Passwords match' : 'Passwords do not match'}
                                    </div>
                                )}

                                {/* Terms note */}
                                <div style={{ marginBottom: '1rem', padding: '0.65rem 1rem', borderRadius: '10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', color: '#94A3B8', fontSize: '0.72rem' }}>
                                    By creating an account you agree to our <span style={{ color: '#F59E0B', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ color: '#F59E0B', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="button" onClick={back}
                                        style={{ flex: 1, padding: '0.9rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                    <motion.button type="submit" disabled={loading}
                                        whileHover={!loading ? { scale: 1.02, boxShadow: '0 8px 32px rgba(245,158,11,0.35)' } : {}}
                                        whileTap={!loading ? { scale: 0.98 } : {}}
                                        style={{ flex: 2, padding: '0.9rem', borderRadius: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#111827', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        {loading ? <><Loader2 size={18} className="animate-spin" /> Creating…</> : <>Launch Account <ShieldCheck size={16} /></>}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                {/* Footer */}
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <p style={{ color: '#475569', fontSize: '0.85rem' }}>
                        Already have an account?{' '}
                        <button onClick={() => navigate('/user-login')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F59E0B', fontWeight: 600, padding: 0 }}>
                            Sign In
                        </button>
                    </p>
                </div>
                    </motion.div>
                )}

                {/* ── Success State Animation ── */}
                {status === 'success' && (
                    <motion.div
                        key="success-state"
                        initial={{ opacity: 0, scale: 0.8, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, y: -50 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            width: '100%', maxWidth: '420px', margin: '1rem',
                            background: 'rgba(17, 24, 39, 0.65)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(16,185,129,0.25)',
                            borderRadius: '20px',
                            padding: '4rem 2.5rem',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(16,185,129,0.15)',
                            zIndex: 10,
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.5rem'
                        }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                            style={{
                                width: 60, height: 60, borderRadius: '50%',
                                background: 'rgba(16,185,129,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 30px rgba(16,185,129,0.3)'
                            }}
                        >
                            <Check size={32} color="#10B981" strokeWidth={3} />
                        </motion.div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '0.5rem' }}>
                                Account Created!
                            </h2>
                            <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                                Redirecting to your workspace...
                            </p>
                        </div>
                        <motion.div
                            animate={{ scaleX: [0, 1] }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                            style={{
                                width: '100%', height: 3, borderRadius: '99px',
                                background: 'linear-gradient(90deg, #10B981, #059669)',
                                originX: 0
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Signup;
