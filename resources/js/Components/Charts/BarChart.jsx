import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/Components/ui/chart';
import { CHART_COLORS } from '@/lib/chart-palette';

const TICK_PROPS = { fontSize: 11, fill: CHART_COLORS.charcoal };

export function BarChart({ data, xKey, yKey, label, color = CHART_COLORS.cherry, height = 260 }) {
    return (
        <ChartContainer config={{}} className={`h-[${height}px] w-full`}>
            <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.eggshell} vertical={false} />
                <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={TICK_PROPS} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tick={TICK_PROPS} />
                <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                <Bar dataKey={yKey} name={label} fill={color} radius={[6, 6, 0, 0]} />
            </RechartsBarChart>
        </ChartContainer>
    );
}