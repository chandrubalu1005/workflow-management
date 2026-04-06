import { format, formatDistanceToNow, isPast, isValid, parseISO } from 'date-fns';

export const formatDate = (dateString, formatStr = 'MMM d, yyyy') => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(date) ? format(date, formatStr) : 'Invalid Date';
};

export const formatRelative = (dateString) => {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) return '';

    return formatDistanceToNow(date, { addSuffix: true });
};

export const isOverdue = (dateString) => {
    if (!dateString) return false;
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(date) && isPast(date);
};

export const getDaysOverdue = (dateString) => {
    if (!dateString) return 0;
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) return 0;

    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};
