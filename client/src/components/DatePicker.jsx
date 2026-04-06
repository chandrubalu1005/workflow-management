import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval
} from 'date-fns';

/**
 * DatePicker — calendar is rendered via createPortal at document.body level,
 * so it NEVER gets clipped by parent overflow:hidden containers.
 * Position is auto-calculated: opens above/below and left/right as needed.
 */
const DatePicker = ({ value, onChange, label, placeholder = 'Select date', required = false }) => {
    const [isOpen, setIsOpen]         = useState(false);
    const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0, openUp: false });
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
    const triggerRef = useRef(null);
    const calendarRef = useRef(null);

    /* ── Calculate position when opening ── */
    const open = () => {
        const rect = triggerRef.current.getBoundingClientRect();
        const CAL_HEIGHT = 320; // approx calendar height
        const CAL_WIDTH  = 300;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceRight = window.innerWidth  - rect.left;
        const openUp   = spaceBelow < CAL_HEIGHT && rect.top > CAL_HEIGHT;
        const openLeft = spaceRight < CAL_WIDTH;

        const top  = openUp
            ? rect.top  + window.scrollY - CAL_HEIGHT - 8
            : rect.bottom + window.scrollY + 8;
        const left = openLeft
            ? rect.right  + window.scrollX - CAL_WIDTH
            : rect.left   + window.scrollX;

        setCalendarPos({ top, left, openUp });
        setIsOpen(true);
    };

    const close = useCallback(() => setIsOpen(false), []);
    const toggle = () => (isOpen ? close() : open());

    /* ── Close on outside click ── */
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                calendarRef.current && !calendarRef.current.contains(e.target)
            ) {
                close();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, close]);

    /* ── Reposition on scroll/resize ── */
    useEffect(() => {
        if (!isOpen) return;
        const reposition = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            const CAL_HEIGHT = 320;
            const CAL_WIDTH  = 300;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceRight = window.innerWidth  - rect.left;
            const openUp   = spaceBelow < CAL_HEIGHT && rect.top > CAL_HEIGHT;
            const openLeft = spaceRight < CAL_WIDTH;
            const top  = openUp ? rect.top + window.scrollY - CAL_HEIGHT - 8 : rect.bottom + window.scrollY + 8;
            const left = openLeft ? rect.right + window.scrollX - CAL_WIDTH : rect.left + window.scrollX;
            setCalendarPos({ top, left, openUp });
        };
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [isOpen]);

    const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const calendarBody = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={calendarRef}
                    initial={{ opacity: 0, y: calendarPos.openUp ? 8 : -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: calendarPos.openUp ? 8 : -8, scale: 0.95 }}
                    transition={{ duration: 0.18, type: 'spring', stiffness: 340, damping: 28 }}
                    style={{
                        position: 'absolute',
                        top: calendarPos.top,
                        left: calendarPos.left,
                        zIndex: 999999,   /* above everything */
                        width: 300,
                        padding: '1.25rem',
                        background: 'var(--bg-card, #1e293b)',
                        backdropFilter: 'blur(30px)',
                        border: '1px solid var(--border-default, rgba(255,255,255,0.1))',
                        borderRadius: 18,
                        boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* Month nav */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main, #f1f5f9)' }}>
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                                type="button"
                                onClick={e => { e.preventDefault(); setCurrentMonth(subMonths(currentMonth, 1)); }}
                                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--text-secondary, #94a3b8)', padding: '0.35rem', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={e => { e.preventDefault(); setCurrentMonth(addMonths(currentMonth, 1)); }}
                                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--text-secondary, #94a3b8)', padding: '0.35rem', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Day grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                        {/* Weekday headers */}
                        {DAYS.map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', paddingBottom: '0.4rem' }}>
                                {d}
                            </div>
                        ))}
                        {/* Date cells */}
                        {eachDayOfInterval({
                            start: startOfWeek(startOfMonth(currentMonth)),
                            end:   endOfWeek(endOfMonth(currentMonth)),
                        }).map((day, i) => {
                            const inMonth  = isSameMonth(day, currentMonth);
                            const selected = value && isSameDay(day, new Date(value));
                            const isToday  = isSameDay(day, new Date());
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={e => {
                                        e.preventDefault();
                                        onChange(format(day, 'yyyy-MM-dd'));
                                        close();
                                    }}
                                    style={{
                                        background: selected ? 'var(--brand-primary, #F59E0B)' : 'transparent',
                                        border: isToday && !selected ? '1px solid rgba(245,158,11,0.4)' : 'none',
                                        borderRadius: 8,
                                        color: selected ? '#000' : inMonth ? 'var(--text-main, #f1f5f9)' : 'var(--text-muted, #475569)',
                                        padding: '0.5rem 0',
                                        fontSize: '0.8rem',
                                        fontWeight: (selected || isToday) ? 700 : 400,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        position: 'relative',
                                    }}
                                    onMouseOver={e => { if (!selected) e.currentTarget.style.background = 'rgba(245,158,11,0.12)'; }}
                                    onMouseOut={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer: Clear button */}
                    {value && (
                        <button
                            type="button"
                            onClick={e => { e.preventDefault(); onChange(''); close(); }}
                            style={{
                                marginTop: '0.75rem', width: '100%', padding: '0.4rem',
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 8, color: '#ef4444', fontSize: '0.75rem',
                                fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
                            }}
                        >
                            Clear date
                        </button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {label && (
                <label className="form-label">
                    {label} {required && <span style={{ color: 'var(--color-error, #ef4444)' }}>*</span>}
                </label>
            )}
            {/* Trigger button */}
            <div
                ref={triggerRef}
                onClick={toggle}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    background: 'var(--bg-overlay, rgba(255,255,255,0.04))',
                    border: `1px solid ${isOpen ? 'rgba(245,158,11,0.5)' : 'var(--border-default, rgba(255,255,255,0.1))'}`,
                    borderRadius: 'var(--radius-md, 10px)',
                    color: value ? 'var(--text-main, #f1f5f9)' : 'var(--text-muted, #64748b)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    minHeight: 40,
                    boxShadow: isOpen ? '0 0 0 2px rgba(245,158,11,0.15)' : 'none',
                    userSelect: 'none',
                }}
                onMouseOver={e => { if (!isOpen) e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'; }}
                onMouseOut={e => { if (!isOpen) e.currentTarget.style.borderColor = 'var(--border-default, rgba(255,255,255,0.1))'; }}
            >
                <CalendarIcon size={16} color={isOpen ? '#F59E0B' : undefined} style={{ opacity: value || isOpen ? 1 : 0.5, flexShrink: 0, transition: 'color 0.2s' }} />
                <span style={{ flex: 1, lineHeight: 1 }}>
                    {value ? format(new Date(value), 'MMM d, yyyy') : placeholder}
                </span>
                {value && (
                    <X
                        size={14}
                        onClick={e => { e.stopPropagation(); onChange(''); }}
                        style={{ opacity: 0.5, cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.opacity = 1}
                        onMouseOut={e => e.currentTarget.style.opacity = 0.5}
                    />
                )}
            </div>

            {/* Portal: renders at document.body — no overflow clipping ever */}
            {createPortal(calendarBody, document.body)}
        </div>
    );
};

export default DatePicker;
