import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        fetchLogs();
    }, [currentPage, actionFilter, sortBy, sortOrder]);

    // Use a separate effect for searchTerm to debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) setCurrentPage(1);
            else fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = new URL(`${import.meta.env.VITE_API_URL}/api/logs`);
            url.searchParams.append('page', currentPage);
            url.searchParams.append('limit', 50);
            url.searchParams.append('sortBy', sortBy);
            url.searchParams.append('sortOrder', sortOrder);
            if (searchTerm) url.searchParams.append('search', searchTerm);
            if (actionFilter !== 'all') url.searchParams.append('action', actionFilter);

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.logs) {
                setLogs(data.logs);
                setTotal(data.total);
                setPages(data.pages);
            } else {
                setLogs(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to load logs', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs; // Server side filtering now

    const handleSort = (column) => {
        if (sortBy === column) {
            // Toggle sort order if clicking the same column
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new column and default to ascending
            setSortBy(column);
            setSortOrder('asc');
        }
        setCurrentPage(1); // Reset to first page when sorting changes
    };

    const SortHeader = ({ column, label }) => (
        <th 
            onClick={() => handleSort(column)}
            style={{ 
                padding: '0.875rem 1rem', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                fontSize: '0.65rem', 
                letterSpacing: '0.08em',
                cursor: 'pointer',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: sortBy === column ? '#F59E0B' : '#374151',
                transition: 'color 0.2s'
            }}
        >
            {label}
            {sortBy === column && (
                <span style={{ fontSize: '0.75rem' }}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
            )}
        </th>
    );

    if (loading) return (
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.08)', borderTopColor: '#F59E0B', animation: 'spin 1s linear infinite' }}></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#374151' }} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.6rem', paddingBottom: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', outline: 'none', color: '#CBD5E1', fontSize: '0.875rem', fontFamily: 'Inter' }}
                    />
                </div>
                <div style={{ position: 'relative', minWidth: '180px' }}>
                    <Filter size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#374151', zIndex: 1, pointerEvents: 'none' }} />
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.6rem', paddingBottom: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', outline: 'none', color: '#CBD5E1', fontSize: '0.875rem', fontFamily: 'Inter', appearance: 'none', cursor: 'pointer' }}
                    >
                        <option value="all" style={{ background: '#111827' }}>All Actions</option>
                        <option value="USER_LOGIN" style={{ background: '#111827' }}>User Login</option>
                        <option value="CREATE_TASK" style={{ background: '#111827' }}>Create Task</option>
                        <option value="UPDATE_TASK" style={{ background: '#111827' }}>Update Task</option>
                        <option value="DELETE_TASK" style={{ background: '#111827' }}>Delete Task</option>
                        <option value="CREATE_USER" style={{ background: '#111827' }}>Create User</option>
                    </select>
                </div>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', color: '#374151', background: 'rgba(255,255,255,0.02)' }}>
                            <SortHeader column="createdAt" label="Timestamp" />
                            <SortHeader column="user.name" label="User" />
                            <SortHeader column="action" label="Action" />
                            <th style={{ padding: '0.875rem 1rem', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.08em' }}>Details</th>
                            <th style={{ padding: '0.875rem 1rem', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.08em' }}>IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map((log, index) => {
                            let details = log.details;
                            // Safety check: if it's already an object, don't parse. If string, try parse.
                            if (typeof details === 'string') {
                                try { details = JSON.parse(log.details); } catch (e) { }
                            }

                            const displayDetails = typeof details === 'object' && details !== null ?
                                Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(', ') :
                                String(log.details || '');

                            return (
                                <motion.tr
                                    layout
                                    key={log._id || index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                >
                                    <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#CBD5E1', fontSize: '0.8rem' }}>
                                        {log.user?.name || 'System'}
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '6px',
                                            background: 'rgba(245,158,11,0.1)',
                                            color: '#C084FC',
                                            fontFamily: 'JetBrains Mono, monospace',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            border: '1px solid rgba(245,158,11,0.2)',
                                            display: 'inline-block'
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', color: '#4B5563', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                        {displayDetails}
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', color: '#374151', fontFamily: 'JetBrains Mono, monospace' }}>
                                        {log.ipAddress}
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredLogs.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#374151', fontSize: '0.875rem' }}>
                        No activity logs match your filters.
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        disabled={currentPage === 1 || loading}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: currentPage === 1 ? '#4B5563' : '#CBD5E1', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        Previous
                    </button>
                    <span style={{ color: '#4B5563', fontSize: '0.875rem' }}>
                        Page {currentPage} of {pages}
                    </span>
                    <button
                        disabled={currentPage === pages || loading}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: currentPage === pages ? '#4B5563' : '#CBD5E1', cursor: currentPage === pages ? 'not-allowed' : 'pointer' }}
                    >
                        Next
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default ActivityLogs;
