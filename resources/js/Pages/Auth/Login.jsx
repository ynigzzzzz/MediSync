import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';

const COLORS = {
    cherryBlossom: '#FFB7CE',
    burntRose: '#764248',
    charcoalBlue: '#2C3E50',
    eggshell: '#DFE2CF',
};

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);

    function submit(e) {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    }

    return (
        <>
            <Head title="Log in" />

            <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <div className="flex-1 flex flex-col md:flex-row">
                    {/* Hero / Welcome panel */}
                    <div
                        className="text-white text-center md:text-left px-5 py-10 md:flex-1 md:flex md:flex-col md:justify-center md:p-[60px]"
                        style={{ background: `linear-gradient(135deg, ${COLORS.cherryBlossom}, ${COLORS.burntRose})` }}
                    >
                        <h2 className="text-lg">Welcome to</h2>
                        <h1 className="text-[32px] md:text-[48px] font-bold">MediSync!</h1>
                        <p className="mt-4 text-sm md:text-base leading-relaxed md:max-w-[400px] mx-auto md:mx-0">
                            Manage your pharmacy inventory with ease. Track medicines, monitor stock, and
                            streamline operations—all in one smart system.
                        </p>
                    </div>

                    {/* Login card */}
                    <div className="bg-white px-5 py-8 flex justify-center md:flex-1 md:items-center">
                        <div className="w-full max-w-[350px]">
                            <div className="font-bold text-xl mb-4 flex items-center justify-center md:justify-start gap-2" style={{ color: COLORS.burntRose }}>
                                <div
                                    className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-base"
                                    style={{ background: `linear-gradient(135deg, ${COLORS.cherryBlossom}, ${COLORS.burntRose})` }}
                                >
                                    <i className="fas fa-prescription-bottle-alt" />
                                </div>
                                MediSync
                            </div>

                            <h2 className="text-[22px] mb-2 text-center md:text-left font-semibold" style={{ color: COLORS.charcoalBlue }}>
                                Welcome back!
                            </h2>
                            <p className="text-[13px] mb-6 text-center md:text-left text-gray-500">
                                Login to manage your pharmacy inventory system.
                            </p>

                            {status && (
                                <div className="mb-4 rounded-lg p-2 text-sm" style={{ background: '#d4edda', color: '#155724' }}>
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit}>
                                <div className="mb-4">
                                    <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1 opacity-70" style={{ color: COLORS.charcoalBlue }}>
                                        Email Address
                                    </label>
                                    <div className="relative flex items-center">
                                        <i className="fas fa-envelope absolute left-3 text-sm opacity-35 pointer-events-none" style={{ color: COLORS.charcoalBlue }} />
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            autoFocus
                                            className="w-full py-[11px] pl-9 pr-3 text-sm rounded-lg outline-none bg-[#fafafa] focus:bg-white transition-colors"
                                            style={{ border: `1.5px solid ${COLORS.eggshell}` }}
                                        />
                                    </div>
                                    {errors.email && <p className="text-xs mt-1" style={{ color: '#DC3545' }}>{errors.email}</p>}
                                </div>

                                <div className="mb-1">
                                    <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1 opacity-70" style={{ color: COLORS.charcoalBlue }}>
                                        Password
                                    </label>
                                    <div className="relative flex items-center">
                                        <i className="fas fa-lock absolute left-3 text-sm opacity-35 pointer-events-none" style={{ color: COLORS.charcoalBlue }} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                            className="w-full py-[11px] pl-9 pr-9 text-sm rounded-lg outline-none bg-[#fafafa] focus:bg-white transition-colors"
                                            style={{ border: `1.5px solid ${COLORS.eggshell}` }}
                                        />
                                        <i
                                            onClick={() => setShowPassword((v) => !v)}
                                            className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} absolute right-3 text-sm opacity-35 hover:opacity-70 cursor-pointer`}
                                            style={{ color: COLORS.charcoalBlue }}
                                        />
                                    </div>
                                    {errors.password && <p className="text-xs mt-1" style={{ color: '#DC3545' }}>{errors.password}</p>}
                                </div>

                                <div className="text-right -mt-1 mb-4">
                                    {canResetPassword ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(true)}
                                            className="text-xs font-medium hover:underline"
                                            style={{ color: COLORS.burntRose }}
                                        >
                                            Forgot password?
                                        </button>
                                    ) : null}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-50"
                                    style={{
                                        background: `linear-gradient(270deg, ${COLORS.cherryBlossom}, ${COLORS.burntRose}, #a8556d, ${COLORS.cherryBlossom})`,
                                        backgroundSize: '300% 300%',
                                        animation: 'gradientShift 4s ease infinite',
                                        boxShadow: '0 4px 14px rgba(118,66,72,0.3)',
                                    }}
                                >
                                    {processing ? 'Logging in...' : 'Login Now'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <footer
                    className="text-center py-3 px-2.5 text-xs bg-white mt-auto"
                    style={{ color: '#555', borderTop: `1px solid ${COLORS.eggshell}` }}
                >
                    <p>
                        Developed by MediSync Team |{' '}
                        <a href="/contact" style={{ color: COLORS.burntRose }} className="hover:underline">Contact Us</a>
                    </p>
                    <p>© 2026 MediSync. All Rights Reserved</p>
                </footer>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && canResetPassword && (
                <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
            )}
        </>
    );
}

