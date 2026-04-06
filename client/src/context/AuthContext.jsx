import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTheme } from './ThemeContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Delegate theme to ThemeContext (single source of truth)
    const { theme, setTheme, toggleTheme } = useTheme();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token) {
                if (storedUser) setUser(JSON.parse(storedUser)); // Optimistic load
                
                try {
                    const apiBase = import.meta.env.VITE_API_URL || '';
                    const res = await fetch(`${apiBase}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });


                    if (res.ok) {
                        const userData = await res.json();
                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                    } else {
                        console.warn('Auth verification failed. Clearing session.');
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Auth verification failed', error);
                }
            } else {
                // No token exists, clear any spoofed user object
                localStorage.removeItem('user');
                setUser(null);
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const updateUser = (userData) => {
        const updatedUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token: localStorage.getItem('token'),
            login,
            logout,
            updateUser,
            loading,
            theme,
            setTheme,
            toggleTheme
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
