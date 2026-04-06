import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, Save, Palette, Users, Shield, User, Lock, Bell, Eye, Phone, FileText, Keyboard, Trash2, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { triggerConfetti } from '../../utils/confetti';
import { Shimmer } from '../../components/Shimmer';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

const ADMIN_TABS = [
    { id: 'system', label: 'System Rules', icon: Shield },
    { id: 'roles', label: 'Role Manager', icon: Users },
];

const USER_TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'more', label: 'More', icon: Keyboard },
];

const FieldRow = ({ label, hint, children }) => (
    <div className="settings-field-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.25rem 0', borderBottom: '1px solid var(--border-default)' }}>
        <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{label}</div>
            {hint && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{hint}</div>}
        </div>
        <div style={{ flexShrink: 0, marginLeft: '2rem' }}>{children}</div>
    </div>
);

const SelectField = ({ value, onChange, opts }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: '0.55rem 1rem', borderRadius: '10px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'Inter', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', minWidth: '180px' }}>
        {opts.map(o => <option key={o.v} value={o.v} style={{ background: '#111827', color: '#F8FAFC' }}>{o.l}</option>)}
    </select>
);

const NumberField = ({ value, onChange, min = 1, max = 100 }) => (
    <input type="number" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)}
        style={{ padding: '0.55rem 0.75rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', fontSize: '0.85rem', outline: 'none', width: '100px', textAlign: 'right' }} />
);

