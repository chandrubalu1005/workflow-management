/**
 * DashboardCharts — Chart utility components for the WorkflowPro Dashboard
 * Uses Recharts for all visualizations. All charts follow the amber/dark theme.
 */
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { motion } from 'framer-motion';

const AMBER = '#F59E0B';
const AMBER_LIGHT = '#FBBF24';
const AMBER_GLOW = 'rgba(245,158,11,0.18)';
const GRID_COLOR = 'rgba(255,255,255,0.05)';
const AXIS_COLOR = '#6B7280';

// ── Custom Tooltip ─────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(11,18,32,0.95)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px',
            padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            fontFamily: 'Inter, sans-serif', minWidth: '120px'
        }}>
            <p style={{ color: '#9CA3AF', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color || AMBER, fontSize: '0.85rem', fontWeight: 700, margin: '2px 0' }}>
                    {entry.name && <span style={{ color: '#9CA3AF', fontWeight: 500, fontSize: '0.75rem' }}>{entry.name}: </span>}
                    {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                </p>
            ))}
        </div>
    );
};

// ── Mini Area Sparkline (for stat cards) ───────────────────
export const SparklineChart = ({ data, color = AMBER, height = 48 }) => (
    <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
                <linearGradient id={`sparkGrad_${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <Area
                type="monotone" dataKey="value" stroke={color} strokeWidth={2}
                fill={`url(#sparkGrad_${color.replace('#','')})`}
                dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
        </AreaChart>
    </ResponsiveContainer>
);

// ── Task Velocity Line Chart ───────────────────────────────
export const TaskVelocityChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <defs>
                <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AMBER} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="completed" name="Completed" stroke={AMBER} strokeWidth={2.5}
                fill="url(#velocityGrad)" dot={false} activeDot={{ r: 5, fill: AMBER, stroke: '#0B1220', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="added" name="Added" stroke="#3B82F6" strokeWidth={2}
                fill="none" strokeDasharray="4 2" dot={false} activeDot={{ r: 4, fill: '#3B82F6' }} />
        </AreaChart>
    </ResponsiveContainer>
);

// ── Task Status Distribution Donut ─────────────────────────
const STATUS_COLORS = { 'Completed': '#10B981', 'In Progress': AMBER, 'Pending': '#6B7280', 'Overdue': '#EF4444' };
export const TaskDistributionChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={180}>
        <PieChart>
            <Pie
                data={data} cx="50%" cy="50%"
                innerRadius={52} outerRadius={75}
                paddingAngle={3} dataKey="value"
                stroke="none"
            >
                {data?.map((entry, index) => (
                    <Cell key={index} fill={STATUS_COLORS[entry.name] || AMBER} opacity={0.9} />
                ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
        </PieChart>
    </ResponsiveContainer>
);

// ── Team Workload Horizontal Bar ────────────────────────────
export const WorkloadBarChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={Math.max(data?.length * 44 + 20, 120)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
            barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
            <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#9CA3AF', fontSize: 12, fontFamily: 'Inter', fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="tasks" name="Tasks" radius={[0, 6, 6, 0]} maxBarSize={10}>
                {data?.map((entry, index) => (
                    <Cell key={index}
                        fill={entry.overloaded ? '#EF4444' : entry.tasks > 8 ? AMBER : '#10B981'}
                        fillOpacity={0.85}
                    />
                ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

// ── Performance Radial Chart ───────────────────────────────
export const PerformanceRadialChart = ({ value = 72, label = 'Score' }) => {
    const data = [{ name: label, value, fill: AMBER }];
    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width={140} height={140}>
                <RadialBarChart innerRadius="65%" outerRadius="90%" data={data} startAngle={90} endAngle={-270} barSize={10}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background={{ fill: 'rgba(255,255,255,0.04)' }} dataKey="value" cornerRadius={8} />
                </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: AMBER_LIGHT, fontFamily: 'Manrope, Inter, sans-serif', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.65rem', color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '2px' }}>{label}</div>
            </div>
        </div>
    );
};

// Missing: PolarAngleAxis must be imported from Recharts
import { PolarAngleAxis } from 'recharts';

export { CustomTooltip };
