import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';

/* ───────────────────────── Static data (edit freely) ───────────────────────── */

// Background pill tray
const WELLS = Array.from({ length: 250 }, (_, i) => i);
const PILL_TILTS = ['rotate-12', '-rotate-45', 'rotate-45', '-rotate-12', 'rotate-90', '-rotate-[15deg]'];
const hasPill = (i) => (i * 17 + 7) % 11 === 0;

// Team section. Add or remove people here.
const TEAM = [
    { name: 'Ynigo Panisa', role: 'Project Leader · Developer' },
    { name: 'Marinel Delima', role: 'Designer' },
    { name: 'Xyza Paz', role: 'Technical Writer · System Analyst' },
    { name: 'Dahn Gabutero', role: 'Database Administrator' },
    { name: 'Renji Chatto', role: 'Systems Administrator' },
    { name: 'Faith Magoncia', role: 'Contributor' },
];

const initials = (name) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

/* ───────────────────────── Shared class strings ───────────────────────── */

const inputClass =
    'w-full rounded-xl border border-transparent bg-[#F2F2F7] py-3.5 text-[16px] text-gray-900 outline-none ' +
    'transition-all duration-300 placeholder:text-gray-400 ' +
    'focus:border-[#FF4D79] focus:bg-white focus:ring-4 focus:ring-[#FF4D79]/20';

const primaryButtonClass =
    'mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#FF4D79] py-4 text-[16px] font-semibold text-white ' +
    'shadow-[0_8px_20px_-6px_rgba(255,77,121,0.6)] transition-all duration-300 ' +
    'hover:-translate-y-0.5 hover:bg-[#E63E66] hover:shadow-[0_10px_25px_-6px_rgba(255,77,121,0.8)] ' +
    'active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0';

/* ───────────────────────── Small components ───────────────────────── */

function Pill({ className = '' }) {
    return (
        <span className={`flex h-3 w-7 overflow-hidden rounded-full border border-white/20 shadow-sm ${className}`}>
            <span className="w-1/2 bg-white" />
            <span className="w-1/2 bg-[#FF4D79]" />
        </span>
    );
}

function Banner({ tone = 'error', children }) {
    const styles =
        tone === 'success'
            ? 'border-green-100 bg-green-50 text-green-700'
            : 'border-red-100 bg-red-50 text-red-600';
    const icon = tone === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    return (
        <div role="alert" className={`mb-6 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${styles}`}>
            <i className={`fas ${icon} mt-0.5`} />
            <span>{children}</span>
        </div>
    );
}

/* ───────────────────────── Page ───────────────────────── */