const Toggle = ({ value, onChange }) => (
    <motion.div onClick={() => onChange(!value)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        style={{ width: '44px', height: '24px', borderRadius: '12px', background: value ? 'var(--brand-primary)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <motion.div animate={{ x: value ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#111827' }} />
    </motion.div>
);

const Settings = () => {
    const { user, setUser } = useAuth();
    const isAdmin = user?.role === 'admin';
    const TABS = isAdmin ? ADMIN_TABS : USER_TABS;
    const [activeTab, setActiveTab] = useState(isAdmin ? 'system' : 'profile');
    const [newRole, setNewRole] = useState('');
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // User profile form state
    const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', position: user?.position || '', bio: '', phone: '', department: '' });
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [notifPrefs, setNotifPrefs] = useState({ assignment: true, deadline: true, overload: true, team_update: true, system: true, completion: true });
    const [accentColor, setAccentColor] = useState(localStorage.getItem('accentColor') || '#F59E0B');
    const [fontSize, setFontSize] = useState(localStorage.getItem('fontSize') || 'normal');
    const [compactMode, setCompactMode] = useState(localStorage.getItem('compactMode') === 'true');
    const ACCENT_COLORS = ['#F59E0B', '#F97316', '#10B981', '#D97706', '#EF4444', '#64748B', '#EAB308', '#0EA5E9'];

    const fetchSettings = useCallback(async () => {
        if (!isAdmin) { setIsLoading(false); return; }
        try {
            const res = await fetch(`${API}/api/settings`, { headers: headers() });
            if (res.ok) setSettings(await res.json());
        } catch (_) { }
        setIsLoading(false);
    }, [isAdmin]);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const [form, setForm] = useState(null);
    const currentForm = form ?? settings ?? {};

    const save = {
        mutate: async (data) => {
            setIsSaving(true);
            try {
                const res = await fetch(`${API}/api/settings`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
                if (!res.ok) throw new Error('Save failed');
                const saved = await res.json();
                toast.success('Settings saved!');
                triggerConfetti();
                setSettings(saved);
                setForm(null);
            } catch (_) { toast.error('Failed to save settings'); }
            setIsSaving(false);
        }
    };

    const update = (key, val) => setForm(prev => ({ ...(prev ?? settings ?? {}), [key]: val }));

    const addRole = () => {
        if (!newRole.trim()) return;
        const roles = [...(currentForm.customRoles || []), newRole.trim()];
        update('customRoles', roles);
        setNewRole('');
    };

    const removeRole = (r) => update('customRoles', (currentForm.customRoles || []).filter(x => x !== r));

    const saveProfile = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API}/api/users/profile`, { method: 'PUT', headers: headers(), body: JSON.stringify(profileForm) });
            if (!res.ok) throw new Error();
            toast.success('Profile updated!');
            triggerConfetti();
        } catch { toast.error('Failed to update profile'); }
        setIsSaving(false);
    };

    const changePassword = async () => {
        if (pwForm.newPw !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
        if (pwForm.newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setIsSaving(true);
        try {
            const res = await fetch(`${API}/api/auth/change-password`, { method: 'POST', headers: headers(), body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }) });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed'); }
            toast.success('Password changed successfully!');
            setPwForm({ current: '', newPw: '', confirm: '' });
        } catch (e) { toast.error(e.message || 'Failed to change password'); }
        setIsSaving(false);
    };

    const inputStyle = { width: '100%', padding: '0.65rem 1rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'Inter', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };

    if (isAdmin && isLoading) return (
        <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} width="100%" height="40px" borderRadius="12px" />)}
            </div>
            <div style={{ flex: 1, padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Shimmer width="40%" height="24px" />
                <Shimmer width="60%" height="16px" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                            <Shimmer width="140px" height="14px" />
                            <Shimmer width="200px" height="10px" style={{ marginTop: '0.5rem' }} />
                        </div>
                        <Shimmer width="100px" height="32px" borderRadius="8px" />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ paddingBottom: '2rem' }}>
            {/* Cinematic Header */}
            <div className="analytics-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', position: 'relative' }}>
                {/* Ambient glow */}
                <div style={{ position: 'absolute', top: '-120px', left: '-60px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: -1, pointerEvents: 'none' }} />
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.5rem' }}>
                        <div style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', padding: '0.8rem', borderRadius: '16px', display: 'flex', boxShadow: '0 8px 30px rgba(245,158,11,0.3)' }}>
                            <SettingsIcon size={26} color="#111827" />
                        </div>
                        <h1 style={{ fontSize: '2.6rem', fontWeight: 950, color: '#F8FAFC', margin: 0, letterSpacing: '-0.04em' }}>
                            {isAdmin ? 'Control Center' : 'Preferences'}
                        </h1>
                    </div>
                    <p style={{ color: '#F59E0B', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', marginLeft: '0.25rem' }}>
                        MODULE: <strong style={{ color: '#CBD5E1' }}>{isAdmin ? 'SYS_GOVERNANCE' : 'USER_CONFIG'}</strong> // WORKFLOWPRO
                    </p>
                </div>
                {isAdmin && (
                    <motion.button whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(245,158,11,0.4)' }} whileTap={{ scale: 0.97 }}
                        onClick={() => save.mutate(currentForm)}
                        disabled={isSaving}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '14px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', color: '#111827', fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem', opacity: isSaving ? 0.7 : 1, boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
                        <Save size={16} /> {isSaving ? 'Saving…' : 'Save Changes'}
                    </motion.button>
                )}
            </div>

            <div className="settings-container" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
                {/* Tab sidebar */}
                <div className="settings-sidebar" style={{
                    display: 'flex', flexDirection: 'column', gap: '0.3rem',
                    background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px',
                    padding: '0.75rem', height: 'fit-content'
                }}>
                    {TABS.map(tab => (
                        <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            whileHover={{ x: 2 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.75rem 1rem', borderRadius: '12px',
                                border: activeTab === tab.id ? '1px solid rgba(245,158,11,0.25)' : '1px solid transparent',
                                background: activeTab === tab.id ? 'rgba(245,158,11,0.1)' : 'transparent',
                                color: activeTab === tab.id ? '#F59E0B' : '#64748B',
                                cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem',
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                transition: 'all 0.2s', textAlign: 'left',
                                boxShadow: activeTab === tab.id ? '0 0 16px rgba(245,158,11,0.12)' : 'none',
                                position: 'relative', overflow: 'hidden'
                            }}>
                            {activeTab === tab.id && (
                                <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, background: '#F59E0B', borderRadius: '0 2px 2px 0', boxShadow: '0 0 8px rgba(245,158,11,0.6)' }} />
                            )}
                            <tab.icon size={15} />
                            {tab.label}
                        </motion.button>
                    ))}
                </div>

                {/* Panel */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: [0.16,1,0.3,1] }}
                        style={{
                            background: 'rgba(17,24,39,0.75)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(245,158,11,0.15)',
                            borderRadius: '20px', padding: '2rem',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                        }}>

                        {/* ── PROFILE TAB ── */}
                        {activeTab === 'profile' && (
                            <div>
                                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>Profile Settings</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Update your name, email, and personal details</p>

                                {/* Avatar */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--border-default)' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#000', flexShrink: 0 }}>
                                        {user?.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{user?.name}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.email}</div>
                                        <div style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', marginTop: '0.25rem' }}>{user?.role}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Full Name</label>
                                        <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Your full name" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Email</label>
                                        <input value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} placeholder="your@email.com" type="email" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Job Title / Position</label>
                                        <input value={profileForm.position} onChange={e => setProfileForm(p => ({ ...p, position: e.target.value }))} style={inputStyle} placeholder="e.g. Frontend Developer" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Department</label>
                                        <input value={profileForm.department} onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))} style={inputStyle} placeholder="e.g. Engineering" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Phone</label>
                                        <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} style={inputStyle} placeholder="+1 (555) 000-0000" type="tel" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Bio</label>
                                        <textarea value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Tell your team a bit about yourself..." />
                                    </div>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={saveProfile} disabled={isSaving}
                                        style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', borderRadius: '12px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', color: '#111827', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem', width: 'fit-content' }}>
                                        <Save size={15} /> {isSaving ? 'Saving...' : 'Save Profile'}
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        {/* ── SECURITY TAB ── */}
                        {activeTab === 'security' && (
                            <div>
                                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>Security</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Change your password to keep your account secure</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Current Password</label>
                                        <input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} style={inputStyle} placeholder="••••••••" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>New Password</label>
                                        <input type="password" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} style={inputStyle} placeholder="Min. 6 characters" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Confirm New Password</label>
                                        <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} style={inputStyle} placeholder="Re-enter new password" />
                                    </div>
                                    {pwForm.newPw && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                                        <div style={{ color: '#EF4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>⚠ Passwords do not match</div>
                                    )}
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={changePassword} disabled={isSaving || !pwForm.current || !pwForm.newPw}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', borderRadius: '12px', background: 'linear-gradient(135deg, #EF4444, #DC2626)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem', width: 'fit-content', opacity: isSaving || !pwForm.current || !pwForm.newPw ? 0.6 : 1 }}>
                                        <Lock size={15} /> {isSaving ? 'Changing...' : 'Change Password'}
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        {/* ── APPEARANCE TAB ── */}
                        {activeTab === 'appearance' && (
                            <div>
                                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>Appearance</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Customize your WorkflowPro visual experience</p>

                                <FieldRow label="Accent Color" hint="Choose the primary highlight color across the UI">
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {ACCENT_COLORS.map(c => (
                                            <motion.button key={c} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                                onClick={() => { setAccentColor(c); localStorage.setItem('accentColor', c); toast.success('Accent color updated!'); }}
                                                style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: accentColor === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: accentColor === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 0.2s' }} />
                                        ))}
                                    </div>
                                </FieldRow>
                                <FieldRow label="Selected Color" hint={`Current accent: ${accentColor}`}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: accentColor, boxShadow: `0 0 16px ${accentColor}80` }} />
                                </FieldRow>
                                <FieldRow label="Font Size" hint="Adjust text size across the app">
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        {['small', 'normal', 'large'].map(s => (
                                            <button key={s} onClick={() => { setFontSize(s); localStorage.setItem('fontSize', s); document.documentElement.style.setProperty('--base-font-size', s === 'small' ? '13px' : s === 'large' ? '16px' : '14px'); toast.success(`Font size: ${s}`); }}
                                                style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid', fontSize: s === 'small' ? '0.7rem' : s === 'large' ? '0.95rem' : '0.8rem', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600, background: fontSize === s ? 'rgba(245,158,11,0.12)' : 'transparent', borderColor: fontSize === s ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.1)', color: fontSize === s ? '#F59E0B' : '#6B7280', transition: 'all 0.2s', textTransform: 'capitalize' }}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </FieldRow>
                                <FieldRow label="Compact Mode" hint="Reduce spacing and padding throughout the UI">
                                    <Toggle value={compactMode} onChange={v => { setCompactMode(v); localStorage.setItem('compactMode', String(v)); document.body.classList.toggle('compact-mode', v); toast.success(v ? 'Compact mode on' : 'Compact mode off'); }} />
                                </FieldRow>
                                <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', borderRadius: '12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    💡 Accent color changes are saved locally. A full theme engine will be available in a future update.
                                </div>
                            </div>
                        )}

                        {/* ── NOTIFICATION PREFS TAB ── */}
                        {activeTab === 'notifications' && (
                            <div>
                                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>Notification Preferences</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Choose which notifications you'd like to receive</p>

                                {[
                                    { key: 'assignment', label: 'Task Assignments', hint: 'When a new task is assigned to you', color: '#F59E0B' },
                                    { key: 'deadline', label: 'Deadline Reminders', hint: 'Alerts before a task is due', color: '#EF4444' },
                                    { key: 'overload', label: 'Workload Alerts', hint: 'When your workload exceeds threshold', color: '#F59E0B' },
                                    { key: 'team_update', label: 'Team Updates', hint: 'Changes to teams you belong to', color: '#F59E0B' },
                                    { key: 'completion', label: 'Task Completions', hint: 'When tasks you created are completed', color: '#10B981' },
                                    { key: 'system', label: 'System Notifications', hint: 'Platform updates and announcements', color: '#6B7280' },
                                ].map(pref => (
                                    <FieldRow key={pref.key} label={pref.label} hint={pref.hint}>
                                        <Toggle value={notifPrefs[pref.key]} onChange={v => setNotifPrefs(p => ({ ...p, [pref.key]: v }))} />
                                    </FieldRow>
                                ))}
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => { toast.success('Notification preferences saved!'); triggerConfetti(); }}
                                    style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', borderRadius: '12px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', color: '#111827', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem' }}>
                                    <Save size={15} /> Save Preferences
                                </motion.button>
                            </div>
                        )}

                        {/* ── MORE TAB ── */}
                        {activeTab === 'more' && (
                            <div>
                                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>More Options</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Keyboard shortcuts, data export, and account management</p>

                                {/* Keyboard shortcuts */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Keyboard size={15} color="#F59E0B" /> Keyboard Shortcuts</div>
                                    {[
                                        { keys: ['Ctrl', 'K'], desc: 'Open command palette' },
                                        { keys: ['Ctrl', '/'], desc: 'Global search' },
                                        { keys: ['G', 'T'], desc: 'Go to Tasks' },
                                        { keys: ['G', 'P'], desc: 'Go to Projects' },
                                        { keys: ['G', 'D'], desc: 'Go to Dashboard' },
                                        { keys: ['N'], desc: 'Create new task' },
                                        { keys: ['Esc'], desc: 'Close modal / cancel' },
                                    ].map((s, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < 6 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{s.desc}</span>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                {s.keys.map(k => (<kbd key={k} style={{ padding: '0.2rem 0.5rem', borderRadius: '5px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#F1F5F9', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace' }}>{k}</kbd>))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Export data */}
                                <FieldRow label="Export My Data" hint="Download all your tasks, goals & activity as JSON">
                                    <button onClick={() => toast('Data export coming soon', { icon: '📦' })} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.8rem', fontWeight: 600 }}><Download size={14} /> Export</button>
                                </FieldRow>

                                {/* Danger zone */}
                                <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                    <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Trash2 size={14} /> Danger Zone</div>
                                    <p style={{ color: '#6B7280', fontSize: '0.78rem', marginBottom: '0.75rem' }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
                                    <button onClick={() => { if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) toast.error('Account deletion requires admin confirmation.'); }}
                                        style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.8rem', fontWeight: 600 }}>
                                        Delete My Account
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── ADMIN: SYSTEM RULES ── */}
                        {activeTab === 'system' && (
                            <div>
                                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>System Rules</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Configure platform-wide defaults and governance policies</p>

                                <FieldRow label="Default Completion Strategy" hint="Applied when creating new team tasks">
                                    <SelectField value={currentForm.defaultCompletionStrategy || 'synchronous'} onChange={v => update('defaultCompletionStrategy', v)}
                                        opts={[
                                            { v: 'synchronous', l: 'Synchronous (all complete)' },
                                            { v: 'first-to-finish', l: 'First to Finish' },
                                            { v: 'majority', l: 'Majority Vote' },
                                        ]} />
                                </FieldRow>

                                <FieldRow label="Max Team Size" hint="Maximum members per team">
                                    <NumberField value={currentForm.maxTeamSize || 15} onChange={v => update('maxTeamSize', v)} min={2} max={100} />
                                </FieldRow>

                                <FieldRow label="Max Project Members" hint="Max people per project">
                                    <NumberField value={currentForm.maxProjectMembers || 20} onChange={v => update('maxProjectMembers', v)} min={1} max={200} />
                                </FieldRow>

                                <FieldRow label="Workload Threshold (%)" hint="Alert when member exceeds this workload">
                                    <NumberField value={currentForm.workloadThreshold || 80} onChange={v => update('workloadThreshold', v)} min={50} max={100} />
                                </FieldRow>

                                <FieldRow label="Deadline Reminder (days)" hint="Days before deadline to send reminder">
                                    <NumberField value={currentForm.deadlineReminderDays || 2} onChange={v => update('deadlineReminderDays', v)} min={0} max={14} />
                                </FieldRow>

                                <FieldRow label="Allow Self-Assignment" hint="Users can assign tasks to themselves">
                                    <Toggle value={!!currentForm.allowSelfAssign} onChange={v => update('allowSelfAssign', v)} />
                                </FieldRow>

                                <FieldRow label="Require Task Approval" hint="Tasks need admin approval before starting">
                                    <Toggle value={!!currentForm.requireTaskApproval} onChange={v => update('requireTaskApproval', v)} />
                                </FieldRow>

                                <FieldRow label="Organization Name" hint="Displayed throughout the platform">
                                    <input value={currentForm.orgName || ''} onChange={e => update('orgName', e.target.value)}
                                        style={{ padding: '0.55rem 0.75rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'Inter', fontSize: '0.85rem', outline: 'none', width: '200px' }} />
                                </FieldRow>
                            </div>
                        )}

                        {/* ── ADMIN: ROLE MANAGER ── */}
                        {activeTab === 'roles' && (
                            <div>
                                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>Role Manager</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Define job roles available when creating users</p>

                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                    <input value={newRole} onChange={e => setNewRole(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addRole()}
                                        placeholder="Add new role (e.g. QA Engineer)"
                                        style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'Inter', fontSize: '0.875rem', outline: 'none' }} />
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={addRole}
                                        style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', background: 'var(--brand-primary)', border: 'none', color: '#111827', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                        Add Role
                                    </motion.button>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {(currentForm.customRoles || []).map(role => (
                                        <motion.div key={role} initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', fontSize: '0.825rem', fontWeight: 600 }}>
                                            {role}
                                            <button onClick={() => removeRole(role)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F59E0B', lineHeight: 1, padding: 0, display: 'flex' }}>✕</button>
                                        </motion.div>
                                    ))}
                                    {(currentForm.customRoles || []).length === 0 && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No custom roles yet. Add one above.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default Settings;
