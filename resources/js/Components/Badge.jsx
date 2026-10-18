/**
 * Shared pill badge used for stock status, transaction type, user role, and
 * account status across every page. Pass either a known `tone` (maps to the
 * brand palette) or a custom `color` hex for one-off cases.
 */
const TONES = {
    success: '#2E7D64',   // success-green: active, stock-in, admin-adjacent positive states
    warning: '#E67E22',   // warning-orange: low stock, inactive, expiring soon
    danger: '#DC3545',    // critical-red: out of stock, errors
    rose: '#764248',      // burnt-rose: stock-out, admin role
    neutral: '#2C3E50',   // charcoal-blue: assistant role, neutral info
};

export default function Badge({ tone = 'neutral', color, children, outline = false }) {
    const resolved = color ?? TONES[tone] ?? TONES.neutral;

    const style = outline
        ? {
              backgroundColor: `${resolved}1F`, // ~12% opacity
              color: resolved,
              border: `1px solid ${resolved}40`,
          }
        : {
              backgroundColor: resolved,
              color: '#fff',
          };

    return (
        <span
            className="inline-block px-2.5 py-1 rounded-full text-[0.7rem] font-semibold capitalize whitespace-nowrap"
            style={style}
        >
            {children}
        </span>
    );
}
