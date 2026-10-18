import { PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/Components/ui/chart';
import { CHART_COLORS } from '@/lib/chart-palette';

export function PieChart({ data, nameKey, dataKey, height = 260, colors = [] }) {
    const fallbackColors = [
        CHART_COLORS.green, 
        CHART_COLORS.orange, 
        CHART_COLORS.red, 
        CHART_COLORS.rose, 
        CHART_COLORS.charcoal
    ];

    return (
        <ChartContainer config={{}} className={`h-[${height}px] w-full`}>
            <RechartsPieChart>
                <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                <Pie
                    data={data}
                    dataKey={dataKey}
                    nameKey={nameKey}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={2}
                    stroke="none"
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length] || fallbackColors[index % fallbackColors.length]}
                        />
                    ))}
                </Pie>
            </RechartsPieChart>
        </ChartContainer>
    );
}