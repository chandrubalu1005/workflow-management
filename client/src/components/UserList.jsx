import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, MoreVertical, Key, LogOut, UserMinus, UserCheck,
    Activity, Edit, ChevronRight, Mail, Shield, User as UserIcon,
    AlertTriangle, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const UserList = ({ refreshTrigger }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [menuOpenId, setMenuOpenId] = useState(null);

    // Filter & Sort States
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals
    const [resetModal, setResetModal] = useState({ open: false, userId: null, userName: '', password: '' });
    const [logsModal, setLogsModal] = useState({ open: false, userId: null, userName: '', logs: [] });
    const [editModal, setEditModal] = useState({ open: false, user: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, userId: null, userName: '' });
    const [actionLoading, setActionLoading] = useState(false);
    const [tempPassword, setTempPassword] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [refreshTrigger]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId, action, data = {}) => {
        setActionLoading(true);
        const token = localStorage.getItem('token');
        try {
            let url = `${import.meta.env.VITE_API_URL}/api/users/${userId}`;
            let method = 'POST';

            if (action === 'logout') url += '/force-logout';
            else if (action === 'status') {
                url += '/toggle-status';
                method = 'PATCH';
            }
            else if (action === 'reset') {
                url = `${import.meta.env.VITE_API_URL}/api/users/reset-password`;
                data = { userId, ...data };
                method = 'POST';
            }
            else if (action === 'delete') {
                method = 'DELETE';
            }
            else if (action === 'update') {
                method = 'PUT';
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Action failed');

            if (action === 'reset' && result.tempPassword) {
                setTempPassword(result.tempPassword);
            } else {
                toast.success(result.message || 'Action completed successfully');
                fetchUsers(); // Refresh for all actions that modify data
                setResetModal({ open: false, userId: null, userName: '', password: '' });
                setEditModal({ open: false, user: null });
                setDeleteModal({ open: false, userId: null, userName: '' });
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActionLoading(false);
            setMenuOpenId(null);
        }
    };

    const fetchLogs = async (userId, userName) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setLogsModal({ open: true, userId, userName, logs: data });
        } catch (err) {
            toast.error('Failed to fetch activity logs');
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'all' || (user.status || 'active') === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <Loader2 className="animate-spin" size={40} color="var(--color-primary)" />
        </div>
    );

    return (
        <div style={{ padding: '0' }}>
            {/* Table Header / Filters */}
            <div style={{
                padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.01)'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        placeholder="Search by name or email..."
                        className="form-input"
                        style={{ paddingLeft: '2.75rem', height: '3rem', background: 'rgba(255,255,255,0.03)' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="form-input"
                    style={{ width: '160px', height: '3rem', cursor: 'pointer' }}
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="normal">Normal Users</option>
                </select>
                <select
                    className="form-input"
                    style={{ width: '160px', height: '3rem', cursor: 'pointer' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '1.25rem 2rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>User</th>
                            <th style={{ padding: '1.25rem 2rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Role</th>
                            <th style={{ padding: '1.25rem 2rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Workload</th>
                            <th style={{ padding: '1.25rem 2rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '1.25rem 2rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="hover:bg-white/[0.02]">
                                <td style={{ padding: '1.25rem 2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '14px', background: 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800,
                                                overflow: 'hidden', position: 'relative', zIndex: 1, border: '2px solid rgba(245,158,11,0.3)',
                                            }}>
                                                {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                                                    <div style={{ background: 'linear-gradient(135deg, #F59E0B, #B45309)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Avatar Glow */}
                                            <div style={{ position: 'absolute', inset: -4, background: '#F59E0B', filter: 'blur(8px)', opacity: 0.3, zIndex: 0, borderRadius: '14px' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem 2rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700,
                                        background: user.role === 'admin' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                        color: user.role === 'admin' ? '#F59E0B' : '#60A5FA',
                                        border: `1px solid ${user.role === 'admin' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                        textShadow: user.role === 'admin' ? '0 0 10px rgba(245,158,11,0.3)' : 'none'
                                    }}>
                                        {user.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1.25rem 2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', width: '80px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                                            <motion.div 
                                                initial={{ width: 0 }} whileInView={{ width: `${user.workloadScore || 30}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: 'easeOut' }}
                                                style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #FBBF24, #D97706)', boxShadow: '0 0 10px rgba(245,158,11,0.5)' }} 
                                            />
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{user.workloadScore || 30}%</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem 2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: (user.status || 'active') === 'active' ? '#10B981' : '#EF4444',
                                            boxShadow: `0 0 8px ${(user.status || 'active') === 'active' ? '#10B981' : '#EF4444'}`
                                        }} />
                                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', textTransform: 'capitalize' }}>{user.status || 'active'}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem 2rem', textAlign: 'right', position: 'relative' }}>
                                    <button
                                        onClick={() => setMenuOpenId(menuOpenId === user._id ? null : user._id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.5rem' }}
                                    >
                                        <MoreVertical size={18} />
                                    </button>

                                    <AnimatePresence>
                                        {menuOpenId === user._id && (
                                            <>
                                                <div
                                                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                                                    onClick={() => setMenuOpenId(null)}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    style={{
                                                        position: 'absolute', right: '2rem', top: '3.5rem', zIndex: 50,
                                                        background: '#1F2937', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', width: '200px', padding: '0.5rem',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <MenuButton icon={Edit} label="Edit User" onClick={() => setEditModal({ open: true, user })} color="var(--color-text-main)" />
                                                    <MenuButton icon={Key} label="Reset Password" onClick={() => setResetModal({ open: true, userId: user._id, userName: user.name })} color="#F59E0B" />
                                                    <MenuButton icon={LogOut} label="Force Logout" onClick={() => handleAction(user._id, 'logout')} color="#EF4444" />
                                                    <MenuButton
                                                        icon={(user.status || 'active') === 'active' ? UserMinus : UserCheck}
                                                        label={(user.status || 'active') === 'active' ? "Disable Account" : "Enable Account"}
                                                        onClick={() => handleAction(user._id, 'status', { status: (user.status || 'active') === 'active' ? 'disabled' : 'active' })}
                                                        color={(user.status || 'active') === 'active' ? "#EF4444" : "#10B981"}
                                                    />
                                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.4rem 0' }} />
                                                    <MenuButton icon={UserMinus} label="Delete User" onClick={() => setDeleteModal({ open: true, userId: user._id, userName: user.name })} color="#DC2626" />
                                                    <MenuButton icon={Activity} label="View Activity Logs" onClick={() => fetchLogs(user._id, user.name)} color="#60A5FA" />
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Change Password Panel */}
            <AnimatePresence>
                {resetModal.open && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ x: '100%', opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{ background: 'rgba(15,23,42,0.95)', borderLeft: '1px solid rgba(245,158,11,0.2)', padding: '2.5rem', width: '100%', maxWidth: '440px', height: '100%', boxShadow: '-20px 0 40px rgba(0,0,0,0.5)' }}
                        >
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>Change Password</h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
                                Enter a new password for account: <strong style={{color: '#F59E0B'}}>{resetModal.userName}</strong>
                            </p>

                            <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>NEW PASSWORD</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Min 6 characters..."
                                        value={resetModal.password}
                                        onChange={(e) => setResetModal({ ...resetModal, password: e.target.value })}
                                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>
                                
                                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        onClick={() => handleAction(resetModal.userId, 'reset', { mode: 'manual', password: resetModal.password })}
                                        disabled={actionLoading || !resetModal.password}
                                        className="btn-primary"
                                        style={{ height: '3.5rem', opacity: (!resetModal.password || actionLoading) ? 0.5 : 1, width: '100%' }}
                                    >
                                        {actionLoading ? 'Updating Sequence...' : 'Force Password Update'}
                                    </button>
                                    <button
                                        onClick={() => setResetModal({ open: false, userId: null, userName: '', password: '' })}
                                        style={{ padding: '0.875rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
                                    >
                                        Cancel Protocol
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Activities modal... */}

            {/* Edit User Panel */}
            <AnimatePresence>
                {editModal.open && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ x: '100%', opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{ background: 'rgba(15,23,42,0.95)', borderLeft: '1px solid rgba(245,158,11,0.2)', padding: '2.5rem', width: '100%', maxWidth: '500px', height: '100%', boxShadow: '-20px 0 40px rgba(0,0,0,0.5)', overflowY: 'auto' }}
                        >
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', color: '#fff' }}>Edit Identity Matrix</h3>
                            <EditUserForm
                                user={editModal.user}
                                onCancel={() => setEditModal({ open: false, user: null })}
                                onSubmit={(data) => handleAction(editModal.user._id, 'update', data)}
                                loading={actionLoading}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Panel */}
            <AnimatePresence>
                {deleteModal.open && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ x: '100%', opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{ background: 'linear-gradient(135deg, rgba(30,20,20,0.95), rgba(15,10,10,0.95))', borderLeft: '1px solid rgba(239,68,68,0.3)', padding: '2.5rem', width: '100%', maxWidth: '440px', height: '100%', boxShadow: '-20px 0 40px rgba(239,68,68,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                        >
                            <div style={{ color: '#EF4444', marginBottom: '1.5rem', background: 'rgba(239,68,68,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.4))' }}>
                                <AlertTriangle size={40} />
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#fff', letterSpacing: '-0.02em' }}>Terminate Record?</h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '3rem', fontSize: '1rem', lineHeight: 1.6 }}>
                                This will permanently erase <strong style={{color: '#EF4444'}}>{deleteModal.userName}</strong> and all associated system data. This action cannot be reversed.
                            </p>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <button onClick={() => handleAction(deleteModal.userId, 'delete')} style={{ width: '100%', padding: '1.25rem', background: '#EF4444', border: 'none', color: '#fff', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}>Acknowledge & Terminate</button>
                                <button onClick={() => setDeleteModal({ open: false, userId: null, userName: '' })} style={{ width: '100%', padding: '1.25rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>Abort Deletion</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const EditUserForm = ({ user, onCancel, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        position: user.position || '',
        role: user.role,
        yearsOfExperience: user.yearsOfExperience || 0,
        status: user.status || 'active'
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>FULL NAME</label>
                <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>EMAIL</label>
                <input className="form-input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>POSITION</label>
                    <input className="form-input" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>ROLE</label>
                    <select className="form-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                        <option value="normal">Normal</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>EXPERIENCE (YRS)</label>
                    <input className="form-input" type="number" value={formData.yearsOfExperience} onChange={e => setFormData({ ...formData, yearsOfExperience: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>STATUS</label>
                    <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={onCancel} style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '1rem', background: 'var(--color-primary)', border: 'none', color: '#fff', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    {loading ? 'Saving...' : 'Update User'}
                </button>
            </div>
        </form>
    );
};

const MenuButton = ({ icon: Icon, label, onClick, color }) => (
    <button
        onClick={onClick}
        style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1rem',
            background: 'none', border: 'none', color, cursor: 'pointer', borderRadius: '8px',
            fontSize: '0.85rem', fontWeight: 600, transition: 'background 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseOut={e => e.currentTarget.style.background = 'none'}
    >
        <Icon size={16} /> {label}
    </button>
);

export default UserList;