export default function Login({ status, canResetPassword = true }) {
    const [mode, setMode] = useState('signin');
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm({ email: '', password: '' });
    const resetForm = useForm({ email: '' });

    const signingIn = mode === 'signin';

    const switchMode = (next) => {
        form.clearErrors();
        resetForm.clearErrors();
        setMode(next);
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('login'), { onFinish: () => form.reset('password') });
    };

    const submitReset = (e) => {
        e.preventDefault();
        resetForm.post(route('password.email'));
    };

    return (
        <main className="relative flex min-h-screen flex-col items-center gap-10 overflow-hidden bg-[#F7F4F6] px-4 py-8 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif] selection:bg-[#FF4D79] selection:text-white md:px-8">
            <Head title="Sign in — MediSync" />

            {/* Soft background glow */}
            <div className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#FFB7CE]/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-[#FF8FAB]/25 blur-3xl" />

            {/* ═════════════════════ LOGIN CARD ═════════════════════ */}
            <div className="relative z-10 flex h-[85vh] min-h-[650px] w-full max-w-[1500px] shrink-0 overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] ring-1 ring-black/5">

                {/* Left: hero */}
                <div className="group relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[58%] xl:p-16">
                    <div className="absolute inset-0 bg-gradient-to-bl from-[#FFB7CE] via-[#FF8FAB] to-[#FF4D79] transition-transform duration-1000 ease-out group-hover:scale-110">
                        <div className="absolute inset-0 grid auto-rows-[4rem] grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] place-items-center opacity-30">
                            {WELLS.map((i) => (
                                <span
                                    key={i}
                                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/5 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)]"
                                >
                                    {hasPill(i) && (
                                        <Pill
                                            className={`${PILL_TILTS[i % PILL_TILTS.length]} transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-0`}
                                        />
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Light and depth */}
                    <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/30 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#FF2E63]/40 blur-3xl" />

                    <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between">
                        {/* Brand */}
                        <div className="flex items-center gap-3">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 text-white">
                                <i className="fas fa-prescription-bottle-medical text-xl" />
                            </span>
                            <span className="text-2xl font-bold tracking-tight text-white">MediSync</span>
                        </div>

                        {/* Message */}
                        <div>
                            <h2 className="text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6 xl:text-6xl">
                                Manage your <br />
                                pharmacy with <br />
                                precision.
                            </h2>
                            <p className="text-white text-lg max-w-md font-medium leading-relaxed">
                                Track inventory, monitor stock levels, and streamline daily operations — all in one smart system.
                            </p>

                        </div>
                    </div>
                </div>

                {/* Right: form */}
                <div className="relative flex w-full flex-col justify-center bg-white px-8 py-12 sm:px-12 lg:w-[42%] lg:px-16">
                    {/* Mobile brand */}
                    <div className="absolute left-8 top-8 flex items-center gap-2 lg:hidden">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB7CE] to-[#FF4D79] text-white shadow-lg">
                            <i className="fas fa-prescription-bottle-medical" />
                        </span>
                        <span className="text-xl font-bold text-gray-900">MediSync</span>
                    </div>

                    <div className="mx-auto w-full max-w-sm">
                        <div className="mb-8">
                            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-[#FF4D79]">
                                Pharmacy Inventory System
                            </p>
                            <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
                                {signingIn ? 'Welcome back' : 'Reset password'}
                            </h1>
                            <p className="text-[15px] text-gray-500">
                                {signingIn
                                    ? 'Enter your credentials to access your account.'
                                    : "Enter your email and we'll send you a secure reset link."}
                            </p>
                        </div>

                        {status && <Banner tone="success">{status}</Banner>}
                        {signingIn && form.errors.email && <Banner>{form.errors.email}</Banner>}

                        {signingIn ? (
                            <form onSubmit={submit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="text-[13px] font-medium text-gray-700">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <i className="fas fa-envelope text-gray-400" />
                                        </span>
                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="username"
                                            autoFocus
                                            required
                                            value={form.data.email}
                                            onChange={(e) => form.setData('email', e.target.value)}
                                            className={`${inputClass} pl-11 pr-4`}
                                            placeholder="admin@medisync.test"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="password" className="text-[13px] font-medium text-gray-700">
                                            Password
                                        </label>
                                        {canResetPassword && (
                                            <button
                                                type="button"
                                                onClick={() => switchMode('reset')}
                                                className="text-[13px] font-medium text-[#FF4D79] transition-colors hover:text-gray-900"
                                            >
                                                Forgot password?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <i className="fas fa-lock text-gray-400" />
                                        </span>
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            required
                                            value={form.data.password}
                                            onChange={(e) => form.setData('password', e.target.value)}
                                            className={`${inputClass} pl-11 pr-12`}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors hover:text-gray-900 focus:outline-none"
                                        >
                                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                        </button>
                                    </div>
                                    {form.errors.password && <p className="mt-1 text-xs text-red-500">{form.errors.password}</p>}
                                </div>

                                <button type="submit" disabled={form.processing} className={primaryButtonClass}>
                                    {form.processing ? (
                                        <>
                                            <i className="fas fa-circle-notch fa-spin" /> Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={submitReset} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="reset-email" className="text-[13px] font-medium text-gray-700">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <i className="fas fa-envelope text-gray-400" />
                                        </span>
                                        <input
                                            id="reset-email"
                                            type="email"
                                            autoComplete="email"
                                            autoFocus
                                            required
                                            value={resetForm.data.email}
                                            onChange={(e) => resetForm.setData('email', e.target.value)}
                                            className={`${inputClass} pl-11 pr-4`}
                                            placeholder="admin@medisync.test"
                                        />
                                    </div>
                                    {resetForm.errors.email && <p className="mt-1 text-xs text-red-500">{resetForm.errors.email}</p>}
                                </div>

                                <button type="submit" disabled={resetForm.processing} className={primaryButtonClass}>
                                    {resetForm.processing ? 'Sending...' : 'Send reset link'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => switchMode('signin')}
                                    className="w-full py-2 text-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
                                >
                                    <i className="fas fa-arrow-left mr-1.5" /> Back to sign in
                                </button>
                            </form>
                        )}

                    </div>

                </div>
            </div>

            {/* ═════════════════════ TEAM SECTION (outline only) ═════════════════════ */}
            <section
                id="team"
                className="relative z-10 grid w-full max-w-[1500px] shrink-0 gap-8 rounded-[32px] border-[1.5px] border-[#FF4D79]/40 bg-transparent p-6 md:grid-cols-2 md:gap-12 md:p-10"
            >
                {/* Photo, inset from the outline */}
                <div className="relative min-h-[320px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#FFB7CE] to-[#FF4D79] md:min-h-[480px]">
                    <img
                        src="/images/group-photo.jpg"
                        alt="The MediSync team"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => e.currentTarget.classList.add('hidden')}
                    />
                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/30 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md">
                        <i className="fas fa-heart text-xs" /> The MediSync team
                    </span>
                </div>

                {/* Text and team grid */}
                <div className="flex flex-col justify-center px-1 py-2 md:px-6">
                    <div className="mb-6 h-1 w-16 rounded-full bg-[#FF4D79]" />
                    <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">Meet the Team</h2>
                    <p className="mb-8 text-[17px] leading-relaxed text-gray-600">
                        MediSync was built by a team that cares about precision and modern design in pharmacy management.
                    </p>

                    <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.2em] text-[#FF4D79]">Contributors</p>
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {TEAM.map((m) => (
                            <li
                                key={m.name}
                                className="flex items-center gap-3 rounded-2xl border border-[#FF4D79]/20 bg-white/50 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF4D79]/50 hover:bg-white"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB7CE] to-[#FF4D79] text-sm font-bold text-white shadow-md">
                                    {initials(m.name)}
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold text-gray-900">{m.name}</span>
                                    <span className="block text-[13px] leading-snug text-gray-500">{m.role}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Page footer */}
            <footer className="relative z-10 mt-auto pb-2 text-center text-[12px] text-gray-400">
                © {new Date().getFullYear()} MediSync. All rights reserved.
            </footer>
        </main>
    );
}
