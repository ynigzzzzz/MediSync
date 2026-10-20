import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export function Sparkline({ data, color = '#10b981' }) {
    return (
        <div className="h-10 w-24">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#spark-${color})`}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}