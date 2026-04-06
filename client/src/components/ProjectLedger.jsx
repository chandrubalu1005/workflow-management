import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    DollarSign, TrendingUp, TrendingDown, 
    PieChart, AlertTriangle, CheckCircle,
    ArrowUpRight, BarChart3, Edit3, Save, X, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProjectLedger = ({ project, onUpdate, isAdmin }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        budget: project?.budget || 0,
        actualCost: project?.actualCost || 0,
        currency: project?.currency || 'USD'
    });

    // Synchronize local state when parent project data updates
    useEffect(() => {
        if (!isEditing) {
            setFormData({
                budget: project?.budget || 0,
                actualCost: project?.actualCost || 0,
                currency: project?.currency || 'USD'
            });
        }
    }, [project, isEditing]);

    const { budget, actualCost, currency } = isEditing ? formData : {
        budget: project?.budget || 0,
        actualCost: project?.actualCost || 0,
        currency: project?.currency || 'USD'
    };
    
    const remaining = budget - actualCost;
    const burnRate = budget > 0 ? (actualCost / budget) * 100 : 0;
    const isOverBudget = actualCost > budget;
    const healthStatus = isOverBudget ? 'Critical' : (burnRate > 80 ? 'Warning' : 'Healthy');

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(val);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await onUpdate({
                budget: Number(formData.budget),
                actualCost: Number(formData.actualCost),
                currency: formData.currency
            });
            setIsEditing(false);
            toast.success('Financial Ledger Reconciled');
        } catch (err) {
            toast.error('Failed to sync ledger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC' }}>Project Multi-Ledger</h2>
                {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {isEditing ? (
                            <>
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748B', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                                >
                                    <X size={16} /> CANCEL
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    style={{ background: '#F59E0B', color: '#000', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900 }}
                                >
                                    {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><RefreshCw size={16} /></motion.div> : <Save size={16} />}
                                    SYNC_LEDGER
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setIsEditing(true)}
                                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', padding: '0.5rem 1.25rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
                            >
                                <Edit3 size={16} /> MANAGE_ALLOCATION
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Total Budget Card */}
                <motion.div 
                    style={{ 
                        background: 'rgba(255,255,255,0.03)', border: isEditing ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '24px', padding: '1.5rem', position: 'relative', overflow: 'hidden',
                        transition: 'border-color 0.3s ease'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Allocation</div>
                            {isEditing ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <span style={{ color: '#F59E0B', fontWeight: 900 }}>$</span>
                                    <input 
                                        type="number"
                                        value={formData.budget}
                                        onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                        style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: '#F8FAFC', fontSize: '1.75rem', fontWeight: 900, width: '100%', outline: 'none' }}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div style={{ color: '#F8FAFC', fontSize: '1.75rem', fontWeight: 900, marginTop: '0.5rem' }}>{formatCurrency(budget)}</div>
                            )}
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ height: '4px', flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <motion.div 
                                animate={{ width: `${Math.min(burnRate, 100)}%` }}
                                style={{ height: '100%', background: isOverBudget ? '#EF4444' : '#F59E0B' }}
                            />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{Math.round(burnRate)}%</span>
                    </div>
                </motion.div>

                {/* Burn Rate / Health Card */}
                <motion.div 
                    style={{ 
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '24px', padding: '1.5rem', position: 'relative'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Health</div>
                            <div style={{ color: isOverBudget ? '#EF4444' : '#10B981', fontSize: '1.75rem', fontWeight: 900, marginTop: '0.5rem' }}>{healthStatus}</div>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isOverBudget ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOverBudget ? '#EF4444' : '#10B981' }}>
                            {isOverBudget ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                        </div>
                    </div>
                    <p style={{ marginTop: '1rem', color: '#64748B', fontSize: '0.85rem' }}>
                        {isOverBudget 
                            ? `Project is currently exceeding budget by ${formatCurrency(Math.abs(remaining))}.`
                            : `Remaining liquidity: ${formatCurrency(remaining)}.`}
                    </p>
                </motion.div>

                {/* Actual Burn Card */}
                <motion.div 
                    style={{ 
                        background: 'rgba(255,255,255,0.03)', border: isEditing ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '24px', padding: '1.5rem', position: 'relative'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actual Burn</div>
                            {isEditing ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <span style={{ color: '#3B82F6', fontWeight: 900 }}>$</span>
                                    <input 
                                        type="number"
                                        value={formData.actualCost}
                                        onChange={e => setFormData({ ...formData, actualCost: e.target.value })}
                                        style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: '#F8FAFC', fontSize: '1.75rem', fontWeight: 900, width: '100%', outline: 'none' }}
                                    />
                                </div>
                            ) : (
                                <div style={{ color: '#F8FAFC', fontSize: '1.75rem', fontWeight: 900, marginTop: '0.5rem' }}>{formatCurrency(actualCost)}</div>
                            )}
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                            <BarChart3 size={20} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>ROI: 2.4x</span>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>Efficiency: 92%</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProjectLedger;
