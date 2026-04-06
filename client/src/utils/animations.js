/**
 * WorkflowPro — Shared Animation Variants
 * Standard Framer Motion transitions used across all pages.
 * Import these instead of defining inline per-component.
 */

// ── Page-level Transitions ─────────────────────────────────
export const pageTransition = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -10 },
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
};

// ── Card Reveal (for use as whileInView or variants) ────────
export const cardReveal = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1, y: 0,
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
    }
};

// ── Stagger Container ───────────────────────────────────────
export const staggerContainer = (staggerDelay = 0.06) => ({
    hidden: {},
    show: {
        transition: { staggerChildren: staggerDelay, delayChildren: 0.05 }
    }
});

// ── Fade In ─────────────────────────────────────────────────
export const fadeIn = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { duration: 0.3 } }
};

// ── Slide Up ────────────────────────────────────────────────
export const slideUp = {
    hidden: { opacity: 0, y: 30 },
    show: {
        opacity: 1, y: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
};

// ── Slide In From Left ──────────────────────────────────────
export const slideInLeft = {
    hidden: { opacity: 0, x: -20 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16,1,0.3,1] } }
};

// ── Scale Pop ───────────────────────────────────────────────
export const scalePop = {
    hidden: { opacity: 0, scale: 0.92 },
    show:   { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16,1,0.3,1] } }
};

// ── Hover Lift (use as whileHover prop) ─────────────────────
export const hoverLift = {
    y: -4,
    boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 16px rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.35)',
    transition: { duration: 0.2, ease: 'easeOut' }
};

// ── Hover Glow Button ───────────────────────────────────────
export const hoverGlowButton = {
    scale: 1.03,
    boxShadow: '0 0 18px rgba(245,158,11,0.35)',
    transition: { duration: 0.18 }
};

// ── Tap Scale ───────────────────────────────────────────────
export const tapScale = { scale: 0.97 };

// ── Tooltip Reveal ───────────────────────────────────────────
export const tooltipReveal = {
    initial: { opacity: 0, y: 4, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit:    { opacity: 0, y: 4, scale: 0.96 },
    transition: { duration: 0.18, ease: 'easeOut' }
};

// ── Modal / Overlay ──────────────────────────────────────────
export const overlayFade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit:    { opacity: 0 },
    transition: { duration: 0.25 }
};

export const modalSlide = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit:    { opacity: 0, scale: 0.96, y: 10 },
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
};

// ── Notification Pulse (keyframes compatible) ────────────────
export const notifPulse = {
    scale: [1, 1.18, 1],
    transition: { duration: 0.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.4 }
};

// ── Performance: force GPU compositing on animated elements ──
export const gpuOptimized = { willChange: 'transform, opacity' };
