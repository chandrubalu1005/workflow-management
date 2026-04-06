import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Clock, Trash2, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

export const TaskComments = ({ taskId, projectId, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments();
    }, [taskId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`${API}/api/comments/${taskId}`, { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Failed to load comments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await fetch(`${API}/api/comments/${taskId}`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ content: newComment, projectId })
            });
            if (!res.ok) throw new Error('Failed to post comment');
            const newCommentData = await res.json();
            setComments([newCommentData, ...comments]);
            setNewComment('');
        } catch (error) {
            toast.error('Could not post comment');
        }
    };

    const handleDelete = async (commentId) => {
        try {
            const res = await fetch(`${API}/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error('Failed');
            setComments(comments.filter(c => c._id !== commentId));
            toast.success('Comment deleted');
        } catch (error) {
            toast.error('Failed to delete comment');
        }
    };

    return (
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(245,158,11,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                <MessageSquare size={14} color="#F59E0B" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
                    Discussion
                </span>
            </div>

            {/* Input form */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.8rem',
                        color: 'var(--color-text-main)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!newComment.trim()}
                    style={{
                        background: 'rgba(245,158,11,0.15)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        color: '#F59E0B',
                        borderRadius: '8px',
                        padding: '0 1rem',
                        cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: newComment.trim() ? 1 : 0.5
                    }}
                >
                    <Send size={16} />
                </motion.button>
            </form>

            {/* Comments List */}
            {loading ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Loading comments...</div>
            ) : comments.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem 0', background: 'rgba(0,0,0,0.1)', borderRadius: 8 }}>
                    No comments yet. Start the discussion!
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    <AnimatePresence>
                        {comments.map((comment) => (
                            <motion.div
                                key={comment._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '10px',
                                    padding: '0.8rem',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: '#F59E0B', color: '#000',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.65rem', fontWeight: 'bold'
                                        }}>
                                            {comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : <User size={12} />}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                            {comment.author?.name || 'Unknown User'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <Clock size={10} />
                                            {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {/* Allow author or admin to delete */}
                                        {(currentUser?.id === comment.author?._id || currentUser?.role === 'admin') && (
                                            <Trash2
                                                size={12}
                                                color="#EF4444"
                                                style={{ cursor: 'pointer', opacity: 0.7 }}
                                                onClick={() => handleDelete(comment._id)}
                                                className="hover:opacity-100"
                                            />
                                        )}
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                    {comment.content}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
