
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Link, usePage, Head } from "@inertiajs/react";

export default function AppLayout({ title, children }) {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <div className="min-vh-100 bg-light">
            <Head title={title} />

            <nav className="navbar navbar-expand navbar-light bg-white border-bottom">
                <div className="container-fluid px-4">
                    <span className="navbar-brand fw-bold">
                        MediSync
                    </span>

                    <div className="d-flex align-items-center gap-3 small">
                        {/* Profile Dropdown */}
                        <div className="dropdown">
                            <button
                                type="button"
                                className="btn btn-light border-0 dropdown-toggle d-flex align-items-center gap-2"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <span className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        fontSize: "13px",
                                    }}
                                >
                                    {user?.full_name
                                        ?.charAt(0)
                                        ?.toUpperCase() || "U"}
                                </span>

                                <span className="fw-semibold text-dark">
                                    {user?.full_name || "User"}
                                </span>
                            </button>

                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2">
                                <li>
                                    <div className="dropdown-header">
                                        <div className="fw-semibold text-dark">
                                            {user?.full_name}
                                        </div>

                                        <small className="text-muted">
                                            {user?.email}
                                        </small>
                                    </div>
                                </li>

                                <li>
                                    <hr className="dropdown-divider" />
                                </li>

                                <li>
                                    <Link
                                        href={route("profile.edit")}
                                        className="dropdown-item d-flex align-items-center gap-2"
                                    >
                                        <i className="fas fa-user-circle text-secondary" />
                                        My Profile
                                    </Link>
                                </li>

                                <li>
                                    <hr className="dropdown-divider" />
                                </li>

                                <li>
                                    <Link
                                        href={route("logout")}
                                        method="post"
                                        as="button"
                                        className="dropdown-item d-flex align-items-center gap-2 text-danger"
                                    >
                                        <i className="fas fa-sign-out-alt" />
                                        Logout
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="container-fluid px-4 py-4">
                {children}
            </main>
        </div>
    );
}
