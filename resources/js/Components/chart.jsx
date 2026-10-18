import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';

const ChartContext = React.createContext({ config: {} });

function ChartContainer({ id, className, children, config = {}, ...props }) {
    return (
        <ChartContext.Provider value={{ config }}>
            <div className={cn('w-full text-xs', className)} {...props}>
                <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                    {children}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
}

function ChartTooltipContent({ active, payload, label, labelFormatter, className }) {
    if (!active || !payload?.length) return null;
    return (
        <div className={cn('rounded-lg border border-eggshell bg-white px-3 py-2 text-xs shadow-lg', className)}>
            {label && (
                <p className="font-medium text-charcoal-blue mb-1">
                    {labelFormatter ? labelFormatter(label) : label}
                </p>
            )}
            <div className="space-y-0.5">
                {payload.map((item, i) => (
                    <p key={i} className="text-charcoal-blue">
                        {item.name}: <strong>{item.value}</strong>
                    </p>
                ))}
            </div>
        </div>
    );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartContext };