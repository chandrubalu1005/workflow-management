import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Tabs = ({ tabs, activeTab, onTabChange }) => {
    const [internalActive, setInternalActive] = useState(0);

    // Use controlled prop if present, otherwise internal state
    const currentTab = activeTab !== undefined ? activeTab : internalActive;

    const handleTabChange = (index) => {
        if (onTabChange) {
            onTabChange(index);
        } else {
            setInternalActive(index);
        }
    };

    return (
        <div>
            {/* Tab Headers */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginBottom: '2rem',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '1px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none'
                }}>
                {tabs.map((tab, index) => {
                    const isActive = currentTab === index;
                    return (
                        <motion.button
                            key={index}
                            onClick={() => handleTabChange(index)}
                            whileHover={{ y: -2 }}
                            whileTap={{ y: 0 }}
                            style={{
                                padding: '0.875rem 1.5rem',
                                background: 'transparent',
                                border: 'none',
                                color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                                fontSize: '0.95rem',
                                fontWeight: isActive ? '600' : '500',
                                cursor: 'pointer',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.color = 'var(--color-text-main)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                                }
                            }}
                        >
                            {tab.label}

                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    initial={{ scaleX: 0.8, opacity: 0 }}
                                    animate={{ scaleX: 1, opacity: 1 }}
                                    exit={{ scaleX: 0.8, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '-1px',
                                        left: 0,
                                        right: 0,
                                        height: '2px',
                                        backgroundColor: 'var(--color-primary)',
                                        borderRadius: '4px 4px 0 0'
                                    }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </motion.div>

            {/* Tab Content */}
            <motion.div style={{ position: 'relative' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.4 }}
                    >
                        {tabs[currentTab] && tabs[currentTab].content}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default Tabs;
