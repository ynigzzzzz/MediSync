import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import 'react-day-picker/dist/style.css';

export function Calendar({ className, ...props }) {
    return (
        <DayPicker
            className={cn('p-3', className)}
            classNames={{
                day_selected: 'bg-cherry-blossom text-charcoal-blue font-semibold rounded-md',
                day_today: 'text-burnt-rose font-semibold',
                day: 'hover:bg-cherry-blossom/20 rounded-md',
                head_cell: 'text-charcoal-blue font-medium text-xs uppercase',
            }}
            {...props}
        />
    );
}