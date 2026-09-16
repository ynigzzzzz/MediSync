import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function ContactIndex({ inquiryTypes, prefill }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        full_name: prefill.full_name,
        email: prefill.email,
        contact_number: '',
        inquiry_type: '',
        subject: '',
        message: '',
        attachment: null,
    });

    function submit(e) {
        e.preventDefault();
        post(route('contact.store'), {
            forceFormData: true,
            onSuccess: () => reset('subject', 'message', 'attachment', 'contact_number', 'inquiry_type'),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Contact / Support" />
            <>
                <div>
                    <h2 className="text-charcoal-blue font-semibold text-2xl mb-1">Contact / Support</h2>
                    <p className="text-charcoal-blue opacity-70 text-sm">
                        Report a bug, request a feature, or reach the MediSync team.
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-lg p-3 text-sm text-white bg-success-green">{flash.success}</div>
                )}

                <form onSubmit={submit} encType="multipart/form-data"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-[15px] border border-eggshell p-5 max-w-3xl">
                    <Field label="Full Name *" error={errors.full_name}>
                        <input className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                            value={data.full_name} onChange={(e) => setData('full_name', e.target.value)} required />
                    </Field>

                    <Field label="Email Address *" error={errors.email}>
                        <input type="email" className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                            value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                    </Field>

                    <Field label="Contact Number" error={errors.contact_number}>
                        <input type="tel" placeholder="e.g., +63 912 345 6789"
                            className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                            value={data.contact_number} onChange={(e) => setData('contact_number', e.target.value)} />
                    </Field>

                    <Field label="Inquiry Type *" error={errors.inquiry_type}>
                        <select className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                            value={data.inquiry_type} onChange={(e) => setData('inquiry_type', e.target.value)} required>
                            <option value="">Select...</option>
                            {Object.entries(inquiryTypes).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </Field>

                    <div className="md:col-span-2">
                        <Field label="Subject *" error={errors.subject}>
                            <input placeholder="Brief summary of your concern"
                                className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                value={data.subject} onChange={(e) => setData('subject', e.target.value)} required />
                        </Field>
                    </div>

                    <div className="md:col-span-2">
                        <Field label="Message / Description *" error={errors.message}>
                            <textarea rows={5} placeholder="Please provide detailed information..."
                                className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                value={data.message} onChange={(e) => setData('message', e.target.value)} required />
                        </Field>
                    </div>

                    <div className="md:col-span-2">
                        <Field label="Attach File (Optional)" error={errors.attachment}>
                            <input type="file" className="text-sm"
                                onChange={(e) => setData('attachment', e.target.files[0] ?? null)} />
                        </Field>
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-cherry-blossom text-charcoal-blue text-sm font-medium px-5 py-2 transition-colors hover:bg-burnt-rose hover:text-white disabled:opacity-50">
                            {processing ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </form>
            </>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-charcoal-blue mb-1">{label}</label>
            {children}
            {error && <p className="text-critical-red text-xs mt-1">{error}</p>}
        </div>
    );
}