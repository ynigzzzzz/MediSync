import { useState } from 'react';
import { format, subDays, startOfMonth } from 'date-fns';
import { Calendar } from '@/Components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';

export function DateRangePicker({ dateRange, onChange, className }) {
    const [open, setOpen] = useState(false);

    const label = dateRange?.from
        ? dateRange.to
            ? `${format(dateRange.from, 'MMM d, yyyy')} → ${format(dateRange.to, 'MMM d, yyyy')}`
            : format(dateRange.from, 'MMM d, yyyy')
        : 'Pick a date range';

    function setPreset(days) {
        const to = new Date();
        const from = subDays(to, days);
        onChange({ from, to });
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 shadow-sm',
                        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-100',
                        className,
                    )}
                >
                    <i className="fas fa-calendar-days text-gray-400" />
                    {label}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex flex-col" align="end">
                <div className="flex flex-col border-b border-gray-100 p-2 space-y-1">
                    <button onClick={() => setPreset(6)} className="text-left px-2 py-1.5 text-[12px] font-medium rounded hover:bg-gray-100 text-gray-700">Last 7 days</button>
                    <button onClick={() => setPreset(29)} className="text-left px-2 py-1.5 text-[12px] font-medium rounded hover:bg-gray-100 text-gray-700">Last 30 days</button>
                    <button onClick={() => setPreset(89)} className="text-left px-2 py-1.5 text-[12px] font-medium rounded hover:bg-gray-100 text-gray-700">Last 90 days</button>
                </div>
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