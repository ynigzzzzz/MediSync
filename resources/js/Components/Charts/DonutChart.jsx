import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function DonutChart({ data, innerRadius = 60, outerRadius = 80 }) {
    return (
        <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}