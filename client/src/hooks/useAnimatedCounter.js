/**
 * WorkflowPro — useAnimatedCounter
 * Animates a number from 0 to endValue when the target element enters the viewport.
 * Extracted from LandingPage for global reuse across Dashboard, Analytics, etc.
 *
 * Usage:
 *   const { count, ref } = useAnimatedCounter(1284, 2);
 *   return <span ref={ref}>{count}</span>
 */
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

const useAnimatedCounter = (endValue, duration = 1.5, decimals = 0) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });

    useEffect(() => {
        if (!inView) return;
        let startTime;
        let animFrame;

        const animate = (time) => {
            if (!startTime) startTime = time;
            const progress = Math.min((time - startTime) / (duration * 1000), 1);
            // Ease-out cubic for natural deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * endValue;

            if (decimals > 0) {
                setCount(parseFloat(current.toFixed(decimals)));
            } else {
                setCount(Math.floor(current));
            }

            if (progress < 1) {
                animFrame = requestAnimationFrame(animate);
            } else {
                setCount(endValue);
            }
        };

        animFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrame);
    }, [inView, endValue, duration, decimals]);

    return { count, ref };
};

export default useAnimatedCounter;
