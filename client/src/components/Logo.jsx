import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const Logo = ({ size = 'md', animated = true, withText = true }) => {
    // Size scaling configuration
    const SIZES = {
        sm: { icon: 24, fontSize: '1.25rem', gap: '0.4rem', border: 2 },
        md: { icon: 34, fontSize: '1.8rem', gap: '0.6rem', border: 3 },
        lg: { icon: 56, fontSize: '2.8rem', gap: '1rem', border: 4 },
        xl: { icon: 84, fontSize: '4rem', gap: '1.5rem', border: 6 }
    };
    const s = SIZES[size] || SIZES.md;

    // The Icon part of the Logo uses Framer Motion's SVG drawing
    const IconComponent = (
        <motion.div
            initial={animated ? { scale: 0.8, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: s.icon, height: s.icon, position: 'relative',
                filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))'
            }}
            whileHover={animated ? { rotate: [0, -4, 4, 0], transition: { duration: 0.4 } } : {}}
        >
            {/* Outer box simulating workflow nodes */}
            <svg width={s.icon} height={s.icon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="amberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                </defs>
                
                {/* 4 workflow node corners */}
                <rect x="2" y="2" width="10" height="10" rx="3" fill="url(#amberGlow)" opacity="0.9" />
                <rect x="28" y="2" width="10" height="10" rx="3" fill="url(#amberGlow)" opacity="0.6" />
                <rect x="2" y="28" width="10" height="10" rx="3" fill="url(#amberGlow)" opacity="0.5" />
                
                {/* Connecting paths */}
                <path d="M7 12V28" stroke="url(#amberGlow)" strokeWidth={s.border} strokeLinecap="round" opacity="0.5" />
                <path d="M12 7H28" stroke="url(#amberGlow)" strokeWidth={s.border} strokeLinecap="round" opacity="0.5" />

                {/* Inner Checkmark */}
                <motion.path
                    initial={animated ? { pathLength: 0, opacity: 0 } : false}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    d="M13 21.5L18 26.5L29 13.5"
                    stroke="#F8FAFC"
                    strokeWidth={s.border * 1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </motion.div>
    );

    if (!withText) return IconComponent;

    // Typography component
    return (
        <motion.div 
            initial={animated ? { opacity: 0, x: -10 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', gap: s.gap }}
            title="WorkflowPro"
        >
            {IconComponent}
            
            <motion.h1 
                style={{ 
                    margin: 0, padding: 0, 
                    fontSize: s.fontSize, 
                    fontWeight: 800, 
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    fontFamily: 'Inter, system-ui, sans-serif'
                }}
            >
                <span style={{ color: '#E2E8F0' }}>Workflow</span>
                <span style={{ 
                    // Amber Glow text
                    background: 'linear-gradient(90deg, #F59E0B, #D97706)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 20px rgba(245,158,11,0.2)'
                }}>Pro</span>
            </motion.h1>
        </motion.div>
    );
};

export default Logo;
