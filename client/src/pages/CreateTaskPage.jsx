import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import CreateTaskForm from '../components/CreateTaskForm';

const CreateTaskPage = () => {
    const navigate = useNavigate();

    const handleSuccess = () => {
        // After successful creation, redirect to My Work or Tasks
        setTimeout(() => {
            navigate('/my-work');
        }, 1500);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
            >
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8',
                        padding: '0.6rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f8fafc'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>Task Orchestration</h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Standalone deployment of new operational unit</p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <CreateTaskForm onSuccess={handleSuccess} />
            </motion.div>
        </div>
    );
};

export default CreateTaskPage;
