import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors ' +
    'disabled:pointer-events-none disabled:opacity-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cherry-blossom',
    {
        variants: {
            variant: {
                default: 'bg-cherry-blossom text-charcoal-blue hover:bg-burnt-rose hover:text-white',
                destructive: 'bg-critical-red text-white hover:bg-critical-red/90',
                success: 'bg-success-green text-white hover:bg-success-green/90',
                outline: 'border border-gray-300 text-charcoal-blue hover:bg-gray-50',
                ghost: 'text-charcoal-blue hover:bg-gray-100',
                link: 'text-burnt-rose underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 px-3 text-xs',
                lg: 'h-10 px-6',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

const Button = forwardRef(({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
));
Button.displayName = 'Button';

export { Button, buttonVariants };