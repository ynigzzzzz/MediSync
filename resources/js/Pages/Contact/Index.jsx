import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const inputCls = "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 placeholder-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all";

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
            
            <div className="mb-5">
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Contact / Support</h2>
                <p className="text-[13px] text-gray-500">Report a bug, request a feature, or reach the MediSync team.</p>
            </div>

            {flash?.success && <div className="mb-4 bg-green-50 text-green-700 border border-green-200 rounded-xl p-3 text-[13px] font-medium">{flash.success}</div>}

            <form onSubmit={submit} encType="multipart/form-data" className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-[16px] shadow-sm border border-gray-100 p-5 max-w-3xl">
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Full Name<span className="text-critical-red">*</span></label>
                    <input className={inputCls} value={data.full_name} onChange={e => setData('full_name', e.target.value)} required />
                    {errors.full_name && <p className="text-critical-red text-[11px] mt-1">{errors.full_name}</p>}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Email Address<span className="text-critical-red">*</span></label>
                    <input type="email" className={inputCls} value={data.email} onChange={e => setData('email', e.target.value)} required />
                    {errors.email && <p className="text-critical-red text-[11px] mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Contact Number</label>
                    <input type="tel" className={inputCls} value={data.contact_number} onChange={e => setData('contact_number', e.target.value)} />
                    {errors.contact_number && <p className="text-critical-red text-[11px] mt-1">{errors.contact_number}</p>}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Inquiry Type<span className="text-critical-red">*</span></label>
                    <select className={inputCls} value={data.inquiry_type} onChange={e => setData('inquiry_type', e.target.value)} required>
                        <option value="" disabled>Select...</option>
                        {Object.entries(inquiryTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                    {errors.inquiry_type && <p className="text-critical-red text-[11px] mt-1">{errors.inquiry_type}</p>}
                </div>
                <div className="md:col-span-2">
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Subject<span className="text-critical-red">*</span></label>
                    <input className={inputCls} value={data.subject} onChange={e => setData('subject', e.target.value)} required />
                    {errors.subject && <p className="text-critical-red text-[11px] mt-1">{errors.subject}</p>}
                </div>
                <div className="md:col-span-2">
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Message / Description<span className="text-critical-red">*</span></label>
                    <textarea rows={5} className={inputCls} value={data.message} onChange={e => setData('message', e.target.value)} required />
                    {errors.message && <p className="text-critical-red text-[11px] mt-1">{errors.message}</p>}
                </div>
                <div className="md:col-span-2">
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Attach File (Optional)</label>
                    <input type="file" className="text-[13px] text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[12px] file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-colors" onChange={e => setData('attachment', e.target.files[0] ? e.target.files[0] : null)} />
                    {errors.attachment && <p className="text-critical-red text-[11px] mt-1">{errors.attachment}</p>}
                </div>
                <div className="md:col-span-2 flex justify-end pt-2">
                    <button type="submit" disabled={processing} className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-6 py-2 hover:bg-black transition-colors shadow-sm disabled:opacity-50">
                        {processing ? 'Sending...' : 'Send Message'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}