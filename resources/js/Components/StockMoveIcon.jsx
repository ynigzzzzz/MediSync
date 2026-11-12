export default function StockMoveIcon({ direction, className = '' }) {
    const isIn = direction === 'in';
    return (
        <span className={`relative inline-flex items-center justify-center w-5 h-5 ${className}`}>
            <i className="fas fa-box text-[13px] opacity-70" />
            <i
                className={`fas fa-arrow-${isIn ? 'down' : 'up'} text-[8px] absolute ${
                    isIn ? '-bottom-1' : '-top-1'
                } ${isIn ? 'text-success-green' : 'text-burnt-rose'}`}
            />
        </span>
    );
}