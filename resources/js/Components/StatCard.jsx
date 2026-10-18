/**
 * Shared stat card used across Dashboard, Medicine Catalog, Stock Receiving,
 * Dispensing, Transaction History, and User Management. One source of truth
 * so these can never drift out of sync with each other again.
 *
 * icon: FontAwesome class suffix, e.g. "fa-capsules"
 * color: hex string for the value text (defaults to charcoal-blue)
 * onClick/active: optional — turns the card into a clickable filter toggle
 */
export default function StatCard({ icon, label, value, color, onClick, active }) {
    const Tag = onClick ? 'button' : 'div';

    return (
        <Tag
            onClick={onClick}
            className={
                'relative overflow-hidden text-left bg-white border rounded-[15px] p-5 transition-all duration-300 hover:shadow-[0_5px_15px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 w-full ' +
                (active ? 'border-cherry-blossom ring-1 ring-cherry-blossom' : 'border-eggshell')
            }
        >
            {icon && <i className={`fas ${icon} absolute right-5 top-5 text-3xl text-charcoal-blue opacity-20`} />}
            <div className="text-[0.7rem] uppercase tracking-wide text-charcoal-blue mb-2">{label}</div>
            <div className="text-2xl font-bold" style={{ color: color ?? '#2C3E50' }}>{value}</div>
        </Tag>
    );
}
