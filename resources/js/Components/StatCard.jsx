import { cn } from '@/lib/utils';

const VALUE_TONES = {
    default: 'text-charcoal-blue',
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
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium', cls)}>
            {trend.label}
        </span>
    );
}

/**
 * Shared stat card used across the app.
 *
 *  icon   — FontAwesome class suffix, e.g. "fa-capsules"
 *  tone   — value color: 'default' | 'success' | 'warning' | 'danger' | 'rose'
 *  trend  — optional { direction: 'up' | 'down' | 'flat', label: string }
 *  onClick / active — optional: turns the card into a clickable filter toggle
 */
export default function StatCard({ icon, label, value, tone = 'default', trend, onClick, active }) {
    const Tag = onClick ? 'button' : 'div';

    return (
        <Tag
            onClick={onClick}
            className={cn(
                'relative overflow-hidden text-left bg-white border rounded-[15px] p-5 w-full',
                'transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
                active ? 'border-cherry-blossom ring-1 ring-cherry-blossom' : 'border-eggshell',
            )}
        >
            {icon && (
                <i className={cn('fas absolute right-5 top-5 text-3xl text-charcoal-blue opacity-20', icon)} />
            )}
            <div className="text-[0.7rem] uppercase tracking-wide text-charcoal-blue mb-2">{label}</div>
            <div className="flex items-baseline flex-wrap gap-2">
                <div className={cn('text-2xl font-bold', VALUE_TONES[tone] || VALUE_TONES.default)}>{value}</div>
                <TrendPill trend={trend} />
            </div>
        </Tag>
    );
}