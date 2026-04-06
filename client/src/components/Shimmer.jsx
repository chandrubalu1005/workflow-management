export const Shimmer = ({ width = '100%', height = '20px', borderRadius = '8px' }) => {
    return (
        <div style={{
            width,
            height,
            borderRadius,
            background: 'rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
                animation: 'shimmer 1.8s infinite linear'
            }} />
            <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
        </div>
    );
};

export const ShimmerCard = () => (
    <div style={{
        padding: '1.5rem',
        borderRadius: '24px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    }}>
        <Shimmer width="40px" height="40px" borderRadius="12px" />
        <Shimmer width="70%" height="18px" />
        <Shimmer width="40%" height="14px" />
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <Shimmer width="60px" height="24px" borderRadius="6px" />
            <Shimmer width="60px" height="24px" borderRadius="6px" />
        </div>
    </div>
);
