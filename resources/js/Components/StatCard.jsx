import { cn } from '@/lib/utils';
import { Sparkline } from '@/Components/Charts/Sparkline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';

const VALUE_TONES = {
    default: 'text-gray-900',
    success: 'text-success-green',
    warning: 'text-warning-orange',
    danger: 'text-critical-red',
    rose: 'text-burnt-rose',
};

const TREND_STYLES = {
    up: 'bg-success-green/10 text-success-green',
    down: 'bg-critical-red/10 text-critical-red',
    flat: 'bg-gray-100 text-gray-500',
};

function TrendPill({ trend }) {
    if (!trend) return null;
    const cls = TREND_STYLES[trend.direction] || TREND_STYLES.flat;
    return (
        <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide', cls)}>
            {trend.label}
        </span>
    );
}

export default function StatCard({ icon, label, value, tone = 'default', trend, onClick, active, tooltip, sparklineData }) {
    const Tag = onClick ? 'button' : 'div';

    return (
        <Tag
            onClick={onClick}
            className={cn(
                'relative overflow-hidden text-left bg-white rounded-[16px] p-4 w-full shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
                active ? 'ring-2 ring-inset ring-[#FF4D79] border-transparent' : '',
            )}
        >
            {icon && (
                <div className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center">
                    <i className={cn('fas text-xs text-gray-400', icon)} />
                </div>
            )}
            
            <div className="flex items-center gap-1.5 mb-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
                {tooltip && (
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <i className="fas fa-circle-info text-[10px] text-gray-300 hover:text-gray-500 transition-colors cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{tooltip}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            <div className="flex items-end justify-between mt-2">
                <div className="flex items-baseline gap-2">
                    <div className={cn('text-2xl font-bold tracking-tight', VALUE_TONES[tone] || VALUE_TONES.default)}>{value}</div>
                    <TrendPill trend={trend} />
                </div>
                {sparklineData && (
                    <div className="-mb-2 -mr-2">
                        <Sparkline 
                            data={sparklineData} 
                            color={tone === 'danger' ? '#DC3545' : tone === 'warning' ? '#E67E22' : '#2E7D64'} 
                        />
                    </div>
                )}
            </div>
        </Tag>
    );
}