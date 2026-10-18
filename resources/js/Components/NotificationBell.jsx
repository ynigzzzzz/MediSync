import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';

// Tailwind tone per notification type — pure classNames, no inline styles
const TYPE_STYLE = {
    out_of_stock: { icon: 'fa-circle-xmark',        unread: 'bg-critical-red/20 text-critical-red',     read: 'bg-critical-red/10 text-critical-red/60' },
    low_stock:    { icon: 'fa-triangle-exclamation', unread: 'bg-warning-orange/20 text-warning-orange', read: 'bg-warning-orange/10 text-warning-orange/60' },
    expiring:     { icon: 'fa-hourglass-half',       unread: 'bg-warning-orange/20 text-warning-orange', read: 'bg-warning-orange/10 text-warning-orange/60' },
    expired:      { icon: 'fa-ban',                  unread: 'bg-critical-red/20 text-critical-red',     read: 'bg-critical-red/10 text-critical-red/60' },
};

function timeAgo(iso) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function NotificationBell() {
    const { notifications } = usePage().props;
    const [open, setOpen] = useState(false);

    const unread = notifications?.unread ?? 0;
    const items = notifications?.items ?? [];

    function openItem(n) {
        setOpen(false);
        router.post(`/notifications/${n.notification_id}/read`);
    }

    function markAllRead() {
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label="Notifications"
                    title="Notifications"
                    className={
                        'relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ' +
                        (open
                            ? 'bg-cherry-blossom text-burnt-rose'
                            : 'bg-gray-100 text-charcoal-blue hover:bg-cherry-blossom hover:text-burnt-rose')
                    }
                >
                    <i className="fas fa-bell" />
                    {unread > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-critical-red text-white text-[0.65rem] font-semibold flex items-center justify-center">
                            {unread > 10 ? '10+' : unread}
                        </span>
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent>
                <div className="flex items-center justify-between px-4 py-3 border-b border-eggshell">
                    <h3 className="font-semibold text-charcoal-blue">Notifications</h3>
                    {unread > 0 && (
                        <button onClick={markAllRead} className="text-xs font-medium text-burnt-rose hover:underline">
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-gray-400">
                            <i className="fas fa-check-circle text-2xl mb-2 block text-success-green opacity-60" />
                            You're all caught up.
                        </div>
                    ) : (
                        items.map((n) => {
                            const isUnread = !n.read_at;
                            const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.low_stock;
                            const toneClass = isUnread ? style.unread : style.read;
                            return (
                                <button
                                    key={n.notification_id}
                                    onClick={() => openItem(n)}
                                    className={
                                        'w-full text-left flex gap-3 px-4 py-3 border-b border-eggshell last:border-0 transition-colors ' +
                                        (isUnread ? 'bg-cherry-blossom/10 hover:bg-cherry-blossom/15' : 'bg-white hover:bg-gray-50')
                                    }
                                >
                                    <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${toneClass}`}>
                                        <i className={`fas ${style.icon} text-sm`} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className={'text-sm ' + (isUnread ? 'font-semibold text-charcoal-blue' : 'text-gray-500')}>
                                            {n.title}
                                        </div>
                                        <div className={'text-xs ' + (isUnread ? 'text-charcoal-blue' : 'text-gray-400')}>
                                            {n.message}
                                        </div>
                                        <div className="text-[0.7rem] mt-1 text-gray-400">{timeAgo(n.created_at)}</div>
                                    </div>

                                    {isUnread && <span className="w-2 h-2 mt-2 rounded-full bg-burnt-rose shrink-0" />}
                                </button>
                            );
                        })
                    )}
                </div>

                {unread > items.filter((n) => !n.read_at).length && (
                    <div className="px-4 py-2 text-center text-xs text-gray-400 border-t border-eggshell">
                        Showing the 10 most recent · {unread} unread in total
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}