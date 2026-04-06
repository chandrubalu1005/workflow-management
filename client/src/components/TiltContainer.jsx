import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const TiltContainer = forwardRef(({ children, intensity = 15, style = {} }, ref) => {
    const localRef = useRef(null);

    // Merge refs so both dnd-kit and our internal bounding box calculations work
    useImperativeHandle(ref, () => localRef.current);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

    const rotateX = useTransform(mouseY, [0.5, -0.5], [intensity, -intensity]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [intensity, -intensity]);

    function handleMouseMove(event) {
        if (!localRef.current) return;
        const rect = localRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXPos = event.clientX - rect.left;
        const mouseYPos = event.clientY - rect.top;
        x.set((mouseXPos / width) - 0.5);
        y.set((mouseYPos / height) - 0.5);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            ref={localRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                ...style,
                perspective: 1000,
                transformStyle: 'preserve-3d',
                rotateX,
                rotateY,
            }}
        >
            <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
                {children}
            </div>
        </motion.div>
    );
});

export default TiltContainer;
