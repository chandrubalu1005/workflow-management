import { create } from 'zustand';

/**
 * Dashboard Store
 * Manages UI state, filters, and AI suggestions for the Workforce Intelligence Platform.
 */
export const useDashboardStore = create((set) => ({
    // UI State
    activeZone: 0, // 0: Focus, 1: Intelligence, 2: Workforce, 3: Activity
    isSidebarCollapsed: false,

    // Filters
    timeRange: '7d', // '24h', '7d', '30d'

    // AI Insights
    suggestions: [
        { id: 1, type: 'balance', message: 'Reassign 2 tasks from Karthik to John to optimize load.', impact: 'High' },
        { id: 2, type: 'risk', message: 'Project "Zenith" shows 15% delay risk due to recent blockers.', impact: 'Medium' }
    ],

    // Actions
    setActiveZone: (zone) => set({ activeZone: zone }),
    setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
    setTimeRange: (range) => set({ timeRange: range }),
    dismissSuggestion: (id) => set((state) => ({
        suggestions: state.suggestions.filter(s => s.id !== id)
    })),
}));
