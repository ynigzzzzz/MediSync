import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] p-4 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
            <Head title="Reset Password" />

            <div className="w-full max-w-[420px] bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-eggshell/50">
                
                {/* Brand Header */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#FFB7CE] to-[#FF4D79] shadow-[0_8px_20px_rgba(255,100,150,0.3)] flex items-center justify-center mb-6">
                        <i className="fas fa-prescription-bottle-alt text-white text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-charcoal-blue tracking-tight">Reset Password</h2>
                    <p className="text-[15px] text-charcoal-blue/60 mt-2 text-center">
                        Enter your new password below.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    {/* Email Input (Read-only, passed from email link) */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-charcoal-blue/80 ml-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            readOnly
                            className="w-full px-4 py-3.5 bg-gray-100 border border-transparent rounded-2xl text-[15px] text-gray-500 cursor-not-allowed outline-none"
                        />
                        {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email}</p>}
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-charcoal-blue/80 ml-1">
                            New Password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <i className="fas fa-lock text-charcoal-blue/40 group-focus-within:text-cherry-blossom transition-colors" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                autoFocus
                                className="w-full pl-11 pr-12 py-3.5 bg-[#F2F2F7] border border-transparent rounded-2xl text-[15px] text-charcoal-blue focus:bg-white focus:border-cherry-blossom focus:ring-4 focus:ring-cherry-blossom/20 transition-all duration-300 outline-none"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-charcoal-blue/40 hover:text-charcoal-blue transition-colors focus:outline-none"
                            >
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-charcoal-blue/80 ml-1">
                            Confirm New Password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <i className="fas fa-lock text-charcoal-blue/40 group-focus-within:text-cherry-blossom transition-colors" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                                className="w-full pl-11 pr-4 py-3.5 bg-[#F2F2F7] border border-transparent rounded-2xl text-[15px] text-charcoal-blue focus:bg-white focus:border-cherry-blossom focus:ring-4 focus:ring-cherry-blossom/20 transition-all duration-300 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password_confirmation && <p className="text-xs text-red-500 ml-1">{errors.password_confirmation}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full mt-8 py-4 rounded-2xl font-semibold text-white bg-burnt-rose hover:bg-[#5c3338] shadow-[0_4px_14px_rgba(118,66,72,0.3)] hover:shadow-[0_6px_20px_rgba(118,66,72,0.4)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
                    >
                        {processing ? (
                            <span className="flex items-center justify-center gap-2">
                                <i className="fas fa-circle-notch fa-spin" /> Resetting...
                            </span>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}