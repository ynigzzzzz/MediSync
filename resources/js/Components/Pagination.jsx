import { Link } from '@inertiajs/react';

/**
 * Shared pagination footer for Laravel length-aware paginators.
 * Props:
 *   meta   — the paginator object from the controller, e.g. { current_page, last_page, from, to, total, links }
 *   label  — noun for the "Showing X–Y of N <label>" line (default: "records")
 *   onPage — optional handler if a page wants to intercept clicks (otherwise Inertia Link is used)
 *
 * Usage:
 *   <Pagination meta={medicines} label="medicines" />
 */
export default function Pagination({ meta, label = 'records' }) {
    if (!meta || meta.last_page <= 1) return null;

    const current = meta.current_page;
    const last = meta.last_page;
    const from = meta.from ?? 0;
    const to = meta.to ?? 0;
    const total = meta.total ?? 0;

    // Build a compact page list: 1 … (c-1) c (c+1) … N, always including 1 and N.
    const pages = [];
    const window = 1;
    for (let p = 1; p <= last; p++) {
        if (p === 1 || p === last || (p >= current - window && p <= current + window)) {
            pages.push(p);
        } else if (pages[pages.length - 1] !== '…') {
            pages.push('…');
        }
    }

    return (
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-charcoal-blue opacity-60">
                Showing <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span> of{' '}
                <span className="font-medium">{total}</span> {label}
            </p>

            <nav className="flex items-center gap-1" aria-label="Pagination">
                {/* Previous */}
                {current > 1 ? (
                    <Link
                        href={meta.links?.[0]?.url || '#'}
                        preserveScroll
                        className="rounded-lg border border-eggshell px-3 py-1.5 text-xs font-medium text-charcoal-blue transition-colors hover:bg-cherry-blossom hover:text-burnt-rose"
                    >
                        <i className="fas fa-chevron-left mr-1" /> Prev
                    </Link>
                ) : (
                    <span className="rounded-lg border border-eggshell px-3 py-1.5 text-xs font-medium text-charcoal-blue opacity-40">
                        <i className="fas fa-chevron-left mr-1" /> Prev
                    </span>
                )}

                {/* Numbered pages with ellipsis */}
                {pages.map((p, i) =>
                    p === '…' ? (
                        <span key={`gap-${i}`} className="px-2 text-xs text-charcoal-blue opacity-60">
                            …
                        </span>
                    ) : (
                        <Link
                            key={p}
                            href={meta.links?.[p]?.url || `?page=${p}`}
                            preserveScroll
                            className={
                                'min-w-[32px] rounded-lg px-2.5 py-1.5 text-center text-xs font-medium transition-colors ' +
                                (p === current
                                    ? 'bg-cherry-blossom text-charcoal-blue'
                                    : 'border border-eggshell text-charcoal-blue hover:bg-cherry-blossom hover:text-burnt-rose')
                            }
                        >
                            {p}
                        </Link>
                    ),
                )}

                {/* Next */}
                {current < last ? (
                    <Link
                        href={meta.links?.[meta.links.length - 1]?.url || '#'}
                        preserveScroll
                        className="rounded-lg border border-eggshell px-3 py-1.5 text-xs font-medium text-charcoal-blue transition-colors hover:bg-cherry-blossom hover:text-burnt-rose"
                    >
                        Next <i className="fas fa-chevron-right ml-1" />
                    </Link>
                ) : (
                    <span className="rounded-lg border border-eggshell px-3 py-1.5 text-xs font-medium text-charcoal-blue opacity-40">
                        Next <i className="fas fa-chevron-right ml-1" />
                    </span>
                )}
            </nav>
        </div>
    );
}