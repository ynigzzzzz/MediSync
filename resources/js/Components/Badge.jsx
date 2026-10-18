import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-block px-2.5 py-1 rounded-full text-[0.7rem] font-semibold capitalize whitespace-nowrap',
    {
        variants: {
            tone: {
                success: 'bg-success-green text-white',
                warning: 'bg-warning-orange text-white',
                danger: 'bg-critical-red text-white',
                rose: 'bg-burnt-rose text-white',
                neutral: 'bg-charcoal-blue text-white',
            },
            outline: {
                true: 'bg-opacity-10 border',
                false: '',
            },
        },
        compoundVariants: [
            { tone: 'success', outline: true, className: 'bg-success-green/10 text-success-green border-success-green/25' },
            { tone: 'warning', outline: true, className: 'bg-warning-orange/10 text-warning-orange border-warning-orange/25' },
            { tone: 'danger', outline: true, className: 'bg-critical-red/10 text-critical-red border-critical-red/25' },
            { tone: 'rose', outline: true, className: 'bg-burnt-rose/10 text-burnt-rose border-burnt-rose/25' },
            { tone: 'neutral', outline: true, className: 'bg-charcoal-blue/10 text-charcoal-blue border-charcoal-blue/25' },
        ],
        defaultVariants: {
            tone: 'neutral',
            outline: false,
        },
    },
);

export default function Badge({ tone = 'neutral', children, outline = false, className = '' }) {
    return <span className={cn(badgeVariants({ tone, outline }), className)}>{children}</span>;
}