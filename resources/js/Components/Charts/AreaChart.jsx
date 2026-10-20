import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ActivityAreaChart({ data }) {
    return (
        <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gradient-green" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2E7D64" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2E7D64" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradient-rose" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF4D79" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#FF4D79" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#6B7280' }} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#6B7280' }} 
                    />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="received" 
                        name="Received" 
                        stroke="#2E7D64" 
                        strokeWidth={2}
                        fill="url(#gradient-green)" 
                        activeDot={{ r: 6, fill: '#2E7D64', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="dispensed" 
                        name="Dispensed" 
                        stroke="#FF4D79" 
                        strokeWidth={2}
                        fill="url(#gradient-rose)" 
                        activeDot={{ r: 6, fill: '#FF4D79', stroke: '#fff', strokeWidth: 2 }}
                    />
                </RechartsAreaChart>
            </ResponsiveContainer>
        </div>
    );
}