function ForgotPasswordModal({ onClose }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });
    const [sent, setSent] = useState(false);

    function submit(e) {
        e.preventDefault();
        post(route('password.email'), {
            preserveScroll: true,
            onSuccess: () => setSent(true),
        });
    }

    return (
        <div
            className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
            style={{ background: 'rgba(44,62,80,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-3xl w-full max-w-[440px] p-9 pt-9 relative max-h-[90vh] overflow-y-auto"
                style={{ boxShadow: '0 24px 60px rgba(118,66,72,0.22)' }}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-[18px] text-base opacity-40 hover:opacity-80"
                    style={{ color: COLORS.charcoalBlue }}
                    aria-label="Close"
                >
                    <i className="fas fa-times" />
                </button>

                <div className="flex justify-center mb-6">
                    <div className="w-[140px] bg-white rounded-[10px] p-3 pb-2" style={{ border: `3px solid ${COLORS.charcoalBlue}` }}>
                        <div
                            className="rounded p-2.5 pb-2 text-center"
                            style={{ background: `linear-gradient(135deg, ${COLORS.cherryBlossom}, ${COLORS.burntRose})` }}
                        >
                            <i className="fas fa-key text-white text-base block mb-1" />
                            <div className="text-white font-bold" style={{ fontSize: '8px' }}>Forgot Password?</div>
                        </div>
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.charcoalBlue }}>Forgot Password?</h2>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {sent ? (
                    <div className="rounded-lg p-2 text-sm mb-4" style={{ background: '#d4edda', color: '#155724' }}>
                        Check your email — a reset link is on its way.
                    </div>
                ) : (
                    <form onSubmit={submit}>
                        {errors.email && (
                            <div className="rounded-lg p-2 text-sm mb-4" style={{ background: '#f8d7da', color: '#721c24' }}>
                                {errors.email}
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block text-[11px] font-semibold uppercase mb-1 opacity-70" style={{ color: COLORS.charcoalBlue }}>
                                Email Address
                            </label>
                            <div className="relative flex items-center">
                                <i className="fas fa-envelope absolute left-3 text-sm opacity-35 pointer-events-none" style={{ color: COLORS.charcoalBlue }} />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    className="w-full py-[11px] pl-9 pr-3 text-sm rounded-[10px] outline-none bg-[#fafafa] focus:bg-white"
                                    style={{ border: `1.5px solid ${COLORS.eggshell}` }}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 rounded-[10px] font-bold text-sm text-white uppercase disabled:opacity-50"
                            style={{
                                background: `linear-gradient(270deg, ${COLORS.cherryBlossom}, ${COLORS.burntRose}, #a8556d, ${COLORS.cherryBlossom})`,
                                backgroundSize: '300% 300%',
                                animation: 'gradientShift 4s ease infinite',
                                boxShadow: '0 4px 18px rgba(118,66,72,0.3)',
                            }}
                        >
                            {processing ? 'Sending...' : 'Send Reset Link'}
                        </button>
                        <div className="mt-4 text-xs text-center text-gray-400">
                            <button type="button" onClick={onClose} className="font-semibold hover:underline" style={{ color: COLORS.burntRose }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
