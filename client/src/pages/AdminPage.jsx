import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Tabs from '../components/Tabs';
import AddUserForm from '../components/AddUserForm';
import UserList from '../components/UserList';
import ActivityLogs from '../components/ActivityLogs';
import Tasks from '../pages/Tasks';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';

const AdminPage = () => {
    const [refreshUsers, setRefreshUsers] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    // Determine active tab based on URL path
    const getInitialTab = () => {
        if (location.pathname.includes('/tasks')) return 2; // Task Assignment
        if (location.pathname.includes('/logs')) return 3; // Activity Logs
        return 1; // Default to User List (tabs 0 & 1 both live at /admin/users)
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    useEffect(() => {
        setActiveTab(getInitialTab());
    }, [location.pathname]);

    const handleUserAdded = () => {
        setRefreshUsers(prev => prev + 1);
        setActiveTab(1); // Switch to list view after adding
        navigate('/admin/users');
    };

    const handleTabChange = (index) => {
        setActiveTab(index);
        // Cases 0 & 1 are sub-views of /admin/users — don't navigate, just swap the tab
        switch (index) {
            case 2: navigate('/admin/tasks'); break;
            case 3: navigate('/admin/logs'); break;
        }
    };

    const tabs = [
        { label: 'Add User', content: <AddUserForm onSuccess={handleUserAdded} /> },
        { label: 'User List', content: <UserList refreshTrigger={refreshUsers} /> },
        { label: 'Task Assignment', content: <Tasks /> },
        { label: 'Activity Logs', content: <ActivityLogs /> }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}
        >
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                marginBottom: '2.5rem', gap: '2rem', flexWrap: 'wrap'
            }}>
                <div>
                    <h2 style={{
                        marginBottom: '0.4rem',
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        color: 'var(--color-text-main)',
                        fontFamily: 'var(--wp-font)'
                    }}>
                        User Management
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', fontWeight: 400, opacity: 0.8 }}>
                        Manage workforce access, permissions, and security parameters.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(0)}
                        className="btn-primary"
                        style={{
                            padding: '0 1.75rem', height: '3.25rem', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700
                        }}
                    >
                        <UserPlus size={18} /> Add New User
                    </motion.button>
                </div>
            </div>

            <div style={{ background: '#0F172A', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
        </motion.div>
    );
};

export default AdminPage;
