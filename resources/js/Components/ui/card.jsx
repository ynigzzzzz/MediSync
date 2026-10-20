import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Card = forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-[16px] bg-white shadow-sm border border-gray-100 text-gray-900', className)} {...props} />
));
Card.displayName = 'Card';

const CardHeader = forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1 p-4', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-[15px] font-semibold tracking-tight text-gray-900', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef(({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-gray-500', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-4 pt-0', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };