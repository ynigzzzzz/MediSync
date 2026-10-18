import {
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/Components/ui/chart';
import { CHART_COLORS } from '@/lib/chart-palette';

const CONFIG = {
    received:  { label: 'Received',  color: CHART_COLORS.green },
    dispensed: { label: 'Dispensed', color: CHART_COLORS.rose },
};

const TICK_PROPS = { fontSize: 11, fill: CHART_COLORS.charcoal };

export function ActivityAreaChart({ data, className = 'h-[260px] w-full' }) {
    return (
        <ChartContainer config={CONFIG} className={className}>
            <RechartsAreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="activity-fill-received" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={CHART_COLORS.green} stopOpacity={0.55} />
                        <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="activity-fill-dispensed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={CHART_COLORS.rose} stopOpacity={0.55} />
                        <stop offset="95%" stopColor={CHART_COLORS.rose} stopOpacity={0.03} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.eggshell} vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={TICK_PROPS} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tick={TICK_PROPS} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                <Area
                    type="monotone"
                    dataKey="received"
                    name="Received"
                    stroke={CHART_COLORS.green}
                    fill="url(#activity-fill-received)"
                    strokeWidth={2}
                />
                <Area
                    type="monotone"
                    dataKey="dispensed"
                    name="Dispensed"
                    stroke={CHART_COLORS.rose}
                    fill="url(#activity-fill-dispensed)"
                    strokeWidth={2}
                />
            </RechartsAreaChart>
        </ChartContainer>
    );
}