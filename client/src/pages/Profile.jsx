import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Briefcase, Calendar, Award, Shield, Check, Edit3, Save, X,
    Loader, Camera, LogOut, Lock, Sun, Moon, Link, Github, Linkedin,
    CheckCircle, Clock, Zap, TrendingUp, Activity, Star, ChevronRight,
    BarChart2, Target, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import TiltContainer from '../components/TiltContainer';

const API = import.meta.env.VITE_API_URL;

// ─── helpers ─────────────────────────────────────────────────────────────────
const parseUA = (ua = '') => {
    if (!ua) return 'Unknown Device';
    if (ua.includes('Chrome')) return '🖥️ Chrome on ' + (ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'Mac' : 'Linux');
    if (ua.includes('Firefox')) return '🖥️ Firefox on ' + (ua.includes('Windows') ? 'Windows' : 'Linux');
    if (ua.includes('Safari')) return '🍎 Safari on Mac';
    return '🖥️ Web Browser';
};

const timeAgo = (d) => {
    if (!d) return '';
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
};

const ACTION_MAP = {
    TASK_CREATED: { label: 'Created task', color: '#F59E0B' },
    TASK_COMPLETED: { label: 'Completed task', color: '#10B981' },
    TASK_DELETED: { label: 'Deleted task', color: '#EF4444' },
    POINTS_AWARDED: { label: 'Earned reward points', color: '#F59E0B' },
    GOAL_COMPLETED: { label: 'Completed a goal', color: '#10B981' },
    TASK_DECOMPOSED: { label: 'Decomposed task', color: '#F59E0B' },
    USER_CREATED: { label: 'Added new user', color: '#F59E0B' },
};

const PRIORITY_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#10B981', urgent: '#DC2626' };

