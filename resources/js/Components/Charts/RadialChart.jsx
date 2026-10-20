import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

export function RadialChart({ data, label, value, color = '#2E7D64' }) {
    return (
        <div className="relative flex flex-col items-center justify-center h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                    cx="50%" cy="50%" 
                    innerRadius="70%" outerRadius="100%" 
                    barSize={12} 
                    data={data} 
                    startAngle={90} endAngle={-270}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar 
                        background={{ fill: '#F2F2F7' }} 
                        dataKey="value" 
                        cornerRadius={10} 
                    />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
            </div>
        </div>
    );
}