import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const MagneticButton = ({ children, className = '', style = {}, disabled = false, onClick, strength = 0.3 }) => {
    const ref = useRef(null);
    
    // Use MotionValues to avoid React rerenders on mouse move
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring physics for the magnetic effect
    const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
    const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;

        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;

        x.set(deltaX * strength);
        y.set(deltaY * strength);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            className={className}
            style={{
                ...style,
                position: 'relative',
                display: 'inline-block',
                x: springX,
                y: springY,
                willChange: 'transform' // GPU Hint
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                onClick={!disabled ? onClick : undefined}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer', width: '100%', height: '100%' }}
            >
                {children}
            </div>
        </motion.div>
    );
};


export default MagneticButton;
