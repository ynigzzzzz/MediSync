import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line,
} from 'recharts';

const PALETTE = {
    cherry: '#FFB7CE',
    rose: '#764248',
    charcoal: '#2C3E50',
    green: '#2E7D64',
    orange: '#E67E22',
    red: '#DC3545',
};

const AXIS_PROPS = {
    stroke: PALETTE.charcoal,
    fontSize: 12,
    tickLine: false,
    axisLine: { stroke: '#DFE2CF' },
};

export function ReportBarChart({ data, xKey, yKey, label, color = PALETTE.cherry, height = 260 }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFE2CF" />
                <XAxis dataKey={xKey} {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} />
                <Tooltip
                    contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #DFE2CF',
                        fontSize: 12,
                    }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey={yKey} name={label} fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function ReportLineChart({ data, xKey, series, height = 260 }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFE2CF" />
                <XAxis dataKey={xKey} {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} />
                <Tooltip
                    contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #DFE2CF',
                        fontSize: 12,
                    }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {series.map((s) => (
                    <Line
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.label}
                        stroke={s.color}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}