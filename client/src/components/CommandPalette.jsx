import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, CheckSquare, FolderOpen, User, FileText, Settings, LayoutDashboard, Plus, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const CommandPalette = ({ isOpen, onClose, navItems = [] }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults(navItems.map(item => ({ ...item, type: 'page' })));
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, navItems]);

    useEffect(() => {
        if (!isOpen) return;
        const debounce = setTimeout(() => {
            searchAll(query);
            setSelectedIndex(0);
        }, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const searchAll = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults(navItems.map(item => ({ ...item, type: 'page' })));
            return;
        }

        const lowerQuery = searchQuery.toLowerCase();

        // 1. Static Pages
        const pageResults = navItems
            .filter(n => n.label.toLowerCase().includes(lowerQuery))
            .map(n => ({ ...n, type: 'page', title: n.label }));

        // 2. Quick Actions
        const actions = [
            { icon: Plus, title: 'Create new task', to: '/tasks?action=new', type: 'action', color: '#10B981' },
            { icon: Plus, title: 'Create new project', to: '/projects?action=new', type: 'action', color: '#F59E0B' }
        ].filter(a => a.title.toLowerCase().includes(lowerQuery));

        // Let's immediately set static/sync results while fetching
        setResults([...actions, ...pageResults]);
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [tasksRes, projectsRes] = await Promise.all([
                fetch(`${API}/api/tasks`, { headers }),
                fetch(`${API}/api/projects`, { headers })
            ]);

            let dbResults = [];

            if (tasksRes.ok) {
                const tasks = await tasksRes.json();
                const matchedTasks = tasks
                    .filter(t => t.title.toLowerCase().includes(lowerQuery))
                    .map(t => ({ id: t._id, title: t.title, type: 'task', icon: CheckSquare, to: `/tasks` })); // Tasks usually open in a modal on /tasks based on url, or just go to tasks
                dbResults = [...dbResults, ...matchedTasks];
            }

            if (projectsRes.ok) {
                const projects = await projectsRes.json();
                const matchedProjects = projects
                    .filter(p => p.name.toLowerCase().includes(lowerQuery))
                    .map(p => ({ id: p._id, title: p.name, type: 'project', icon: FolderOpen, to: `/projects/${p._id}` }));
                dbResults = [...dbResults, ...matchedProjects];
            }

            setResults([...actions, ...pageResults, ...dbResults.slice(0, 8)]); // Limit DB results
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[selectedIndex]) {
                handleSelect(results[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    const handleSelect = (item) => {
        if (item.to) {
            navigate(item.to);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 9000 }} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: -16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -16 }}
                style={{ position: 'fixed', top: '14%', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '600px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '18px', overflow: 'hidden', zIndex: 9001, boxShadow: 'var(--shadow-lg)' }}>

                {/* Search Input */}
                <div style={{ position: 'relative', padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ position: 'absolute', left: '1.8rem', top: '50%', transform: 'translateY(-50%)', zIndex: 1, pointerEvents: 'none' }}>
                        {loading ? <Loader size={18} className="spinner" color="var(--brand-primary)" /> : <Search size={18} color="var(--brand-primary)" />}
                    </div>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search tasks, projects, or type a command... (Ctrl+K)"
                        className="search-input"
                        style={{ paddingLeft: '44px', paddingRight: '40px', fontSize: '0.95rem' }}
                    />
                    <button onClick={onClose} style={{ position: 'absolute', right: '1.8rem', top: '50%', transform: 'translateY(-50%)', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: '4px' }}>
                        <X size={14} />
                    </button>
                </div>

                {/* Results List */}
                <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.5rem' }}>
                    {results.length === 0 && !loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--color-text-muted)' }}>
                            <Search size={32} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <div style={{ fontSize: '0.95rem' }}>No results found for "{query}"</div>
                        </div>
                    ) : (
                        results.map((item, index) => {
                            const IconComponent = item.icon || FileText;
                            const isSelected = selectedIndex === index;

                            return (
                                <motion.div
                                    key={item.id || item.to || index}
                                    onClick={() => handleSelect(item)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.875rem',
                                        padding: '0.75rem 1rem', borderRadius: '10px',
                                        background: isSelected ? 'var(--sidebar-hover)' : 'transparent',
                                        borderLeft: isSelected ? '3px solid var(--brand-primary)' : '3px solid transparent',
                                        cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s', fontFamily: 'Inter'
                                    }}
                                    onMouseMove={() => setSelectedIndex(index)}
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: item.color ? `${item.color}15` : 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <IconComponent size={16} color={item.color || 'var(--brand-primary)'} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'var(--color-text-main)', fontWeight: isSelected ? 600 : 500, fontSize: '0.9rem' }}>{item.title}</div>
                                        {item.to && <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>{item.to}</div>}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', background: 'var(--bg-overlay)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                                        {item.type}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Footer hints */}
                <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-raised)', display: 'flex', gap: '1.25rem' }}>
                    {[
                        ['↑↓', 'Navigate'],
                        ['↵', 'Select'],
                        ['Esc', 'Close']
                    ].map(([k, v]) => (
                        <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                            <kbd style={{ padding: '0.15rem 0.4rem', borderRadius: '5px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--color-text-secondary)', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{k}</kbd> {v}
                        </span>
                    ))}
                </div>
            </motion.div>
        </>
    );
};

export default CommandPalette;
