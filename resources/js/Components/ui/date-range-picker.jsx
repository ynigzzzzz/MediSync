import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/Components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * dateRange = { from: Date|undefined, to: Date|undefined }
 * onChange  = (range) => void
 */
export function DateRangePicker({ dateRange, onChange, className }) {
    const [open, setOpen] = useState(false);

    const label = dateRange?.from
        ? dateRange.to
            ? `${format(dateRange.from, 'MMM d, yyyy')} → ${format(dateRange.to, 'MMM d, yyyy')}`
            : format(dateRange.from, 'MMM d, yyyy')
        : 'Pick a date range';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal-blue',
                        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cherry-blossom',
                        className,
                    )}
                >
                    <i className="fas fa-calendar-days text-cherry-blossom" />
                    {label}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(r) => {
                        onChange(r);
                        if (r?.from && r?.to) setOpen(false);
                    }}
                    numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>
    );
}