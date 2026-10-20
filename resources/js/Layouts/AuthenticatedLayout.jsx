import { Link, usePage } from '@inertiajs/react';
import NotificationBell from '@/Components/NotificationBell';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { href: '/medicine-list', label: 'Medicine Catalog', icon: 'fa-capsules' },
    { href: '/stock-receiving', label: 'Stock Receiving', icon: 'fa-arrow-down', hideFor: ['assistant'] },
    { href: '/dispensing', label: 'Stock Dispensing', icon: 'fa-arrow-up' },
    { href: '/transaction-history', label: 'Transaction History', icon: 'fa-history' },
];

export default function AuthenticatedLayout({ children }) {
    const { auth } = usePage().props;
    const currentPath = usePage().url;
    const role = auth.user?.role;

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
            
            {/* Pink Sidebar */}
            <aside className="w-[240px] flex-shrink-0 bg-gradient-to-b from-[#FFF0F5] via-[#FFE4EE] to-[#FFD6E7] rounded-[20px] shadow-sm border border-white/50 flex flex-col h-[calc(100vh-1.5rem)] overflow-hidden z-40">
                
                {/* Logo Area */}
                <div className="p-5 pb-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFB7CE] to-[#FF4D79] flex items-center justify-center shadow-sm">
                        <i className="fas fa-prescription-bottle-medical text-white text-sm" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight leading-none">MediSync</h3>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">Pharmacy</p>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-hide">
                    
                    {/* 1. Daily Operations */}
                    {NAV_ITEMS.filter((item) => !item.hideFor?.includes(role)).map((item) => (
                        <Link key={item.href} href={item.href} className={linkClasses(item.href)}>
                            <i className={`fas ${item.icon} w-5 text-center mr-2 opacity-70`} />
                            {item.label}
                        </Link>
                    ))}

                    {/* Divider for Management / Admin sections */}
                    {(role === 'admin' || role === 'pharmacist') && (
                        <div className="pt-2 pb-1">
                            <div className="h-px bg-gray-300/30 mx-2" />
                        </div>
                    )}

                    {/* 2. Management */}
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

                    {/* 3. Admin Only */}
                    {role === 'admin' && (
                        <Link href="/user-management" className={linkClasses('/user-management')}>
                            <i className="fas fa-users w-5 text-center mr-2 opacity-70" />
                            User Management
                        </Link>
                    )}
                </nav>

                {/* Logout */}
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

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-[calc(100vh-1.5rem)] overflow-hidden">
                
                {/* Compact Top Bar */}
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

                    <div className="flex items-center gap-2 ml-1 pl-3 border-l border-gray-200">
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
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <main className="flex-1 overflow-y-auto rounded-[16px] px-2 pb-2 scrollbar-hide">
                    <div className="max-w-[1150px] mx-auto space-y-4">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}