import { useEffect, useState } from 'react';

function readDismissed(key) {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

function statusBadge(daysLeft) {
    if (daysLeft < 0) {
        return { text: `Expired ${Math.abs(daysLeft)} day(s) ago`, cls: 'bg-red-100 text-red-700' };
    }
    if (daysLeft === 0) {
        return { text: 'Expires today', cls: 'bg-red-100 text-red-700' };
    }
    return {
        text: `${daysLeft} day(s) left`,
        cls: daysLeft <= 30 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-800',
    };
}

/**
 * Shared expiry warning: message + "View details" popup + "Dismiss".
 * Used on Stock Receiving, Stock Dispensing, and Medicine Catalog.
 *
 * data = { days, expired: [...], expiring: [...] } from App\Services\ExpiryWarning
 *
 * Dismiss is remembered for the browser session. If the number of expired or
 * expiring batches changes, the warning comes back on its own.
 */
export default function ExpiryWarning({ data, storageKey = 'expiry-warning' }) {
    const expired = data?.expired ?? [];
    const expiring = data?.expiring ?? [];
    const days = data?.days ?? 60;
    const signature = `${expired.length}:${expiring.length}`;

    const [dismissedSig, setDismissedSig] = useState(() => readDismissed(storageKey));
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    if ((expired.length === 0 && expiring.length === 0) || dismissedSig === signature) {
        return null;
    }

    const dismiss = () => {
        setOpen(false);
        setDismissedSig(signature);
        try {
            sessionStorage.setItem(storageKey, signature);
        } catch {
            /* storage unavailable: dismiss still works until reload */
        }
    };

    const rows = [...expired, ...expiring];

    return (
        <>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                <div className="flex min-w-0 items-center gap-2">
                    <i className="fas fa-triangle-exclamation" />
                    <div className="flex flex-wrap items-center gap-x-3">
                        {expired.length > 0 && (
                            <span className="font-medium text-red-700">
                                {expired.length} expired batch(es) still in stock.
                            </span>
                        )}
                        {expiring.length > 0 && (
                            <span>
                                {expiring.length} batch(es) expiring within {days} days.
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                    <button type="button" onClick={() => setOpen(true)} className="font-medium underline hover:no-underline">
                        View details
                    </button>
                    <button type="button" onClick={dismiss} className="font-medium hover:underline">
                        Dismiss
                    </button>
                </div>
            </div>

            {open && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setOpen(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Expiry details"
                        className="w-full max-w-3xl rounded-lg bg-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b p-4">
                            <h2 className="text-lg font-semibold text-charcoal-blue">
                                Batches expired or expiring within {days} days
                            </h2>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-xl leading-none text-gray-500 hover:text-gray-700"
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-4">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2 text-charcoal-blue">Medicine</th>
                                        <th className="p-2 text-charcoal-blue">Batch</th>
                                        <th className="p-2 text-charcoal-blue">Expiry</th>
                                        <th className="p-2 text-charcoal-blue">Qty left</th>
                                        <th className="p-2 text-charcoal-blue">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((b) => {
                                        const badge = statusBadge(b.days_left);
                                        return (
                                            <tr key={b.stock_in_id} className="border-b last:border-0">
                                                <td className="p-2 text-charcoal-blue">
                                                    {b.generic_name}
                                                    {b.brand_name ? ` (${b.brand_name})` : ''}
                                                </td>
                                                <td className="p-2 text-charcoal-blue">{b.batch_no}</td>
                                                <td className="p-2 text-charcoal-blue">{b.expiry_date}</td>
                                                <td className="p-2 text-charcoal-blue">{b.remaining_quantity}</td>
                                                <td className="p-2">
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                                                        {badge.text}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 border-t p-4">
                            <button type="button" onClick={() => setOpen(false)} className="rounded-md border px-4 py-2 text-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
