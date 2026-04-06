import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';

const KanbanColumn = ({ id, title, count, children }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    const getColumnColor = (status) => {
        switch (status) {
            case 'pending': return 'var(--color-text-secondary)';
            case 'in-progress': return 'var(--color-primary)';
            case 'review': return '#F59E0B'; // Amber
            case 'completed': return 'var(--color-success)';
            default: return 'var(--color-text-secondary)';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="glass-panel"
            style={{
                flex: 1,
                minWidth: '320px',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: isOver ? 'rgba(245, 158, 11, 0.08)' : 'var(--glass-bg)',
                border: isOver ? '2px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--color-border)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isOver ? '0 0 40px rgba(245, 158, 11, 0.15), inset 0 0 40px rgba(245, 158, 11, 0.05)' : 'none'
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: `2px solid ${getColumnColor(id)}`,
                transition: 'border-color 0.3s ease'
            }}>
                <h3 style={{
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: 'var(--color-text-main)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'color 0.3s ease'
                }}>
                    <motion.span 
                        style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: getColumnColor(id),
                            boxShadow: `0 0 8px ${getColumnColor(id)}`
                        }}
                        animate={{
                            boxShadow: [
                                `0 0 8px ${getColumnColor(id)}`,
                                `0 0 16px ${getColumnColor(id)}`,
                                `0 0 8px ${getColumnColor(id)}`
                            ]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                    {title}
                </h3>
                <motion.span 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{
                        backgroundColor: 'var(--color-bg-main)',
                        backdropFilter: 'blur(4px)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--color-text-main)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'inline-block'
                    }}>
                    {count}
                </motion.span>
            </div>

            <motion.div
                ref={setNodeRef}
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    minHeight: '200px',
                    padding: '0.25rem',
                    borderRadius: '12px',
                    backgroundColor: isOver ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
                    transition: 'all 0.2s ease'
                }}
                animate={{
                    backgroundColor: isOver ? 'rgba(245, 158, 11, 0.06)' : 'transparent'
                }}
            >
                {children}
            </motion.div>
        </motion.div>
    );
};

export default KanbanColumn;
