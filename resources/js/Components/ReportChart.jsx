import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line,
} from 'recharts';
import { CHART_COLORS } from '@/lib/chart-palette';

const AXIS_PROPS = {
    stroke: CHART_COLORS.charcoal,
    fontSize: 12,
    tickLine: false,
    axisLine: { stroke: CHART_COLORS.eggshell },
};

const TOOLTIP_STYLE = {
    borderRadius: 10,
    border: `1px solid ${CHART_COLORS.eggshell}`,
    fontSize: 12,
};

const LEGEND_STYLE = { fontSize: 12 };

export function ReportBarChart({ data, xKey, yKey, label, color = CHART_COLORS.cherry, height = 260 }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.eggshell} />
                <XAxis dataKey={xKey} {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Bar dataKey={yKey} name={label} fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function ReportLineChart({ data, xKey, series, height = 260 }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.eggshell} />
                <XAxis dataKey={xKey} {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={LEGEND_STYLE} />
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