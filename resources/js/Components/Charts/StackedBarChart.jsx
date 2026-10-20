import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function StackedBarChart({ data }) {
    return (
        <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <Tooltip 
                        cursor={{ fill: '#F9FAFB' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="received" name="Received" fill="#2E7D64" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="dispensed" name="Dispensed" fill="#FF4D79" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}