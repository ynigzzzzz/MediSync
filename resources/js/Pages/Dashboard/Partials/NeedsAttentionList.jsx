import { Link } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/Components/ui/card";
import { cn } from "@/lib/utils";

const ATTENTION_TONES = {
    danger: "bg-critical-red/10 text-critical-red",
    warning: "bg-warning-orange/10 text-warning-orange",
    rose: "bg-burnt-rose/10 text-burnt-rose",
    info: "bg-gray-100 text-gray-600",
};

export default function NeedsAttentionList({ attention = [] }) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle>Needs Attention</CardTitle>
                <CardDescription>Issues that require action.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
                {attention.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-6">
                        <div className="w-10 h-10 rounded-full bg-success-green/10 flex items-center justify-center mb-2">
                            <i className="fas fa-check-circle text-sm text-success-green" />
                        </div>
                        <p className="text-[13px] font-medium text-gray-900">
                            All good ✨
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {attention.map((item, i) => (
                            <li key={i}>
                                <Link
                                    href={item.link}
                                    className="flex flex-col gap-2 px-4 py-3 hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "w-8 h-8 shrink-0 rounded-full flex items-center justify-center",
                                                ATTENTION_TONES[item.type] ||
                                                    ATTENTION_TONES.info,
                                            )}
                                        >
                                            <i
                                                className={`fas ${item.icon} text-xs`}
                                            />
                                        </div>
                                        <span className="flex-1 text-[13px] font-medium text-gray-900">
                                            {item.message}
                                        </span>
                                        <i className="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-gray-600 transition-colors" />
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
