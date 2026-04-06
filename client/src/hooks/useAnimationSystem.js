/* ========================================================== */
/* Animation & Design System Utility Hooks                   */
/* ========================================================== */
import { useMotionTemplate, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

/**
 * useAnimatedCounter
 * Animates a number from 0 to final value using spring animation
 */
export const useAnimatedCounter = (target, duration = 1000) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (!target) return;

        let start = 0;
        let animationFrame;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function: easeOut
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const value = Math.floor(start + (target - start) * easeProgress);

            setDisplayValue(value);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration]);

    return displayValue;
};

/**
 * useGlassEffect
 * Returns motion values for glass morphism hover effects
 */
export const useGlassEffect = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return { mouseX, mouseY, handleMouseMove, handleMouseLeave };
};

/**
 * useStaggerAnimation
 * Generates stagger animation delays for list items
 */
export const useStaggerAnimation = (itemCount = 6, staggerDelay = 0.06) => {
    return Array.from({ length: itemCount }, (_, i) => ({
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.48,
                ease: [0.16, 1, 0.3, 1],
                delay: i * staggerDelay
            }
        }
    }));
};

/**
 * useScrollReveal
 * Reveals element when scrolled into view
 */
export const useScrollReveal = () => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return [elementRef, isVisible];
};

/**
 * usePageTransition
 * Provides standard page transition animation
 */
export const usePageTransition = () => ({
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
});

/**
 * useHoverGlow
 * Provides hover glow effect configuration
 */
export const useHoverGlow = () => ({
    whileHover: {
        y: -4,
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35), 0 0 20px rgba(245, 158, 11, 0.15)'
    },
    transition: { duration: 0.2, ease: 'easeOut' }
});

/**
 * useDebounce
 * Debounces a value for search, filtering, etc.
 */
export const useDebounce = (value, delay = 500) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};
