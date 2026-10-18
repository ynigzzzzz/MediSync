import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Table = forwardRef(({ className, ...props }, ref) => (
    <table ref={ref} className={cn('w-full text-sm', className)} {...props} />
));
Table.displayName = 'Table';

const TableHeader = forwardRef(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('text-left border-b border-eggshell text-charcoal-blue', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef(({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableRow = forwardRef(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn('border-b border-eggshell last:border-0 hover:bg-[rgba(223,226,207,0.3)]', className)}
        {...props}
    />
));
TableRow.displayName = 'TableRow';

const TableHead = forwardRef(({ className, ...props }, ref) => (
    <th ref={ref} className={cn('p-3 text-charcoal-blue font-medium text-xs uppercase tracking-wide', className)} {...props} />
));
TableHead.displayName = 'TableHead';

const TableCell = forwardRef(({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-3 text-charcoal-blue', className)} {...props} />
));
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };