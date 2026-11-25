import { useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Toaster, toast } from 'sonner';
import NotificationBell from '@/Components/NotificationBell';
import StockMoveIcon from '@/Components/StockMoveIcon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
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
        <>
            {/* Fixed application shell: the document itself cannot scroll */}
            <div className="fixed inset-0 z-0 flex h-screen w-screen gap-3 overflow-hidden bg-[#F5F5F7] p-3 font-sans">

                <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    duration={3500}
                />

                {/* SIDEBAR: Always stationary */}
                <aside className="flex h-full min-h-0 w-[240px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-white/50 bg-gradient-to-b from-[#FFF0F5] via-[#FFE4EE] to-[#FFD6E7] shadow-sm">

                    <div className="flex shrink-0 items-center gap-2.5 p-5 pb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FFB7CE] to-[#FF4D79] shadow-sm">
                            <i className="fas fa-prescription-bottle-medical text-sm text-white" />
                        </div>

                        <div>
                            <h3 className="text-lg font-bold leading-none tracking-tight text-gray-900">
                                MediSync
                            </h3>
                            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                                Pharmacy
                            </p>
                        </div>
                    </div>

                    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3 scrollbar-hide">
                        {NAV_ITEMS.filter(
                            (item) => !item.hideFor?.includes(role),
                        ).map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={linkClasses(item.href)}
                            >
                                {item.stock ? (
                                    <span className="mr-2 w-5 text-center">
                                        <StockMoveIcon direction={item.stock} />
                                    </span>
                                ) : (
                                    <i className={`fas ${item.icon} mr-2 w-5 text-center opacity-70`} />
                                )}
                                {item.label}
                            </Link>
                        ))}

                        {(role === 'admin' || role === 'pharmacist') && (
                            <div className="pb-1 pt-2">
                                <div className="mx-2 h-px bg-gray-300/30" />
                            </div>
                        )}

                        {(role === 'admin' || role === 'pharmacist') && (
                            <Link
                                href="/suppliers"
                                className={linkClasses('/suppliers')}
                            >
                                <i className="fas fa-truck mr-2 w-5 text-center opacity-70" />
                                Suppliers
                            </Link>
                        )}

                        {role === 'admin' && (
                            <Link
                                href="/reports"
                                className={linkClasses('/reports')}
                            >
                                <i className="fas fa-chart-pie mr-2 w-5 text-center opacity-70" />
                                Reports
                            </Link>
                        )}

                        {role === 'admin' && (
                            <Link
                                href="/user-management"
                                className={linkClasses('/user-management')}
                            >
                                <i className="fas fa-users mr-2 w-5 text-center opacity-70" />
                                User Management
                            </Link>
                        )}
                    </nav>
                </aside>

                {/* MAIN AREA */}
                <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

                    {/* HEADER: Always stationary */}
                    <header className="z-30 mb-3 flex shrink-0 items-center justify-end gap-3 rounded-[16px] border border-gray-100 bg-white px-4 py-2.5 shadow-sm">

                        <Link
                            href="/contact"
                            className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors',
                                currentPath.startsWith('/contact')
                                    ? 'bg-[#FF4D79] text-white shadow-sm'
                                    : 'bg-[#F2F2F7] text-gray-500 hover:bg-gray-200',
                            )}
                        >
                            <i className="fas fa-headset" />
                        </Link>

                        <NotificationBell />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="ml-1 flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-gray-50 focus:outline-none"
                                >
                                    {auth.user?.profile_image ? (
                                        <img
                                            src={`/storage/${auth.user.profile_image}`}
                                            className="h-8 w-8 rounded-full object-cover shadow-sm"
                                            alt="Profile"
                                        />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB7CE] to-[#FF4D79] text-xs font-bold text-white shadow-sm">
                                            <i className="fas fa-user" />
                                        </div>
                                    )}

                                    <div className="text-left text-[13px]">
                                        <div className="font-semibold leading-tight text-gray-900">
                                            {auth.user?.full_name}
                                        </div>
                                        <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                                            {role}
                                        </div>
                                    </div>

                                    <i className="fas fa-chevron-down ml-1 text-[10px] text-gray-400" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>
                                    Signed in as
                                </DropdownMenuLabel>

                                <div className="-mt-1 px-2 pb-2">
                                    <p className="truncate text-[12px] text-gray-500">
                                        {auth.user?.email}
                                    </p>
                                </div>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/profile"
                                        className="flex w-full cursor-pointer items-center gap-2"
                                    >
                                        <i className="fas fa-user-circle w-4 text-gray-400" />
                                        My Profile
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="flex w-full cursor-pointer items-center gap-2 text-critical-red focus:bg-critical-red/10 focus:text-critical-red"
                                    >
                                        <i className="fas fa-sign-out-alt text-critical-red/70" />
                                        Logout
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </header>

                    {/* CONTENT: The ONLY main page scroll container */}
                    <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[16px] px-2 pb-4 scrollbar-hide">

                        <div className="mx-auto w-full max-w-[1150px] space-y-4">
                            {children}
                        </div>

                    </main>
                </div>
            </div>
        </>
    );
}
