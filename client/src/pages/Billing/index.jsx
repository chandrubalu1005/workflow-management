import { motion } from 'framer-motion';
import { CreditCard, TrendingUp, DollarSign, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const Billing = () => {
    const plans = [
        { name: 'Starter', price: '$29', period: '/mo', features: ['5 Users', '10 Projects', 'Basic Analytics', 'Email Support'], current: false, color: '#3B82F6' },
        { name: 'Pro', price: '$79', period: '/mo', features: ['25 Users', 'Unlimited Projects', 'Advanced Analytics', 'Priority Support', 'Templates'], current: true, color: '#F59E0B' },
        { name: 'Enterprise', price: '$199', period: '/mo', features: ['Unlimited Users', 'Unlimited Projects', 'Custom Reports', 'Dedicated Support', 'SSO', 'Audit Logs'], current: false, color: '#10B981' },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ paddingBottom: '3rem', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', padding: '0.75rem', borderRadius: '14px', display: 'flex', boxShadow: '0 8px 32px rgba(245,158,11,0.3)' }}>
                        <CreditCard size={24} color="#111827" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.03em', margin: 0 }}>Billing & Plans</h1>
                </div>
                <p style={{ color: '#94A3B8', fontSize: '1rem', margin: 0 }}>Manage your subscription, usage, and payment methods.</p>
            </div>

            {/* Current Usage Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Current Spend', value: '$79', sub: 'This billing cycle', icon: DollarSign, color: '#F59E0B' },
                    { label: 'Next Renewal', value: 'May 4', sub: '2026', icon: Calendar, color: '#3B82F6' },
                    { label: 'Usage', value: '72%', sub: 'of plan limits', icon: TrendingUp, color: '#10B981' },
                ].map((card) => (
                    <motion.div key={card.label} whileHover={{ y: -4 }}
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${card.color}18`, border: `1px solid ${card.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <card.icon size={22} color={card.color} />
                        </div>
                        <div>
                            <div style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{card.label}</div>
                            <div style={{ color: '#F8FAFC', fontSize: '1.75rem', fontWeight: 900, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>{card.value}</div>
                            <div style={{ color: '#64748B', fontSize: '0.75rem' }}>{card.sub}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Plan Cards */}
            <h2 style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '1.5rem', marginBottom: '1.5rem' }}>Available Plans</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {plans.map((plan) => (
                    <motion.div key={plan.name} whileHover={{ y: -6 }} transition={{ duration: 0.25 }}
                        style={{
                            background: plan.current ? `linear-gradient(180deg, ${plan.color}12 0%, rgba(255,255,255,0.02) 100%)` : 'rgba(255,255,255,0.02)',
                            border: `1.5px solid ${plan.current ? plan.color + '55' : 'rgba(255,255,255,0.07)'}`,
                            borderRadius: '24px', padding: '2rem', position: 'relative', overflow: 'hidden'
                        }}>
                        {plan.current && (
                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: plan.color, color: '#111827', fontSize: '0.65rem', fontWeight: 800, padding: '0.3rem 0.7rem', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Current Plan
                            </div>
                        )}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ color: plan.color, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{plan.name}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                <span style={{ color: '#F8FAFC', fontSize: '2.75rem', fontWeight: 900, fontFamily: 'JetBrains Mono' }}>{plan.price}</span>
                                <span style={{ color: '#64748B', fontSize: '0.9rem' }}>{plan.period}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                            {plan.features.map((f) => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <CheckCircle size={15} color={plan.color} />
                                    <span style={{ color: '#CBD5E1', fontSize: '0.9rem' }}>{f}</span>
                                </div>
                            ))}
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            style={{
                                width: '100%', padding: '0.875rem', borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Inter',
                                background: plan.current ? plan.color : 'rgba(255,255,255,0.06)',
                                color: plan.current ? '#111827' : '#CBD5E1',
                                transition: 'all 0.2s'
                            }}>
                            {plan.current ? 'Current Plan' : 'Upgrade'}
                        </motion.button>
                    </motion.div>
                ))}
            </div>

            {/* Coming Soon Banner */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(245,158,11,0.05)', border: '1px dashed rgba(245,158,11,0.2)', borderRadius: '20px', textAlign: 'center' }}>
                <AlertCircle size={28} color="#F59E0B" style={{ marginBottom: '0.75rem' }} />
                <div style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.4rem' }}>Payment Integration Coming Soon</div>
                <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Stripe integration and automated invoicing will be available in the next release.</div>
            </motion.div>
        </motion.div>
    );
};

export default Billing;
