/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'wp-emerald': '#10B981',
                'wp-amber': {
                    DEFAULT: '#F59E0B',
                    hover: '#FBBF24',
                    glow: 'rgba(245, 158, 11, 0.25)',
                },
                'wp-red': '#EF4444',
                'wp-bg': '#0A0F1C',
                'wp-surface': '#0F172A',
                'wp-dark': {
                    950: '#0B1220',
                    900: '#111827',
                    800: '#1F2937',
                    700: '#374151',
                },
                'wp-gold': {
                    500: '#F59E0B',
                    400: '#FBBF24',
                    300: '#FCD34D',
                },
            },
            fontFamily: {
                outfit: ['Outfit', 'Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            backgroundImage: {
                'amber-gradient': 'linear-gradient(135deg, #F59E0B, #FBBF24)',
            },
            transitionDuration: {
                '250': '250ms',
                '350': '350ms',
                '400': '400ms',
            },
            transitionTimingFunction: {
                'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
                'smooth': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                'bounce-out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            },
            keyframes: {
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in-down': {
                    '0%': { opacity: '0', transform: 'translateY(-16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-in-left': {
                    '0%': { opacity: '0', transform: 'translateX(-24px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                'slide-in-right': {
                    '0%': { opacity: '0', transform: 'translateX(24px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.92)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'float-up': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                'glow-pulse': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.15), 0 0 40px rgba(245, 158, 11, 0.05)' },
                    '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.3), 0 0 60px rgba(245, 158, 11, 0.15)' },
                },
                'pulse-dot': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.5' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                'bounce-in': {
                    '0%': { opacity: '0', transform: 'scale(0.85)' },
                    '50%': { transform: 'scale(1.05)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'gradient-flow': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
                'spin-slow': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
                'stagger-fade': {
                    '0%': { opacity: '0', transform: 'translateY(12px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(24px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'rotate-in': {
                    '0%': { opacity: '0', transform: 'rotate(-5deg) scale(0.95)' },
                    '100%': { opacity: '1', transform: 'rotate(0) scale(1)' },
                },
                'counter-up': {
                    '0%': { content: '0' },
                    '100%': { content: '100%' },
                },
                'letter-stagger': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'blur-out': {
                    '0%': { opacity: '1', backdropFilter: 'blur(0px)' },
                    '100%': { opacity: '0', backdropFilter: 'blur(10px)' },
                },
            },
            animation: {
                'fade-in-up': 'fade-in-up 0.5s ease-out',
                'fade-in-down': 'fade-in-down 0.5s ease-out',
                'slide-in-left': 'slide-in-left 0.5s ease-out',
                'slide-in-right': 'slide-in-right 0.5s ease-out',
                'scale-in': 'scale-in 0.4s ease-out',
                'float-up': 'float-up 3s ease-in-out infinite',
                'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
                'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
                'shimmer': 'shimmer 2s infinite',
                'bounce-in': 'bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                'gradient-flow': 'gradient-flow 8s ease infinite',
                'spin-slow': 'spin-slow 4s linear infinite',
                'stagger-fade': 'stagger-fade 0.6s ease-out',
                'slide-up': 'slide-up 0.5s ease-out',
                'rotate-in': 'rotate-in 0.5s ease-out',
                'blur-out': 'blur-out 0.6s ease-out',
            },
        },
    },
    plugins: [],
}
