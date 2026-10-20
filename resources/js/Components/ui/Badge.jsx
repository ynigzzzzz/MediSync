import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold capitalize whitespace-nowrap',
    {
        variants: {
            tone: {
                success: 'bg-success-green text-white',
                warning: 'bg-warning-orange text-white',
                danger: 'bg-critical-red text-white',
                rose: 'bg-burnt-rose text-white',
                neutral: 'bg-charcoal-blue text-white',
                outline: 'border border-eggshell text-charcoal-blue bg-white',
            },
        },
        defaultVariants: {
            tone: 'neutral',
        },
    },
);

export function Badge({ className, tone, ...props }) {
    return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };