import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem('wp_theme');
        return saved || 'dark';
    });

    const isDark = theme === 'dark';
    const [transitioning, setTransitioning] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.background = isDark ? '#030712' : '#F1F5F9';
    }, [theme, isDark]);

    const setTheme = (t) => {
        setTransitioning(true);
        setThemeState(t);
        localStorage.setItem('wp_theme', t);
        setTimeout(() => setTransitioning(false), 400);
    };

    const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark, transitioning }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
