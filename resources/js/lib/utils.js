import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard shadcn/ui helper: merges clsx-style conditional classes and
 * resolves Tailwind class conflicts (e.g. "px-2 px-4" → "px-4").
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
