import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Lightweight internal fetching engine to replace TanStack Query
// Provides caching, loading states, and auto-refresh without external dependencies.
const cache = new Map();

const useDataFetch = (url, options = {}) => {
    const { token } = useAuth();
    const [data, setData] = useState(cache.get(url) || null);
    const [isLoading, setIsLoading] = useState(!cache.has(url));
    const [error, setError] = useState(null);
    const enabled = options.enabled !== false;

    const fetchData = useCallback(async (isAutoRefresh = false) => {
        const activeToken = token || localStorage.getItem('token');
        if (!activeToken || !enabled) {
            if (!enabled) setIsLoading(false);
            return;
        }
        if (!isAutoRefresh) setIsLoading(true);

        try {
            const apiBase = import.meta.env.VITE_API_URL || '';
            const apiUrl = `${apiBase}${url}`;
            console.log(`[Dashboard] Fetching from: ${apiUrl}`);


            const res = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${activeToken}` }
            });

            if (!res.ok) {
                let errorMessage = `API Error ${res.status}`;
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    const text = await res.text();
                    errorMessage = text || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const result = await res.json();
            setData(result);
            setError(null);
            cache.set(url, result);
            console.log(`[Dashboard] Fetched successfully:`, result);
        } catch (err) {
            console.error(`[Dashboard] Fetch error for ${url}:`, err);
            setError(err.message || 'Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    }, [url, token, enabled]);

    useEffect(() => {
        fetchData();

        if (options.refetchInterval && enabled) {
            const interval = setInterval(() => fetchData(true), options.refetchInterval);
            return () => clearInterval(interval);
        }
    }, [fetchData, options.refetchInterval, enabled]);

    return { data, isLoading, error, refetch: fetchData };
};

export const useOverview = () => useDataFetch('/api/analytics/overview');
export const useTrend = (days = 30) => useDataFetch(`/api/analytics/completion-trend?days=${days}`);
export const useAging = () => useDataFetch('/api/analytics/task-aging');
export const useRecentActivity = () => useDataFetch('/api/analytics/activity', { refetchInterval: 30000 });
export const useRoleDistribution = (enabled = false) => useDataFetch('/api/analytics/role-distribution', { enabled });
export const useWorkload = (enabled = false) => useDataFetch('/api/analytics/workload', { enabled });
export const usePerformance = (enabled = false) => useDataFetch('/api/analytics/performance', { enabled });
