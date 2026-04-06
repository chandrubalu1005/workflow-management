import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, FileText, Check, Search, Edit3, Loader, AlertCircle, Sparkles, BookOpen, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || window.location.origin;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const Notes = () => {
    const [notes, setNotes]           = useState([]);
    const [activeNote, setActiveNote] = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [saving, setSaving]         = useState(false);
    const [saved, setSaved]           = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(false);

    // Track whether a save is already in-flight, to prevent concurrent duplicate posts
    const savingRef      = useRef(false);
    const saveTimerRef   = useRef(null);
    // Keep activeNote accessible inside autosave closure without re-registering effect
    const activeNoteRef  = useRef(null);
    activeNoteRef.current = activeNote;

    /* ── Fetch ── */
    const fetchNotes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/api/notes`, { headers: authHeaders() });
            if (!res.ok) throw new Error();
            const data = await res.json();
            const sorted = Array.isArray(data)
                ? data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                : [];
            setNotes(sorted);
            // Select first note but don't auto-create one
            setActiveNote(prev => {
                if (prev?._id) {
                    // keep existing active note if still in list
                    return sorted.find(n => n._id === prev._id) || sorted[0] || null;
                }
                return sorted[0] || null;
            });
        } catch {
            setError('Could not load your notes. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNotes(); }, [fetchNotes]);

    useEffect(() => {
        const socket = io(API);
        socket.on('notes_refresh', () => {
            fetchNotes();
        });
        return () => socket.disconnect();
    }, [fetchNotes]);

    /* ── Autosave: only triggered when content changes, never on mount ── */
    useEffect(() => {
        if (!activeNote) return;
        // Don't autosave if the note has no content and no title at all (avoid blank saves)
        if (!activeNote.content?.trim() && !activeNote.title?.trim()) return;

        // Debounce: clear previous timer
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            // Use ref so we always save the latest state
            doSave(activeNoteRef.current);
        }, 1800);

        return () => clearTimeout(saveTimerRef.current);
    }, [activeNote?.content, activeNote?.title]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Core save logic (shared by autosave + Force Save) ── */
    const doSave = async (note, manual = false) => {
        if (!note) return;
        // Guard: skip if already saving to prevent double-POST
        if (savingRef.current && !manual) return;
        savingRef.current = true;
        setSaving(true);
        setSaved(false);

        try {
            const res = await fetch(`${API}/api/notes`, {
                method: 'POST',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: note._id, title: note.title, content: note.content }),
            });
            if (!res.ok) throw new Error();
            const savedNote = await res.json();

            // Update notes list — replace existing or add new
            setNotes(prev => {
                const exists = prev.find(n => n._id === savedNote._id);
                const updated = exists
                    ? prev.map(n => n._id === savedNote._id ? savedNote : n)
                    : [savedNote, ...prev.filter(n => n._id !== null)]; // remove any ghost null-id entry
                return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            });

            // Promote activeNote from null-id to real note
            setActiveNote(prev =>
                prev && (prev._id === null || prev._id === savedNote._id) ? savedNote : prev
            );

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            // Silently fail autosave; show error only on manual save
        } finally {
            setSaving(false);
            savingRef.current = false;
        }
    };

    /* ── Create: add a local placeholder, save only when user types ── */
    const createNewNote = () => {
        // If there's already an unsaved blank note, just focus it
        const existingBlank = notes.find(n => n._id === null);
        if (existingBlank) {
            setActiveNote(existingBlank);
            return;
        }
        const blank = { _id: null, title: '', content: '', updatedAt: new Date().toISOString() };
        setNotes(prev => [blank, ...prev]);
        setActiveNote(blank);
    };

    /* ── Delete ── */
    const deleteNote = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Delete this note?')) return;

        // Local-only note (never saved)
        if (!id) {
            setNotes(prev => prev.filter(n => n._id !== null));
            setActiveNote(prev => (prev?._id === null ? notes.find(n => n._id !== null) || null : prev));
            return;
        }

        try {
            await fetch(`${API}/api/notes/${id}`, { method: 'DELETE', headers: authHeaders() });
            setNotes(prev => {
                const next = prev.filter(n => n._id !== id);
                setActiveNote(cur => (cur?._id === id ? next[0] || null : cur));
                return next;
            });
        } catch { /* silent */ }
    };

    const filteredNotes = notes.filter(n =>
        (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (n.content || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    /* ── Render ── */
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="notes-container"
        >
            {/* ── Sidebar ── */}
            <div className={`notes-sidebar ${isMobileEditorOpen ? 'hidden-on-mobile' : ''}`} style={{ height: '100%', width: 300 }}>
                <div style={{
                    height: '100%',
                    background: 'rgba(255,255,255,0.025)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 20,
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                {loading && !notes.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                            <Loader size={22} color="#F59E0B" />
                        </motion.div>
                        <p style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>LOADING_NOTES...</p>
                    </div>
                ) : error ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#EF4444' }}>
                        <AlertCircle size={24} style={{ marginBottom: '0.5rem', display: 'inline-block' }} />
                        <p style={{ fontSize: '0.875rem' }}>{error}</p>
                        <button onClick={fetchNotes} style={{ marginTop: '1rem', fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer' }}>Retry</button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '0.65rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', textTransform: 'uppercase' }}>THOUGHTSPACE</h3>
                                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.7rem', color: '#475569', fontFamily: 'JetBrains Mono' }}>{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, background: 'rgba(245,158,11,0.2)', boxShadow: '0 0 16px rgba(245,158,11,0.3)', borderColor: 'rgba(245,158,11,0.5)' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={createNewNote}
                                    title="New Note"
                                    style={{ padding: '0.45rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    <Plus size={16} />
                                </motion.button>
                            </div>
                            {/* Search */}
                            <div style={{ position: 'relative' }}>
                                <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                                <input
                                    placeholder="Search notes…"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', paddingLeft: '2rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', outline: 'none', fontSize: '0.78rem', color: '#CBD5E1', fontFamily: 'JetBrains Mono', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                                />
                            </div>
                        </div>

                        {/* Note list */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0.625rem' }}>
                            <AnimatePresence>
                                {filteredNotes.length === 0 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <BookOpen size={20} color="rgba(245,158,11,0.6)" />
                                        </div>
                                        <div>
                                            <p style={{ margin: '0 0 0.5rem 0', color: '#E2E8F0', fontWeight: 700, fontSize: '0.9rem' }}>No Notes Found</p>
                                            <p style={{ margin: 0, color: '#64748B', fontSize: '0.75rem', lineHeight: 1.5 }}>
                                                {searchTerm ? 'Try a different search term.' : 'Click + to create your first note.'}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                                {filteredNotes.map((note, idx) => {
                                    const isActive = activeNote
                                        ? (note._id ? note._id === activeNote._id : note === activeNote)
                                        : false;
                                    return (
                                        <motion.div
                                            key={note._id || `new-${idx}`}
                                            layout
                                            initial={{ opacity: 0, x: -16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -16 }}
                                            onClick={() => { setActiveNote(note); setIsMobileEditorOpen(true); }}
                                            style={{
                                                padding: '0.875rem', borderRadius: 14, marginBottom: '0.4rem',
                                                background: isActive ? 'rgba(245,158,11,0.1)' : 'transparent',
                                                border: isActive ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
                                                boxShadow: isActive ? '0 0 16px rgba(245,158,11,0.15)' : 'none',
                                                color: isActive ? '#F59E0B' : '#CBD5E1',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                            }}
                                            whileHover={{ background: isActive ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)', boxShadow: '0 0 16px rgba(245,158,11,0.15)' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: isActive ? '#F59E0B' : '#E2E8F0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {note.title?.trim() || note.content?.trim().split('\n')[0] || 'Untitled Note'}
                                                </h4>
                                            </div>
                                            <div style={{ fontSize: '0.68rem', color: isActive ? 'rgba(245,158,11,0.7)' : '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                    {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'Just now'}
                                                </span>
                                                <motion.button
                                                    whileHover={{ color: '#EF4444', scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={e => deleteNote(e, note._id)}
                                                    title="Delete"
                                                    style={{ color: '#374151', padding: '0.2rem', borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                                                >
                                                    <Trash2 size={11} />
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </>
                )}
                </div>
            </div>

            {/* ── Editor ── */}
            <div className={`notes-editor ${isMobileEditorOpen ? '' : 'hidden-on-mobile'}`} style={{ height: '100%', flex: 1 }}>
                <motion.div layout style={{
                    height: '100%', background: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                {activeNote ? (
                    <>
                         {/* Toolbar */}
                        <div style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245,158,11,0.02)', height: 52 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <button
                                    className="mobile-only-btn"
                                    onClick={() => setIsMobileEditorOpen(false)}
                                    style={{ background: 'none', border: 'none', color: '#F59E0B', cursor: 'pointer', padding: '0.2rem', marginRight: '0.5rem' }}
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 8px rgba(245,158,11,0.6)', animation: 'pulse 2s infinite' }} />
                                <AnimatePresence mode="wait">
                                    {saving ? (
                                        <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, fontFamily: 'JetBrains Mono', letterSpacing: '0.05em' }}>
                                            SYNCING...
                                        </motion.span>
                                    ) : saved ? (
                                        <motion.span key="saved" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'JetBrains Mono' }}>
                                            <Check size={11} strokeWidth={3} /> SAVED
                                        </motion.span>
                                    ) : (
                                        <span key="draft" style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'JetBrains Mono' }}>
                                            {activeNote._id ? 'DRAFT_MODE' : 'NEW_NOTE'}
                                        </span>
                                    )}
                                </AnimatePresence>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: '0 0 16px rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.2)', borderColor: 'rgba(245,158,11,0.5)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => doSave(activeNote, true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.875rem', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                <Sparkles size={12} /> FORCE_SAVE
                            </motion.button>
                        </div>

                        {/* Note Title Input */}
                        <div style={{ padding: '2rem 2rem 0.5rem 2rem' }}>
                            <input
                                value={activeNote.title || ''}
                                onChange={e => setActiveNote(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Note Title"
                                style={{
                                    width: '100%', padding: '0', border: 'none', resize: 'none', outline: 'none',
                                    fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em',
                                    color: '#F8FAFC', background: 'transparent', caretColor: '#F59E0B',
                                }}
                            />
                        </div>

                        {/* Textarea */}
                        <textarea
                            value={activeNote.content}
                            onChange={e => setActiveNote(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Start writing your thoughts here…"
                            style={{
                                flex: 1, padding: '1rem 2rem 2rem 2rem', border: 'none', resize: 'none', outline: 'none',
                                fontSize: '1rem', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.8,
                                color: '#CBD5E1', background: 'transparent', caretColor: '#F59E0B',
                            }}
                        />
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0', padding: '2rem' }}>
                        {/* Pulsing ring */}
                        <div style={{ position: 'relative', marginBottom: '2rem' }}>
                            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }} transition={{ duration: 3, repeat: Infinity }}
                                style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.3)' }} />
                            <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0, 0.15] }} transition={{ duration: 3, delay: 0.5, repeat: Infinity }}
                                style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.2)' }} />
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                                style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BookOpen size={28} color="rgba(245,158,11,0.6)" strokeWidth={1.5} />
                            </motion.div>
                        </div>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#94A3B8', marginBottom: '0.4rem', textAlign: 'center' }}>Thoughtspace Empty</p>
                        <p style={{ fontSize: '0.8rem', maxWidth: 240, textAlign: 'center', color: '#475569', lineHeight: 1.6, marginBottom: '0' }}>
                            Capture ideas, meeting notes, and insights in one place.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(245,158,11,0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={createNewNote}
                            style={{ marginTop: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderRadius: 14, background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', color: '#111827', cursor: 'pointer', fontWeight: 800, fontSize: '0.875rem' }}
                        >
                            <Plus size={16} /> New Note
                        </motion.button>
                    </div>
                )}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Notes;
