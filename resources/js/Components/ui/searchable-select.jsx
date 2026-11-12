import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';

export function SearchableSelect({ value, onChange, options = [], placeholder = 'Select...', allowCustom = false }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const getLabel = (opt) => (typeof opt === 'string' ? opt : opt.label);
    const getValue = (opt) => (typeof opt === 'string' ? opt : opt.value);

    const filteredOptions = options.filter((opt) =>
        getLabel(opt).toLowerCase().includes(search.toLowerCase())
    );

    const isNew = allowCustom && search && !options.some((opt) => getLabel(opt).toLowerCase() === search.toLowerCase());
    const current = options.find((opt) => getValue(opt) === value);
    const displayText = current ? getLabel(current) : (typeof value === 'string' ? value : '');

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="w-full flex items-center justify-between rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all text-left"
                >
                    <span className={cn("block truncate", !displayText && "text-gray-400")}>
                        {displayText || placeholder}
                    </span>
                    <i className="fas fa-chevron-down text-[10px] text-gray-400 ml-2" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-gray-200 shadow-lg" align="start">
                <div className="p-2 border-b border-gray-100">
                    <input
                        type="text"
                        className="w-full bg-transparent text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                    {filteredOptions.length === 0 && !allowCustom && (
                        <p className="p-3 text-[13px] text-gray-500 text-center">No results found.</p>
                    )}
                    {filteredOptions.map((opt) => (
                        <button
                            key={getValue(opt)}
                            type="button"
                            onClick={() => { onChange(getValue(opt), opt); setOpen(false); setSearch(''); }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-[14px] rounded-lg transition-colors",
                                value === getValue(opt) ? "bg-gray-100 font-semibold text-gray-900" : "text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            {getLabel(opt)}
                        </button>
                    ))}
                    {isNew && (
                        <button
                            type="button"
                            onClick={() => { onChange(search, search); setOpen(false); setSearch(''); }}
                            className="w-full text-left px-3 py-2 text-[14px] rounded-lg text-[#FF4D79] font-medium hover:bg-[#FF4D79]/10 transition-colors flex items-center gap-2"
                        >
                            <i className="fas fa-plus text-[10px]" /> Add "{search}"
                        </button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}