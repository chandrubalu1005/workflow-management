import { motion } from 'framer-motion';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

const TeamVelocity = () => {
    const data = [
        { subject: 'Speed', TeamA: 120, TeamB: 110, fullMark: 150 },
        { subject: 'Accuracy', TeamA: 98, TeamB: 130, fullMark: 150 },
        { subject: 'Collaboration', TeamA: 86, TeamB: 130, fullMark: 150 },
        { subject: 'Deadline Adherence', TeamA: 99, TeamB: 100, fullMark: 150 },
        { subject: 'Workload Stability', TeamA: 85, TeamB: 90, fullMark: 150 },
    ];

    return (
        <section style={{ padding: '2rem', marginBottom: '2.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '16px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Team Velocity Matrix</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Comparing multi-dimensional performance across core departments.</p>
            </div>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '400px', width: '100%', position: 'relative' }}
            >
                {/* CSS to add glow to the svg paths */}
                <style>{`
                    .recharts-polygon { filter: drop-shadow(0 0 12px rgba(245,158,11,0.5)); transform-origin: center; animation: pulse-radar 4s infinite alternate ease-in-out; }
                    @keyframes pulse-radar { 0% { filter: drop-shadow(0 0 8px rgba(245,158,11,0.3)); } 100% { filter: drop-shadow(0 0 20px rgba(245,158,11,0.7)); } }
                `}</style>
                <ResponsiveContainer width="100%" height={400}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar
                            name="Engineering"
                            dataKey="TeamA"
                            stroke="#F59E0B"
                            strokeWidth={3}
                            fill="#F59E0B"
                            fillOpacity={0.25}
                            animationDuration={1500}
                        />
                        <Radar
                            name="Product"
                            dataKey="TeamB"
                            stroke="#94A3B8"
                            strokeWidth={2}
                            fill="#64748B"
                            fillOpacity={0.15}
                            animationDuration={1500}
                            animationBegin={300}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '0.85rem', fontWeight: 600 }} />
                    </RadarChart>
                </ResponsiveContainer>
            </motion.div>
        </section>
    );
};

export default TeamVelocity;
