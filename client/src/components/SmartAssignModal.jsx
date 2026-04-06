import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, User, X, Check, Zap, RotateCcw } from 'lucide-react';

/**
 * SmartAssignModal — Command-K style workforce selector
 * 
 * Props:
 *   isOpen        - boolean
 *   onClose       - () => void
 *   onSelect      - ({ type, targetId, targetName, strategy }) => void
 *   currentValue  - { type, targetId } | null
 */
const SmartAssignModal = ({ isOpen, onClose, onSelect, currentValue }) => {
    const [search, setSearch] = useState('');
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [strategy, setStrategy] = useState('synchronous');
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'teams' | 'individuals'
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRole, setSelectedRole] = useState('All');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchData();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const base = import.meta.env.VITE_API_URL;

            const [teamsRes, usersRes] = await Promise.all([
                fetch(`${base}/api/teams`, { headers }),
                fetch(`${base}/api/users`, { headers })
            ]);

            const teamsData = await teamsRes.json();
            const usersData = await usersRes.json();

            setTeams(Array.isArray(teamsData) ? teamsData : []);
            setUsers(Array.isArray(usersData) ? usersData.filter(u => u.role !== 'admin') : []);
        } catch (e) {
            console.error('SmartAssign: Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const roles = ['All', ...new Set(users.map(u => u.position).filter(Boolean))];

    const sortedUsers = users
        .filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.position?.toLowerCase().includes(search.toLowerCase());
            const matchesRole = selectedRole === 'All' || u.position === selectedRole;
            return matchesSearch && matchesRole;
        })
        .sort((a, b) => {
            // Smart Rank: (Workload * 2) - Experience
            const aScore = ((a.workloadScore || 0) * 2) - (a.yearsOfExperience || 0);
            const bScore = ((b.workloadScore || 0) * 2) - (b.yearsOfExperience || 0);
            return aScore - bScore;
        });

    const filtered = {
        teams: teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase())),
        users: sortedUsers
    };

    const handleSelect = (type, target) => {
        onSelect({
            type,
            targetId: target._id,
            targetName: type === 'team' ? target.name : target.name,
            strategy: type === 'team' ? strategy : undefined
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9998,
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        style={{
                            position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
                            width: '520px', maxHeight: '60vh', zIndex: 9999,
                            background: 'rgba(15,18,25,0.95)', backdropFilter: 'blur(24px)',
                            border: '1px solid rgba(245,158,11,0.15)',
                            borderRadius: '20px', overflow: 'hidden',
                            boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                        }}
                    >
                        {/* Search Bar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid rgba(255,255,255,0.06)'
                        }}>
                            <Search size={18} color="#F59E0B" />
                            <input
                                ref={inputRef}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search teams or people..."
                                style={{
                                    flex: 1, background: 'none', border: 'none', outline: 'none',
                                    color: '#E2E8F0', fontSize: '0.95rem', fontFamily: 'Inter'
                                }}
                            />
                            {search && (
                                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                                    <X size={16} />
                                </button>
                            )}
                            <div style={{
                                padding: '0.2rem 0.5rem', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.06)', color: '#4B5563',
                                fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace',
                                cursor: 'pointer'
                            }} onClick={() => setShowFilters(!showFilters)}>
                                {showFilters ? 'Hide Filters' : 'Filters'}
                            </div>
                        </div>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: 'hidden', padding: '0 1.25rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                >
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem' }}>
                                        {roles.map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setSelectedRole(role)}
                                                style={{
                                                    padding: '0.3rem 0.75rem', borderRadius: '20px',
                                                    border: '1px solid',
                                                    borderColor: selectedRole === role ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)',
                                                    background: selectedRole === role ? 'rgba(245,158,11,0.15)' : 'transparent',
                                                    color: selectedRole === role ? '#FBBF24' : '#64748B',
                                                    fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Tab Bar */}
                        <div style={{
                            display: 'flex', gap: '0.25rem', padding: '0.5rem 1.25rem',
                            borderBottom: '1px solid rgba(255,255,255,0.04)'
                        }}>
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'teams', label: 'Teams', icon: <Users size={13} /> },
                                { key: 'individuals', label: 'People', icon: <User size={13} /> }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    style={{
                                        padding: '0.35rem 0.75rem', borderRadius: '8px',
                                        border: 'none', cursor: 'pointer',
                                        background: activeTab === tab.key ? 'rgba(245,158,11,0.15)' : 'transparent',
                                        color: activeTab === tab.key ? '#FBBF24' : '#64748B',
                                        fontSize: '0.8rem', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Results */}
                        <div style={{ overflowY: 'auto', maxHeight: '320px', padding: '0.5rem' }}>
                            {loading ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#4B5563' }}>
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                        <RotateCcw size={20} />
                                    </motion.div>
                                </div>
                            ) : (
                                <>
                                    {/* Teams Section */}
                                    {(activeTab === 'all' || activeTab === 'teams') && filtered.teams.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <div style={{
                                                padding: '0.5rem 0.75rem', color: '#4B5563',
                                                fontSize: '0.65rem', textTransform: 'uppercase',
                                                letterSpacing: '0.08em', fontWeight: 700
                                            }}>
                                                Teams
                                            </div>
                                            {filtered.teams.map(team => (
                                                <motion.button
                                                    key={team._id}
                                                    whileHover={{ backgroundColor: 'rgba(245,158,11,0.08)' }}
                                                    onClick={() => handleSelect('team', team)}
                                                    style={{
                                                        width: '100%', padding: '0.6rem 0.75rem',
                                                        borderRadius: '10px', border: 'none',
                                                        background: currentValue?.targetId === team._id ? 'rgba(245,158,11,0.12)' : 'transparent',
                                                        cursor: 'pointer', display: 'flex',
                                                        alignItems: 'center', gap: '0.75rem',
                                                        transition: 'all 0.15s'
                                                    }}
                                                >
                                                    {/* Team badge */}
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '10px',
                                                        background: `${team.color || '#F59E0B'}22`,
                                                        border: `1px solid ${team.color || '#F59E0B'}44`,
                                                        display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', fontSize: '1rem', flexShrink: 0
                                                    }}>
                                                        {team.icon || '👥'}
                                                    </div>

                                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                                        <div style={{ color: '#E2E8F0', fontSize: '0.875rem', fontWeight: 600 }}>
                                                            {team.name}
                                                        </div>
                                                        <div style={{ color: '#4B5563', fontSize: '0.75rem' }}>
                                                            {team.members?.length || 0}/{team.maxCapacity || 10} members
                                                        </div>
                                                    </div>

                                                    {/* Capacity indicator */}
                                                    <div style={{ width: '40px', textAlign: 'right' }}>
                                                        <div style={{
                                                            width: '100%', height: '4px', borderRadius: '2px',
                                                            background: 'rgba(255,255,255,0.06)',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                height: '100%', borderRadius: '2px',
                                                                width: `${((team.members?.length || 0) / (team.maxCapacity || 10)) * 100}%`,
                                                                background: ((team.members?.length || 0) / (team.maxCapacity || 10)) > 0.8 ? '#EF4444' : team.color || '#F59E0B',
                                                                transition: 'width 0.3s'
                                                            }} />
                                                        </div>
                                                    </div>

                                                    {currentValue?.targetId === team._id && (
                                                        <Check size={16} color="#F59E0B" />
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Individuals Section */}
                                    {(activeTab === 'all' || activeTab === 'individuals') && filtered.users.length > 0 && (
                                        <div>
                                            <div style={{
                                                padding: '0.5rem 0.75rem', color: '#4B5563',
                                                fontSize: '0.65rem', textTransform: 'uppercase',
                                                letterSpacing: '0.08em', fontWeight: 700
                                            }}>
                                                People
                                            </div>
                                            {filtered.users.map((user, idx) => (
                                                <motion.button
                                                    key={user._id}
                                                    whileHover={{ backgroundColor: 'rgba(245,158,11,0.08)' }}
                                                    onClick={() => handleSelect('individual', user)}
                                                    style={{
                                                        width: '100%', padding: '0.6rem 0.75rem',
                                                        borderRadius: '10px', border: 'none',
                                                        background: currentValue?.targetId === user._id ? 'rgba(245,158,11,0.12)' : 'transparent',
                                                        cursor: 'pointer', display: 'flex',
                                                        alignItems: 'center', gap: '0.75rem',
                                                        transition: 'all 0.15s'
                                                    }}
                                                >
                                                    {/* Avatar */}
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                                                        display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', color: '#fff',
                                                        fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                                                        overflow: 'hidden', position: 'relative'
                                                    }}>
                                                        {user.avatar ? (
                                                            <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            user.name?.charAt(0).toUpperCase()
                                                        )}
                                                        {/* Online/Availability Dot */}
                                                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: (user.workloadScore || 0) < 30 ? '#10B981' : (user.workloadScore || 0) < 70 ? '#F59E0B' : '#EF4444', border: '2px solid #0F1219' }} />
                                                    </div>

                                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ color: '#E2E8F0', fontSize: '0.875rem', fontWeight: 600 }}>
                                                                {user.name}
                                                            </div>
                                                            {idx === 0 && search === '' && selectedRole === 'All' && (
                                                                <div style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>Recommended</div>
                                                            )}
                                                        </div>
                                                        <div style={{ color: '#4B5563', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span>{user.position || 'Specialist'}</span>
                                                            {user.yearsOfExperience > 0 && <span>• {user.yearsOfExperience}y exp</span>}
                                                        </div>
                                                    </div>

                                                    {/* Workload Indicator (Circular/Ring) */}
                                                    <div style={{ position: 'relative', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <svg width="32" height="32" viewBox="0 0 32 32">
                                                            <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                                            <circle
                                                                cx="16" cy="16" r="14" fill="none"
                                                                stroke={(user.workloadScore || 0) > 70 ? '#EF4444' : (user.workloadScore || 0) > 30 ? '#F59E0B' : '#10B981'}
                                                                strokeWidth="3"
                                                                strokeDasharray="88"
                                                                strokeDashoffset={88 - (88 * (user.workloadScore || 0) / 100)}
                                                                strokeLinecap="round"
                                                                transform="rotate(-90 16 16)"
                                                                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                                            />
                                                        </svg>
                                                        <span style={{ position: 'absolute', fontSize: '0.6rem', fontWeight: 700, color: (user.workloadScore || 0) > 70 ? '#EF4444' : '#64748B' }}>
                                                            {user.workloadScore || 0}%
                                                        </span>
                                                    </div>

                                                    {currentValue?.targetId === user._id && (
                                                        <Check size={16} color="#F59E0B" />
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Empty State */}
                                    {filtered.teams.length === 0 && filtered.users.length === 0 && (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#4B5563' }}>
                                            <Search size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                            <p style={{ fontSize: '0.875rem' }}>No results for "{search}"</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Strategy Footer (when team tab active or team selected) */}
                        {(activeTab === 'teams' || activeTab === 'all') && teams.length > 0 && (
                            <div style={{
                                padding: '0.75rem 1.25rem',
                                borderTop: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex', alignItems: 'center', gap: '0.75rem'
                            }}>
                                <span style={{ color: '#4B5563', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                                    Team Strategy
                                </span>
                                <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
                                    {[
                                        { key: 'synchronous', label: 'All Members', icon: <Users size={12} />, desc: 'Everyone works on it' },
                                        { key: 'first-to-finish', label: 'Race Mode', icon: <Zap size={12} />, desc: 'First done wins' },
                                        { key: 'majority', label: 'Majority Rules', icon: <Check size={12} />, desc: 'Vote-based completion' }
                                    ].map(s => (
                                        <button
                                            key={s.key}
                                            onClick={() => setStrategy(s.key)}
                                            style={{
                                                flex: 1, padding: '0.4rem 0.5rem', borderRadius: '8px',
                                                border: strategy === s.key ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                                background: strategy === s.key ? 'rgba(245,158,11,0.1)' : 'transparent',
                                                color: strategy === s.key ? '#FBBF24' : '#64748B',
                                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                gap: '0.35rem', transition: 'all 0.15s'
                                            }}
                                        >
                                            {s.icon} {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SmartAssignModal;
