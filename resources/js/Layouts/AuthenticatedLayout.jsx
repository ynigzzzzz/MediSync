import { Link, usePage } from '@inertiajs/react';
import NotificationBell from '@/Components/NotificationBell';

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

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Sidebar — matches the original .sidebar: fixed 280px, pink gradient */}
            <aside
                className="fixed top-0 left-0 h-screen w-[280px] overflow-y-auto z-40"
                style={{
                    background: 'linear-gradient(180deg, #fff0f5 0%, #ffe4ee 60%, #ffd6e7 100%)',
                    borderRight: '1px solid rgba(244,143,177,0.2)',
                    boxShadow: '4px 0 20px rgba(255,100,150,0.08)',
                }}
            >
                {/* Logo */}
                <div className="text-center px-5 pt-6 pb-[18px] mb-5 border-b border-[rgba(255,100,150,0.15)]">
                    <div
                        className="w-12 h-12 rounded-[14px] inline-flex items-center justify-center mb-2.5"
                        style={{
                            background: 'linear-gradient(135deg, #FFB7CE 0%, #f48fb1 100%)',
                            boxShadow: '0 4px 14px rgba(255,100,150,0.25)',
                        }}
                    >
                        <i className="fas fa-briefcase-medical text-burnt-rose text-xl" />
                    </div>
                    <h3 className="text-2xl font-bold text-burnt-rose mb-0.5">MediSync</h3>
                    <p className="text-xs text-charcoal-blue opacity-70 m-0">Pharmacy Management</p>
                </div>

                {/* Nav */}
                <nav className="px-3.5 space-y-1">
                    {NAV_ITEMS.filter((item) => !item.hideFor?.includes(role)).map((item) => {
                        const isActive = currentPath.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="block rounded-[10px] font-medium text-sm text-charcoal-blue transition-all duration-200"
                                style={
                                    isActive
                                        ? {
                                              backgroundColor: '#FFB7CE',
                                              fontWeight: 600,
                                              boxShadow: '0 4px 14px rgba(255,100,150,0.22)',
                                              borderLeft: '3.5px solid #764248',
                                              padding: '12px 20px 12px 16.5px',
                                          }
                                        : { padding: '12px 20px' }
                                }
                            >
                                <i className={`fas ${item.icon} w-7 mr-3 text-center`} />
                                {item.label}
                            </Link>
                        );
                    })}

                    {role === 'admin' && (
                        <Link
                            href="/user-management"
                            className="block rounded-[10px] font-medium text-sm text-charcoal-blue transition-all duration-200"
                            style={
                                currentPath.startsWith('/user-management')
                                    ? {
                                          backgroundColor: '#FFB7CE',
                                          fontWeight: 600,
                                          boxShadow: '0 4px 14px rgba(255,100,150,0.22)',
                                          borderLeft: '3.5px solid #764248',
                                          padding: '12px 20px 12px 16.5px',
                                      }
                                    : { padding: '12px 20px' }
                            }
                        >
                            <i className="fas fa-users w-7 mr-3 text-center" />
                            User Management
                        </Link>
                    )}

                    {/* Suppliers — visible to admin + pharmacist */}
{(role === 'admin' || role === 'pharmacist') && (
    <Link
        href="/suppliers"
        className="block rounded-[10px] font-medium text-sm text-charcoal-blue transition-all duration-200"
        style={
            currentPath.startsWith('/suppliers')
                ? {
                      backgroundColor: '#FFB7CE',
                      fontWeight: 600,
                      boxShadow: '0 4px 14px rgba(255,100,150,0.22)',
                      borderLeft: '3.5px solid #764248',
                      padding: '12px 20px 12px 16.5px',
                  }
                : { padding: '12px 20px' }
        }
    >
        <i className="fas fa-truck w-7 mr-3 text-center" />
        Suppliers
    </Link>
)}

{/* Reports — visible to admin + pharmacist */}
{(role === 'admin' || role === 'pharmacist') && (
    <Link
        href="/reports"
        className="block rounded-[10px] font-medium text-sm text-charcoal-blue transition-all duration-200"
        style={
            currentPath.startsWith('/reports')
                ? {
                      backgroundColor: '#FFB7CE',
                      fontWeight: 600,
                      boxShadow: '0 4px 14px rgba(255,100,150,0.22)',
                      borderLeft: '3.5px solid #764248',
                      padding: '12px 20px 12px 16.5px',
                  }
                : { padding: '12px 20px' }
        }
    >
        <i className="fas fa-chart-pie w-7 mr-3 text-center" />
        Reports
    </Link>
)}

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="block w-full text-left rounded-[10px] font-medium text-sm text-charcoal-blue mt-4"
                        style={{ padding: '12px 20px' }}
                    >
                        <i className="fas fa-sign-out-alt w-7 mr-3 text-center" />
                        Logout
                    </Link>
                </nav>
            </aside>

            {/* Main content — fixed left offset for the sidebar, never centered. */}
            <div className="ml-[280px] h-screen overflow-y-auto bg-white" style={{ scrollbarGutter: 'stable'}}>
                {/* Top bar: Contact + Notifications as circle buttons (Messenger-style), then the user */}
                <div className="sticky top-0 z-30 flex justify-end items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white">
                    <Link
                        href="/contact"
                        aria-label="Contact / Support"
                        title="Contact / Support"
                        className={
                            'w-10 h-10 rounded-full flex items-center justify-center transition-colors ' +
                            (currentPath.startsWith('/contact')
                                ? 'bg-cherry-blossom text-burnt-rose'
                                : 'bg-gray-100 text-charcoal-blue hover:bg-cherry-blossom hover:text-burnt-rose')
                        }
                    >
                        <i className="fas fa-headset" />
                    </Link>

                    <NotificationBell />

                    <div className="flex items-center gap-2 ml-1">
                        {auth.user?.profile_image ? (
                            <img
                                src={`/storage/${auth.user.profile_image}`}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-cherry-blossom text-charcoal-blue flex items-center justify-center font-bold">
                                <i className="fas fa-user" />
                            </div>
                        )}
                        <div className="text-sm">
                            <div className="font-medium text-charcoal-blue">{auth.user?.full_name}</div>
                            <div className="text-xs text-charcoal-blue opacity-60 capitalize">{role}</div>
                        </div>
                    </div>
                </div>

                {/* Every page's content sits inside this fixed-padding box.
                   Pages should NOT add their own max-w/mx-auto/p-* wrapper —
                   just render their content directly, so spacing can never
                   drift between pages again. */}
                <div className="max-w-6xl px-10 py-8 space-y-6">{children}</div>
            </div>
        </div>
    );
}