// ─── sub-components ──────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <TiltContainer intensity={15} style={{ height: '100%' }}>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px ${color}25` }}
            style={{
                background: 'rgba(17,24,39,0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${color}18`,
                borderRadius: '18px', padding: '1.5rem',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                transition: 'border-color 0.3s',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                height: '100%', boxSizing: 'border-box'
            }}
        >
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 12px ${color}20` }}>
                <Icon size={20} color={color} />
            </div>
            <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            </div>
        </motion.div>
    </TiltContainer>
);

// ─── main component ───────────────────────────────────────────────────────────
const Profile = () => {
    const { user, updateUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [logs, setLogs] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [passData, setPassData] = useState({ oldPassword: '', newPassword: '' });
    const [avatarHover, setAvatarHover] = useState(false);
    const [activityFilter, setActivityFilter] = useState('all');

    const [formData, setFormData] = useState({
        name: '', bio: '', yearsOfExperience: 0, status: 'active',
        linkedin: '', github: '', portfolio: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                bio: user.bio || '',
                yearsOfExperience: user.yearsOfExperience || 0,
                status: user.status || 'active',
                linkedin: user.linkedin || '',
                github: user.github || '',
                portfolio: user.portfolio || '',
            });
        }
    }, [user]);

    // Fetch user tasks + recent logs
    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const fetchData = async () => {
            setDataLoading(true);
            try {
                const [tasksRes, logsRes] = await Promise.all([
                    fetch(`${API}/api/tasks`, { headers }),
                    user.role === 'admin' ? fetch(`${API}/api/logs?limit=8`, { headers }) : Promise.resolve({ ok: false }),
                ]);
                if (tasksRes.ok) {
                    const raw = await tasksRes.json();
                    const all = Array.isArray(raw) ? raw : raw.tasks || [];
                    const mine = user.role === 'admin' ? all : all.filter(t =>
                        t.assignedTo?._id === user._id || t.assignedTo === user._id
                    );
                    setTasks(mine);
                }
                if (logsRes.ok) {
                    const raw = await logsRes.json();
                    const allLogs = raw.logs || [];
                    // For non-admins, filter own logs
                    const mine = user.role === 'admin'
                        ? allLogs
                        : allLogs.filter(l => l.user?._id === user._id || l.user === user._id);
                    setLogs(mine.slice(0, 8));
                }
            } catch (_) { }
            setDataLoading(false);
        };
        fetchData();
    }, [user]);

    if (!user) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Loading profile…</motion.div>
        </div>
    );

    const isAdmin = user.role === 'admin';

    // Stats derived from tasks
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const totalPoints = user.totalRewardPoints || 0;
    const total = tasks.length;
    const onTimeRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const activeTasks = tasks.filter(t => t.status !== 'completed').slice(0, 4);

    // Profile completion
    const completionFields = [user.avatar, user.name, user.email, user.yearsOfExperience > 0, user.position, user.bio];
    const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/users/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({
                    name: formData.name,
                    bio: formData.bio,
                    linkedin: formData.linkedin,
                    github: formData.github,
                    portfolio: formData.portfolio,
                    ...(isAdmin && { yearsOfExperience: parseInt(formData.yearsOfExperience), status: formData.status })
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Update failed');
            updateUser(data.user);
            toast.success('Profile updated! ✨');
            setIsEditing(false);
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    };

    const handleCancel = () => {
        setFormData({
            name: user.name || '', bio: user.bio || '',
            yearsOfExperience: user.yearsOfExperience || 0, status: user.status || 'active',
            linkedin: user.linkedin || '', github: user.github || '', portfolio: user.portfolio || ''
        });
        setIsEditing(false);
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('avatar', file);
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/users/avatar`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: fd
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            updateUser({ avatar: data.avatar });
            toast.success('Avatar updated!');
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPassLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(passData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast.success('Password changed!');
            setPassData({ oldPassword: '', newPassword: '' });
            setShowPasswordModal(false);
        } catch (err) { toast.error(err.message); }
        finally { setPassLoading(false); }
    };

    const inputStyle = {
        width: '100%', padding: '0.65rem 0.9rem', borderRadius: '12px',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        border: '1px solid var(--border-default)', color: 'var(--text-primary)',
        fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif', outline: 'none',
        boxSizing: 'border-box', transition: 'border-color 0.2s'
    };

    const labelStyle = {
        display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.4rem'
    };

    const sectionCard = {
        background: 'rgba(17,24,39,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(245,158,11,0.12)',
        padding: '1.75rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>

            {/* ── HEADER ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-default)', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>My Profile</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage your identity, performance & preferences</p>
                    {/* Completion bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Profile {completionPct}%</span>
                        <div style={{ width: '180px', height: '4px', background: 'var(--border-default)', borderRadius: '4px', overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                                style={{ height: '100%', borderRadius: '4px', background: completionPct === 100 ? '#10B981' : 'linear-gradient(90deg,#F59E0B,#FBBF24)' }} />
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Theme Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={toggleTheme}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem',
                            borderRadius: '12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                            fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
                            background: 'rgba(245,158,11,0.08)',
                            border: '1px solid rgba(245,158,11,0.25)',
                            color: isDark ? '#FBBF24' : '#F59E0B',
                        }}
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        <motion.div
                            key={isDark ? 'moon' : 'sun'}
                            initial={{ rotate: -30, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        </motion.div>
                        {isDark ? 'Light Mode' : 'Dark Mode'}
                    </motion.button>

                    {/* Edit / Save / Cancel */}
                    {!isEditing ? (
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => setIsEditing(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif' }}>
                            <Edit3 size={16} /> Edit Profile
                        </motion.button>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button onClick={handleCancel} disabled={loading}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif' }}>
                                <X size={16} /> Cancel
                            </button>
                            <button onClick={handleSave} disabled={loading}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg,#F59E0B,#D97706)', border: 'none', color: '#111827', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif', opacity: loading ? 0.7 : 1 }}>
                                {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── STATS ROW ───────────────────────────────────────────── */}
            <div className="profile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
                <StatCard icon={CheckCircle} label="Tasks Completed" value={completed} color="#10B981" delay={0} />
                <StatCard icon={Clock} label="In Progress" value={inProgress} color="#F59E0B" delay={0.06} />
                <StatCard icon={Star} label="Reward Points" value={totalPoints} color="#F59E0B" delay={0.12} />
                <StatCard icon={Target} label="On-Time Rate" value={`${onTimeRate}%`} color="#F59E0B" delay={0.18} />
            </div>

            {/* ── MAIN GRID ───────────────────────────────────────────── */}
            <div className="profile-main-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>

                {/* ── LEFT: IDENTITY CARD ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Avatar + Basic Info */}
                    <TiltContainer intensity={15} style={{ height: '100%' }}>
                        <motion.div
                            animate={{ borderColor: isEditing ? 'rgba(245,158,11,0.5)' : 'var(--border-default)', boxShadow: isEditing ? '0 0 40px rgba(245,158,11,0.12)' : 'none' }}
                            style={{ ...sectionCard, textAlign: 'center', padding: '2rem 1.75rem', transition: 'all 0.4s', height: '100%', boxSizing: 'border-box' }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.25rem' }}>
                            {/* Glow ring */}
                            <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#D97706)', opacity: 0.5, filter: 'blur(8px)', zIndex: 0 }} />
                            <motion.label htmlFor="avatar-upload"
                                onMouseEnter={() => setAvatarHover(true)}
                                onMouseLeave={() => setAvatarHover(false)}
                                style={{ width: '110px', height: '110px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 900, color: '#111827', background: 'linear-gradient(135deg,#F59E0B,#FBBF24)', cursor: isEditing ? 'pointer' : 'default', overflow: 'hidden', position: 'relative', zIndex: 1, border: '3px solid var(--bg-card)' }}>
                                {user.avatar ? (
                                    <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    user.name?.charAt(0)?.toUpperCase() || '?'
                                )}
                                <AnimatePresence>
                                    {isEditing && avatarHover && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                            <Camera size={22} color="white" />
                                            <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: 700 }}>Change</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.label>
                            {isEditing && <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />}
                            {/* Online dot */}
                            <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '14px', height: '14px', borderRadius: '50%', background: '#10B981', border: '2px solid var(--glass-bg)', zIndex: 2 }} />
                        </div>

                        {/* Name */}
                        {isEditing ? (
                            <input type="text" name="name" value={formData.name}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                style={{ ...inputStyle, textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}
                                placeholder="Your Name" autoFocus />
                        ) : (
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{user.name}</h2>
                        )}
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.75rem' }}>{user.position || 'Team Member'}</p>

                        {/* Role badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem', borderRadius: '999px', background: isAdmin ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', border: isAdmin ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.2)' }}>
                            <Shield size={12} color={isAdmin ? '#EF4444' : '#F59E0B'} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: isAdmin ? '#EF4444' : '#F59E0B' }}>{user.role}</span>
                        </div>

                        {/* Info rows */}
                        <div style={{ marginTop: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Mail size={15} color="var(--brand-primary)" />
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{user.email}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Award size={15} color="#F59E0B" />
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    {user.yearsOfExperience} yrs exp · {user.yearsOfExperience > 5 ? 'Senior' : user.yearsOfExperience > 2 ? 'Mid-level' : 'Junior'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Calendar size={15} color="#10B981" />
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Check size={15} color="#10B981" />
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    Last login {timeAgo(user.lastLogin)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Activity size={15} color="#F59E0B" />
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {parseUA(user.deviceInfo)}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                    </TiltContainer>

                    {/* Social / Professional Links */}
                    <TiltContainer intensity={15} style={{ height: '100%' }}>
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ ...sectionCard, height: '100%', boxSizing: 'border-box' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Link size={16} color="var(--brand-primary)" /> Professional Links
                        </h3>
                        {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[
                                    { key: 'linkedin', icon: Linkedin, placeholder: 'linkedin.com/in/you', color: '#0A66C2', label: 'LinkedIn' },
                                    { key: 'github', icon: Github, placeholder: 'github.com/username', color: '#fff', label: 'GitHub' },
                                    { key: 'portfolio', icon: Globe, placeholder: 'yoursite.com', color: '#10B981', label: 'Portfolio' },
                                ].map(({ key, icon: Icon, placeholder, color, label }) => (
                                    <div key={key}>
                                        <label style={labelStyle}>{label}</label>
                                        <div style={{ position: 'relative' }}>
                                            <Icon size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color }} />
                                            <input type="url" value={formData[key]} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                                                placeholder={placeholder}
                                                style={{ ...inputStyle, paddingLeft: '2.25rem', fontSize: '0.8rem' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {[
                                    { href: user.linkedin, icon: Linkedin, label: 'LinkedIn', color: '#0A66C2' },
                                    { href: user.github, icon: Github, label: 'GitHub', color: isDark ? '#fff' : '#1a1a1a' },
                                    { href: user.portfolio, icon: Globe, label: 'Portfolio', color: '#10B981' },
                                ].map(({ href, icon: Icon, label, color }) => (
                                    href ? (
                                        <a key={label} href={href.startsWith('http') ? href : `https://${href}`} rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-default)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem', transition: 'background 0.2s' }}
                                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                                            <Icon size={14} color={color} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{href.replace(/^https?:\/\//, '')}</span>
                                            <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                                        </a>
                                    ) : (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px dashed var(--border-default)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            <Icon size={14} color={color} />
                                            <span>Add {label} link</span>
                                        </div>
                                    )
                                ))}
                                {!user.linkedin && !user.github && !user.portfolio && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                                        Click <strong>Edit Profile</strong> to add your links
                                    </p>
                                )}
                            </div>
                        )}
                    </motion.div>
                    </TiltContainer>

                    {/* Security */}
                    <TiltContainer intensity={15} style={{ height: '100%' }}>
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ ...sectionCard, height: '100%', boxSizing: 'border-box' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={16} color="var(--brand-primary)" /> Security
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <button onClick={() => setShowPasswordModal(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '12px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Outfit, sans-serif', width: '100%' }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(245,158,11,0.13)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(245,158,11,0.07)'}>
                                <Lock size={15} /> Change Password
                            </button>
                            <button onClick={logout}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '12px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Outfit, sans-serif', width: '100%' }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.13)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}>
                                <LogOut size={15} /> Logout
                            </button>
                        </div>
                        </motion.div>
                    </TiltContainer>
                </div>

                {/* ── RIGHT COLUMN ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* About / Bio */}
                    <TiltContainer intensity={15} style={{ height: '100%' }}>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={{ ...sectionCard, height: '100%', boxSizing: 'border-box' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} color="var(--brand-primary)" /> About Me
                        </h3>
                        {isEditing ? (
                            <textarea rows={4} value={formData.bio} onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                                placeholder="Write a short professional bio — your expertise, goals, and what you bring to the team…"
                                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, minHeight: '100px' }} />
                        ) : (
                            user.bio ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{user.bio}</p>
                            ) : (
                                <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border-default)', borderRadius: '12px' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No bio yet. Click <strong>Edit Profile</strong> to add one.</p>
                                </div>
                            )
                        )}
                    </motion.div>
                    </TiltContainer>

                    {/* Active Tasks */}
                    <TiltContainer intensity={15} style={{ height: '100%' }}>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} style={{ ...sectionCard, height: '100%', boxSizing: 'border-box' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BarChart2 size={16} color="#F59E0B" /> Current Tasks
                        </h3>
                        {dataLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[1, 2, 3].map(i => <div key={i} style={{ height: '52px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />)}
                            </div>
                        ) : activeTasks.length === 0 ? (
                            <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border-default)', borderRadius: '12px' }}>
                                <CheckCircle size={28} color="#10B981" style={{ marginBottom: '0.5rem' }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>All caught up! No active tasks.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {activeTasks.map(t => (
                                    <div key={t._id} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem',
                                        borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-default)',
                                        transition: 'background 0.2s'
                                    }}
                                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PRIORITY_COLOR[t.priority] || '#6B7280', flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                                {t.endDate ? `Due ${new Date(t.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No deadline'}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: '999px', background: t.status === 'in-progress' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)', color: t.status === 'in-progress' ? '#F59E0B' : 'var(--text-muted)', flexShrink: 0 }}>
                                            {t.status === 'in-progress' ? 'Active' : t.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                    </TiltContainer>

                    {/* Recent Activity */}
                    <TiltContainer intensity={15} style={{ height: '100%' }}>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ ...sectionCard, height: '100%', boxSizing: 'border-box' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Zap size={16} color="#F59E0B" /> Recent Activity
                        </h3>

                        {/* Activity filter tabs */}
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'task', label: 'Tasks' },
                                { key: 'goal', label: 'Goals' },
                                { key: 'system', label: 'System' },
                            ].map(f => (
                                <button key={f.key} onClick={() => setActivityFilter(f.key)}
                                    style={{ padding: '0.3rem 0.7rem', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.2s', background: activityFilter === f.key ? 'rgba(245,158,11,0.12)' : 'transparent', borderColor: activityFilter === f.key ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.1)', color: activityFilter === f.key ? '#F59E0B' : '#6B7280' }}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        {dataLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />)}
                            </div>
                        ) : logs.length === 0 ? (
                            <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border-default)', borderRadius: '12px' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activity yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {logs
                                    .filter(log => {
                                        if (activityFilter === 'all') return true;
                                        if (activityFilter === 'task') return log.action?.includes('TASK');
                                        if (activityFilter === 'goal') return log.action?.includes('GOAL');
                                        if (activityFilter === 'system') return log.action?.includes('USER') || log.action?.includes('SYSTEM');
                                        return true;
                                    })
                                    .map((log, idx, arr) => {
                                    let details = {};
                                    try { details = JSON.parse(log.details || '{}'); } catch (_) { }
                                    const info = ACTION_MAP[log.action] || { label: log.action?.toLowerCase().replace(/_/g, ' ') || 'action', color: '#6B7280' };
                                    const target = details.title || details.taskTitle || '';
                                    const who = log.user?.name || 'System';
                                    return (
                                        <div key={log._id || idx} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.7rem 0',
                                            borderBottom: idx < arr.length - 1 ? '1px solid var(--border-default)' : 'none'
                                        }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${info.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: info.color }}>{who.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontWeight: 700 }}>{who}</span>
                                                    {' '}<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{info.label}</span>
                                                    {target && <> <span style={{ color: info.color, fontWeight: 600 }}>{target}</span></>}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>{timeAgo(log.createdAt)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                    </TiltContainer>

                    {/* Reward Points + Experience */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <TiltContainer intensity={15} style={{ height: '100%' }}>
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                                style={{ ...sectionCard, textAlign: 'center', background: 'linear-gradient(135deg, rgba(251,191,36,0.06), rgba(245,158,11,0.03))', border: '1px solid rgba(251,191,36,0.15)', height: '100%', boxSizing: 'border-box' }}>
                            <Star size={28} color="#F59E0B" style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>{totalPoints}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reward Points</div>
                            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {totalPoints >= 500 ? '🏆 Legendary' : totalPoints >= 200 ? '🥇 Expert' : totalPoints >= 50 ? '🥈 Skilled' : '🥉 Rising Star'}
                            </div>
                            </motion.div>
                        </TiltContainer>
                        <TiltContainer intensity={15} style={{ height: '100%' }}>
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                style={{ ...sectionCard, textAlign: 'center', background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(217,119,6,0.03))', border: '1px solid rgba(245,158,11,0.15)', height: '100%', boxSizing: 'border-box' }}>
                            <TrendingUp size={28} color="#F59E0B" style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>{user.yearsOfExperience || 0}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Years Experience</div>
                            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {(user.yearsOfExperience || 0) > 8 ? '🎖️ Expert' : (user.yearsOfExperience || 0) > 4 ? '⭐ Senior' : (user.yearsOfExperience || 0) > 1 ? '📈 Mid-level' : '🌱 Junior'}
                            </div>
                            </motion.div>
                        </TiltContainer>
                    </div>
                </div>
            </div>

            {/* ── CHANGE PASSWORD MODAL ─────────────────────────────── */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                        onClick={() => setShowPasswordModal(false)}>
                        <motion.div initial={{ scale: 0.94, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: isDark ? '#0F172A' : '#fff', border: '1px solid var(--border-default)', padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: '420px', margin: '1rem', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <Lock size={28} color="#F59E0B" />
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Change Password</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.4rem' }}>Update your account security credentials</p>
                            </div>
                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={labelStyle}>Current Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input type="password" required value={passData.oldPassword} onChange={e => setPassData(p => ({ ...p, oldPassword: e.target.value }))}
                                            style={{ ...inputStyle, paddingLeft: '2.5rem' }} placeholder="••••••••" />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input type="password" required value={passData.newPassword} onChange={e => setPassData(p => ({ ...p, newPassword: e.target.value }))}
                                            style={{ ...inputStyle, paddingLeft: '2.5rem' }} placeholder="Min. 8 characters" />
                                    </div>
                                </div>
                                <button type="submit" disabled={passLoading}
                                    style={{ padding: '0.85rem', borderRadius: '12px', background: 'linear-gradient(135deg,#F59E0B,#D97706)', border: 'none', color: '#111827', fontWeight: 800, fontSize: '0.95rem', cursor: passLoading ? 'not-allowed' : 'pointer', opacity: passLoading ? 0.7 : 1, fontFamily: 'Outfit, sans-serif' }}>
                                    {passLoading ? 'Updating…' : 'Update Password'}
                                </button>
                                <button type="button" onClick={() => setShowPasswordModal(false)}
                                    style={{ padding: '0.65rem', borderRadius: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Outfit, sans-serif' }}>
                                    Cancel
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Profile;
