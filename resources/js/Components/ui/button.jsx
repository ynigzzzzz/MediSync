import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'bg-gray-900 text-white hover:bg-black focus-visible:ring-gray-900 shadow-sm hover:shadow-md',
                accent: 'bg-[#FF4D79] text-white hover:bg-[#E63E66] focus-visible:ring-[#FF4D79] shadow-[0_4px_14px_rgba(255,77,121,0.3)] hover:shadow-[0_6px_20px_rgba(255,77,121,0.4)]',
                destructive: 'bg-critical-red text-white hover:bg-critical-red/90 focus-visible:ring-critical-red',
                outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-200',
                ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-200',
                link: 'text-[#FF4D79] underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-11 px-6 py-2',
                sm: 'h-9 px-4 text-sm',
                lg: 'h-14 px-8 text-base',
                icon: 'h-11 w-11',
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