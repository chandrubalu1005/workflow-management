import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    maxWidth: '450px',
                    width: '100%'
                }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}
                >
                    <ShieldAlert size={40} />
                </motion.div>

                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: 'var(--color-text-main)',
                    marginBottom: '1rem'
                }}>
                    Access Restricted
                </h1>

                <p style={{
                    color: 'var(--color-text-secondary)',
                    marginBottom: '2rem',
                    lineHeight: '1.6'
                }}>
                    You don’t have permission to access this page. This area is restricted to administrators to ensure system security.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(-1)}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <ArrowLeft size={18} /> Go Back
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/dashboard')}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Home size={18} /> Dashboard
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default AccessDenied;
