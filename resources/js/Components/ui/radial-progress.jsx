import { cn } from '@/lib/utils';

export function RadialProgress({ value, max = 100, size = 120, strokeWidth = 12, label, color = '#10b981' }) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                    stroke="currentColor"
                    className="text-gray-100"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Foreground Ring */}
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-gray-900">{Math.round(percentage)}%</span>
                {label && <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>}
            </div>
        </div>
    );
}