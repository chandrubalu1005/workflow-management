import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Briefcase, Calendar, Award, UserPlus, ChevronDown } from 'lucide-react';
import MagneticButton from './MagneticButton';

const AddUserForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        age: '',
        position: '',
        role: 'normal',
        yearsOfExperience: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create user');
            }

            toast.success('User account created successfully! 🎉');

            setFormData({
                name: '',
                email: '',
                age: '',
                position: '',
                role: 'normal',
                yearsOfExperience: '',
                password: ''
            });

            if (onSuccess) onSuccess();

        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    const inputFocus = { scale: 1.01, borderColor: 'var(--color-primary)' };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lux-card"
            style={{
                maxWidth: '850px',
                margin: '2rem auto',
                padding: '3rem',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Subtle Gradient Glow */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none'
            }} />
            <div style={{ marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2rem' }}>
                <h2 style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    marginBottom: '0.6rem',
                    letterSpacing: '-0.04em',
                    color: 'var(--color-text-main)',
                    fontFamily: 'var(--wp-font)'
                }}>
                    Create New Account
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', opacity: 0.8 }}>
                    Provision enterprise-grade credentials for a new workforce member.
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' }}>

                {/* Main Details Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <motion.div variants={itemVariants} className="form-group">
                        <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block', color: 'var(--color-text-muted)' }}>Full Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <motion.input
                                whileFocus={inputFocus}
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                                required
                                placeholder="Enter full name"
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="form-group">
                        <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block', color: 'var(--color-text-muted)' }}>Email Address <span style={{ color: 'var(--color-error)' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <motion.input
                                whileFocus={inputFocus}
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                                required
                                placeholder="name@company.com"
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="form-group">
                        <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block', color: 'var(--color-text-muted)' }}>Password <span style={{ color: 'var(--color-error)' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <motion.input
                                whileFocus={inputFocus}
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                                required
                                placeholder="Set initial password"
                                minLength={6}
                            />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginLeft: '0.25rem' }}>Minimum 6 characters.</p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <motion.div variants={itemVariants} className="form-group">
                            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block', color: 'var(--color-text-muted)' }}>Job Title <span style={{ color: 'var(--color-error)' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <Briefcase size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                <motion.input
                                    whileFocus={inputFocus}
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    className="form-input"
                                    style={{ paddingLeft: '3rem' }}
                                    required
                                    placeholder="e.g. Designer"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="form-group">
                            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block', color: 'var(--color-text-muted)' }}>System Role <span style={{ color: 'var(--color-error)' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <motion.select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="form-input"
                                    style={{
                                        appearance: 'none', paddingLeft: '1rem',
                                        backgroundColor: 'var(--bg-surface)', color: 'var(--color-text-main)'
                                    }}
                                >
                                    <option value="normal" style={{ background: 'var(--bg-surface)', color: 'var(--color-text-main)' }}>Normal User</option>
                                    <option value="admin" style={{ background: 'var(--bg-surface)', color: 'var(--color-text-main)' }}>System Admin</option>
                                </motion.select>
                                <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Secondary Details Column */}
                <div className="glass-panel" style={{
                    padding: '2rem',
                    height: 'fit-content',
                }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--color-text-main)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', fontFamily: 'var(--wp-font)', letterSpacing: '-0.01em' }}>
                        Profile Metadata
                    </h4>

                    <motion.div variants={itemVariants} className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block', color: 'var(--color-text-muted)' }}>Age</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <motion.input
                                whileFocus={inputFocus}
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="Age"
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="form-group">
                        <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block', color: 'var(--color-text-muted)' }}>Experience (Years)</label>
                        <div style={{ position: 'relative' }}>
                            <Award size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <motion.input
                                whileFocus={inputFocus}
                                type="number"
                                name="yearsOfExperience"
                                value={formData.yearsOfExperience}
                                onChange={handleChange}
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="Years"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Submit Action */}
                <motion.div
                    variants={itemVariants}
                    style={{ gridColumn: '1 / -1', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}
                >
                    <MagneticButton strength={0.2}>
                        <motion.button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 2.5rem', height: '3.5rem', fontSize: '1rem' }}
                            whileTap={{ scale: 0.98 }}
                            animate={!loading ? { boxShadow: ['0 0 0px var(--wp-violet-glow)', '0 0 20px var(--wp-violet-glow)', '0 0 0px var(--wp-violet-glow)'] } : {}}
                            transition={!loading ? { repeat: Infinity, duration: 4 } : {}}
                        >
                            {loading ? 'Creating Account...' : (
                                <>
                                    <UserPlus size={18} /> Deploy Account
                                </>
                            )}
                        </motion.button>
                    </MagneticButton>
                </motion.div>

            </form>
        </motion.div>
    );
};

export default AddUserForm;
