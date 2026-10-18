import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import 'react-day-picker/dist/style.css';

export function Calendar({ className, ...props }) {
    return (
        <DayPicker
            className={cn('p-3', className)}
            modifiersClassNames={{
                selected: 'bg-cherry-blossom text-charcoal-blue font-semibold',
                today: 'text-burnt-rose font-semibold',
            }}
            {...props}
        />
    );
}