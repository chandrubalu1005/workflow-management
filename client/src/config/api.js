/**
 * Central API Configuration
 * Dynamically determines the API URL based on the current environment and connection.
 */

const getApiUrl = () => {
    // 1. Check for explicitly defined environment variable (baked in at build time)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // 2. Fallback to dynamic detection for development/network access
    // If we're on localhost and accessing via IP, use that IP on port 3000
    const { hostname, protocol } = window.location;
    
    // In development (Vite), we usually want port 3000 for the backend
    return `${protocol}//${hostname}:3000`;
};

export const API_URL = getApiUrl();
export default API_URL;
