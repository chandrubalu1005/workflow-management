import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Check, User, Briefcase, AlertCircle } from 'lucide-react';

const UserSelect = ({ users, value, onChange, required = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    const selectedUser = users.find(u => u._id === value);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredUsers = users.filter(user => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (user.name && user.name.toLowerCase().includes(s)) || 
               (user.email && user.email.toLowerCase().includes(s)) ||
               (user.position && user.position.toLowerCase().includes(s));
    });

    const getWorkloadColor = (score) => {
        if (!score && score !== 0) return '#10B981'; // Default Green (Low)
        if (score > 70) return '#EF4444'; // Red (High)
        if (score > 40) return '#F59E0B'; // Yellow/Orange (Medium)
        return '#10B981'; // Green (Low)
    };

    return (
        <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Select Team Member {required && <span style={{ color: 'var(--color-error)' }}>*</span>}</span>
                {selectedUser && selectedUser.workloadScore > 70 && (
                    <span style={{ color: '#EF4444', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <AlertCircle size={10} /> High Workload
                    </span>
                )}
            </label>
            
            {/* Trigger Button */}
            <motion.button
                type="button"
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: isOpen ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: selectedUser ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    boxShadow: isOpen ? '0 0 0 3px rgba(139, 92, 246, 0.15)' : 'none'
                }}
            >
                {selectedUser ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 'bold'
                        }}>
                            {selectedUser.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 500 }}>{selectedUser.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '12px' }}>
                            {selectedUser.position || 'Member'}
                        </span>
                    </div>
                ) : (
                    <span>Choose a user to assign...</span>
                )}
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown size={18} color="var(--color-text-muted)" />
                </motion.div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '0.8rem',
                            backgroundColor: 'var(--bg-raised, #1F2937)',
                            border: '1px solid var(--border-strong, rgba(255,255,255,0.1))',
                            borderRadius: '16px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                            zIndex: 1000,
                            overflow: 'hidden'
                        }}
                    >
                        {/* Search Bar inside dropdown */}
                        <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
                            <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search by name, email, role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                                    backgroundColor: 'rgba(0,0,0,0.25)',
                                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.05))',
                                    borderRadius: '12px',
                                    color: 'var(--text-primary, #F8FAFC)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    fontWeight: 500
                                }}
                                autoFocus  // Focus automatically when opened
                            />
                        </div>

                        {/* List of Users */}
                        <div style={{ maxHeight: '280px', overflowY: 'auto' }} className="scrollbar-thin">
                            {filteredUsers.length === 0 ? (
                                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    No team members found matching "{searchTerm}"
                                </div>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {filteredUsers.map((user) => {
                                        const isSelected = value === user._id;
                                        const workloadColor = getWorkloadColor(user.workloadScore);
                                        
                                        return (
                                            <motion.li
                                                key={user._id}
                                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                                onClick={() => {
                                                    onChange(user._id);
                                                    setIsOpen(false);
                                                    setSearchTerm(''); // Optional reset
                                                }}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                                                    backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                        backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                                        color: isSelected ? 'white' : 'var(--color-text-secondary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.85rem', fontWeight: 'bold',
                                                        border: isSelected ? 'none' : '1px solid var(--color-border)'
                                                    }}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            <span style={{ fontWeight: isSelected ? 600 : 500, color: 'var(--text-primary, #F8FAFC)', fontSize: '0.9rem' }}>
                                                                {user.name}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.15rem' }}>
                                                            {user.position && (
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                                    <Briefcase size={10} /> {user.position}
                                                                </span>
                                                            )}
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                                <User size={10} /> {user.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Workload Indicator & Selection Checkmark */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div
                                                        title={`Current Workload Score: ${user.workloadScore || 0}`}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                            background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px',
                                                            border: '1px solid var(--color-border)'
                                                        }}
                                                    >
                                                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: workloadColor }} />
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)', fontFamily: 'JetBrains Mono, monospace' }}>
                                                            {user.workloadScore || 0} pts
                                                        </span>
                                                    </div>
                                                    {isSelected && <Check size={16} color="var(--brand-primary, #F59E0B)" />}
                                                </div>
                                            </motion.li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserSelect;
