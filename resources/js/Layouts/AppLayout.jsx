import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, usePage, Head } from '@inertiajs/react';

/**
 * Bootstrap-styled layout, used only by pages that opted into Bootstrap
 * (currently just Transaction History). Everything else uses the Tailwind
 * AuthenticatedLayout — don't mix the two on one page, since Tailwind's
 * base reset and Bootstrap's base reset fight each other.
 */
export default function AppLayout({ title, children }) {
    const { auth } = usePage().props;

    return (
        <div className="min-vh-100 bg-light">
            <Head title={title} />

            <nav className="navbar navbar-expand navbar-light bg-white border-bottom">
                <div className="container-fluid px-4">
                    <span className="navbar-brand fw-bold">MediSync</span>

                    <div className="d-flex align-items-center gap-3 small">
                        <span>{auth.user?.full_name}</span>
                        <Link href={route('profile.edit')} className="text-decoration-none">
                            Profile
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="btn btn-link btn-sm text-decoration-none p-0"
                        >
                            Log Out
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="container-fluid px-4 py-4">{children}</main>
        </div>
    );
}
