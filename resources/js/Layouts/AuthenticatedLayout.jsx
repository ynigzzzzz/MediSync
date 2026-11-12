import { useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Toaster, toast } from 'sonner';
import NotificationBell from '@/Components/NotificationBell';
import StockMoveIcon from '@/Components/StockMoveIcon';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { href: '/medicine-list', label: 'Medicine Catalog', icon: 'fa-capsules' },
    { href: '/stock-receiving', label: 'Stock Receiving', stock: 'in', hideFor: ['assistant'] },
    { href: '/dispensing', label: 'Stock Dispensing', stock: 'out' },
    { href: '/transaction-history', label: 'Transaction History', icon: 'fa-history' },
];

export default function AuthenticatedLayout({ children }) {
    const { auth, flash } = usePage().props;
    const currentPath = usePage().url;
    const role = auth.user?.role;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.message) toast.success(flash.message);
        if (flash?.status) toast.success(flash.status);
        if (flash?.warning) toast.warning(flash.warning);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const linkClasses = (href) => {
        const isActive = currentPath.startsWith(href);
        return cn(
            'flex items-center rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all duration-300',
            isActive
                ? 'bg-white text-[#FF4D79] shadow-sm'
                : 'text-gray-600 hover:bg-white/50 hover:text-gray-900',
        );
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] font-sans flex p-3 gap-3 overflow-hidden">
            <Toaster position="top-right" richColors closeButton duration={3500} />

            {/* Sidebar */}
            <aside className="w-[240px] flex-shrink-0 bg-gradient-to-b from-[#FFF0F5] via-[#FFE4EE] to-[#FFD6E7] rounded-[20px] shadow-sm border border-white/50 flex flex-col h-[calc(100vh-1.5rem)] overflow-hidden z-40">
                <div className="p-5 pb-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFB7CE] to-[#FF4D79] flex items-center justify-center shadow-sm">
                        <i className="fas fa-prescription-bottle-medical text-white text-sm" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight leading-none">MediSync</h3>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">Pharmacy</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-hide">
                    {NAV_ITEMS.filter((item) => !item.hideFor?.includes(role)).map((item) => (
                        <Link key={item.href} href={item.href} className={linkClasses(item.href)}>
                            {item.stock ? (
                                <span className="w-5 text-center mr-2">
                                    <StockMoveIcon direction={item.stock} />
                                </span>
                            ) : (
                                <i className={`fas ${item.icon} w-5 text-center mr-2 opacity-70`} />
                            )}
                            {item.label}
                        </Link>
                    ))}

                    {(role === 'admin' || role === 'pharmacist') && (
                        <div className="pt-2 pb-1">
                            <div className="h-px bg-gray-300/30 mx-2" />
                        </div>
                    )}

                    {(role === 'admin' || role === 'pharmacist') && (
                        <Link href="/suppliers" className={linkClasses('/suppliers')}>
                            <i className="fas fa-truck w-5 text-center mr-2 opacity-70" />
                            Suppliers
                        </Link>
                    )}

                    {role === 'admin' && (
                        <Link href="/reports" className={linkClasses('/reports')}>
                            <i className="fas fa-chart-pie w-5 text-center mr-2 opacity-70" />
                            Reports
                        </Link>
                    )}

                    {role === 'admin' && (
                        <Link href="/user-management" className={linkClasses('/user-management')}>
                            <i className="fas fa-users w-5 text-center mr-2 opacity-70" />
                            User Management
                        </Link>
                    )}
                </nav>

                <div className="p-3 mt-auto">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex w-full items-center rounded-xl px-4 py-2.5 text-[13px] font-medium text-gray-600 transition-all duration-300 hover:bg-white/50 hover:text-red-500"
                    >
                        <i className="fas fa-sign-out-alt w-5 text-center mr-2 opacity-70" />
                        Logout
                    </Link>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col h-[calc(100vh-1.5rem)] overflow-hidden">
                <header className="flex-shrink-0 bg-white rounded-[16px] shadow-sm border border-gray-100 flex justify-end items-center gap-3 px-4 py-2.5 mb-3 z-30">
                    <Link
                        href="/contact"
                        className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs',
                            currentPath.startsWith('/contact')
                                ? 'bg-[#FF4D79] text-white shadow-sm'
                                : 'bg-[#F2F2F7] text-gray-500 hover:bg-gray-200',
                        )}
                    >
                        <i className="fas fa-headset" />
                    </Link>

                    <NotificationBell />

                    <Link href="/profile" className="flex items-center gap-2 ml-1 hover:bg-gray-50 p-1.5 rounded-xl transition-colors">
                        {auth.user?.profile_image ? (
                            <img src={`/storage/${auth.user.profile_image}`} className="w-8 h-8 rounded-full object-cover shadow-sm" alt="" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFB7CE] to-[#FF4D79] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                <i className="fas fa-user" />
                            </div>
                        )}
                        <div className="text-[13px]">
                            <div className="font-semibold text-gray-900 leading-tight">{auth.user?.full_name}</div>
                            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{role}</div>
                        </div>
                        <i className="fas fa-chevron-down text-[10px] text-gray-400 ml-1" />
                    </Link>
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden rounded-[16px] px-2 pb-2 scrollbar-hide">
                    <div className="max-w-[1150px] mx-auto space-y-4">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}