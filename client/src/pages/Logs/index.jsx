import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, Calendar, ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Filter, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Shimmer } from '../../components/Shimmer';
import DatePicker from '../../components/DatePicker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API = import.meta.env.VITE_API_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const getActionColor = (actionName) => {
    const name = (actionName || '').toLowerCase();
    if (name.includes('create') || name.includes('complete') || name.includes('login') || name.includes('approve') || name.includes('register')) return '#10B981';
    if (name.includes('delete') || name.includes('logout') || name.includes('remove') || name.includes('disable')) return '#EF4444';
    if (name.includes('update') || name.includes('assign') || name.includes('edit')) return '#F59E0B';
    return '#6B7280';
};

const SkeletonRow = () => (
    <tr>
        <td style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <Shimmer width="100px" height="14px" />
        </td>
        <td style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shimmer width="26px" height="26px" borderRadius="50%" />
                <Shimmer width="80px" height="14px" />
            </div>
        </td>
        <td style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <Shimmer width="60px" height="24px" borderRadius="6px" />
        </td>
        <td style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <Shimmer width="120px" height="14px" />
        </td>
        <td style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <Shimmer width="180px" height="14px" />
        </td>
    </tr>
);

const ActivityLogs = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const exportExcel = async () => {
        try {
            const params = new URLSearchParams({ page: 1, limit: 10000 });
            if (search) params.set('search', search);
            if (actionFilter) params.set('action', actionFilter);
            if (dateFrom) params.set('from', dateFrom);
            if (dateTo) params.set('to', dateTo);
            params.set('sortBy', sortBy);
            params.set('sortOrder', sortOrder);
            const res = await fetch(`${API}/api/logs?${params}`, { headers: headers() });
            const dataToExport = await res.json();
            const allLogs = dataToExport.logs || [];

            const exportData = allLogs.map(log => ({
                Timestamp: new Date(log.createdAt || log.timestamp).toLocaleString(),
                User: log.user?.name || log.performedBy?.name || 'System',
                Action: log.action,
                Target: `${log.targetType ? log.targetType + ':' : ''} ${log.targetName || log.entity || '—'}`.trim(),
                Details: log.details || log.description || '—'
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Activity Logs");
            XLSX.writeFile(workbook, "Activity_Logs.xlsx");
        } catch (error) {
            console.error("Failed to export Excel", error);
        }
    };

    const exportPDF = async () => {
        try {
            const params = new URLSearchParams({ page: 1, limit: 10000 });
            if (search) params.set('search', search);
            if (actionFilter) params.set('action', actionFilter);
            if (dateFrom) params.set('from', dateFrom);
            if (dateTo) params.set('to', dateTo);
            params.set('sortBy', sortBy);
            params.set('sortOrder', sortOrder);
            const res = await fetch(`${API}/api/logs?${params}`, { headers: headers() });
            const dataToExport = await res.json();
            const allLogs = dataToExport.logs || [];

            const doc = new jsPDF('l', 'mm', 'a4'); 
            doc.setFontSize(16);
            doc.text("Activity Logs Audit", 14, 15);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

            const tableColumn = ["Timestamp", "User", "Action", "Target", "Details"];
            const tableRows = [];

            allLogs.forEach(log => {
                const logData = [
                    new Date(log.createdAt || log.timestamp).toLocaleString(),
                    log.user?.name || log.performedBy?.name || 'System',
                    log.action,
                    `${log.targetType ? log.targetType + ':' : ''} ${log.targetName || log.entity || '—'}`.trim(),
                    log.details || log.description || '—'
                ];
                tableRows.push(logData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 28,
                styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 245] }
            });

            doc.save(`Activity_Logs_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error("Failed to export PDF", error);
        }
    };

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({ page, limit: 20 });
                // FOOLPROOF BACKEND SYNC: Pass action via search to guarantee regex match regardless of node restart
                let actualSearch = search;
                if (actionFilter) {
                    actualSearch = actualSearch ? `${actualSearch} ${actionFilter}` : actionFilter;
                    params.set('action', actionFilter); 
                }
                if (actualSearch) params.set('search', actualSearch);
                
                if (dateFrom) params.set('from', dateFrom);
                if (dateTo) params.set('to', dateTo);
                
                params.set('sortBy', sortBy);
                params.set('sortOrder', sortOrder);
                
                const res = await fetch(`${API}/api/logs?${params}`, { headers: headers() });
                if (res.ok) setData(await res.json());
            } catch (_) { }
            setIsLoading(false);
        };
        fetchLogs();
    }, [page, search, actionFilter, dateFrom, dateTo, sortBy, sortOrder]);

    const logs = data?.logs || [];
    const pages = data?.pages || 1;

    const handleSort = (key) => {
        if (key === 'none') return;
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('desc');
        }
        setPage(1);
    };

    const columns = [
        { label: 'Timestamp', key: 'createdAt' },
        { label: 'User', key: 'user.name' },
        { label: 'Action', key: 'action' },
        { label: 'Target', key: 'none' },
        { label: 'Details', key: 'none' }
    ];

    // CUSTOM ACTION DROPDOWN UI ENHANCEMENT
    const CustomActionDropdown = () => {
        const [isOpen, setIsOpen] = useState(false);
        const actionsList = ['create', 'update', 'delete', 'login', 'logout', 'assign', 'complete', 'approve'];
        const selectedLabel = actionFilter ? actionFilter.charAt(0).toUpperCase() + actionFilter.slice(1) : 'All Actions';

        return (
            <div style={{ position: 'relative', width: '160px' }}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontFamily: 'Inter', fontSize: '0.8rem', outline: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <span>{selectedLabel}</span>
                    </div>
                    <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
                </button>

                {isOpen && (
                    <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setIsOpen(false)} />
                        <motion.div 
                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                            style={{ position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: '0.5rem', background: '#0F172A', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.5rem', zIndex: 20, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                        >
                            <button 
                                onClick={() => { setActionFilter(''); setPage(1); setIsOpen(false); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '6px', background: actionFilter === '' ? 'rgba(255,255,255,0.05)' : 'transparent', color: actionFilter === '' ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontSize: '0.8rem', cursor: 'pointer', border: 'none', textAlign: 'left', transition: 'background 0.2s' }}
                            >
                                <span>All Actions</span>
                                {actionFilter === '' && <Check size={14} style={{ color: '#F59E0B' }} />}
                            </button>
                            {actionsList.map(a => (
                                <button 
                                    key={a}
                                    onClick={() => { setActionFilter(a); setPage(1); setIsOpen(false); }}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '6px', background: actionFilter === a ? 'rgba(255,255,255,0.05)' : 'transparent', color: actionFilter === a ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontSize: '0.8rem', cursor: 'pointer', border: 'none', textAlign: 'left', transition: 'background 0.2s' }}
                                >
                                    <span>{a.charAt(0).toUpperCase() + a.slice(1)}</span>
                                    {actionFilter === a && <Check size={14} style={{ color: '#F59E0B' }} />}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '0.25rem' }}>
                    Activity Logs
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Full audit trail of all platform actions</p>
            </div>

            {/* Filters */}
            <div className="logs-filter-panel" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--glass-bg)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1rem 1.25rem' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '160px' }}>
                    <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search user or action..."
                        style={{ width: '100%', padding: '0.55rem 0.65rem 0.55rem 2rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontFamily: 'Inter', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <CustomActionDropdown />
                <div style={{ width: '160px' }}>
                    <DatePicker 
                        value={dateFrom}
                        onChange={val => { setDateFrom(val); setPage(1); }}
                        placeholder="From Date"
                    />
                </div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>to</span>
                <div style={{ width: '160px' }}>
                    <DatePicker 
                        value={dateTo}
                        onChange={val => { setDateTo(val); setPage(1); }}
                        placeholder="To Date"
                    />
                </div>
                <div className="logs-export-btns" style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
                    <button onClick={exportExcel} title="Export to Excel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }}>
                        <FileSpreadsheet size={18} />
                    </button>
                    <button onClick={exportPDF} title="Export to PDF" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }}>
                        <FileText size={18} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="logs-table-container" style={{ background: 'var(--glass-bg)', border: '1px solid var(--color-border)', borderRadius: '20px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            {columns.map(col => (
                                <th 
                                    key={col.label} 
                                    onClick={() => handleSort(col.key)}
                                    style={{ padding: '0.875rem 1.25rem', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid var(--color-border)', cursor: col.key !== 'none' ? 'pointer' : 'default', userSelect: 'none', transition: 'background 0.2s' }}
                                    onMouseOver={e => col.key !== 'none' && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                    onMouseOut={e => col.key !== 'none' && (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {col.label}
                                        {col.key !== 'none' && sortBy === col.key && (
                                            sortOrder === 'asc' ? <ChevronUp size={12} style={{ color: 'var(--color-text-main)' }} /> : <ChevronDown size={12} style={{ color: 'var(--color-text-main)' }} />
                                        )}
                                        {col.key !== 'none' && sortBy !== col.key && (
                                            <ChevronDown size={12} style={{ opacity: 0.2 }} />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    <ClipboardList size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                                    <div>No activity logs found</div>
                                </td>
                            </tr>
                        ) : logs.map((log, i) => (
                            <motion.tr key={log._id || i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.02 }}
                                style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                <td style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontFamily: 'JetBrains Mono', whiteSpace: 'nowrap' }}>
                                    {new Date(log.createdAt || log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td style={{ padding: '0.9rem 1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                                            {(log.user?.name || log.performedBy?.name || '?')?.charAt(0)}
                                        </div>
                                        <span style={{ color: 'var(--color-text-main)', fontSize: '0.8rem', fontWeight: 500 }}>{log.user?.name || log.performedBy?.name || 'System'}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '0.9rem 1.25rem' }}>
                                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', background: `${getActionColor(log.action)}18`, color: getActionColor(log.action), fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                    {log.targetType && <span style={{ marginRight: '0.4rem', opacity: 0.6 }}>{log.targetType}:</span>}
                                    {log.targetName || log.entity || '—'}
                                </td>
                                <td style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {log.details || log.description || '—'}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                {pages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center' }}>
                            <ChevronLeft size={14} />
                        </button>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono' }}>Page {page} of {pages}</span>
                        <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: page === pages ? 'not-allowed' : 'pointer', opacity: page === pages ? 0.4 : 1, display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ActivityLogs;
