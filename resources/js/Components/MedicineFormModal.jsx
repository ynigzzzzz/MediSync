import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { SearchableSelect } from '@/Components/ui/searchable-select';

const inputCls = "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 placeholder-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all";

const DEFAULT_TYPES = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Ointment', 'Drops'];
const DEFAULT_CATEGORIES = ['Allergies', 'Stomach Pain', 'Headache', 'Fever', 'Cough', 'Antibiotic', 'Vitamins'];

export default function MedicineFormModal({ open, onOpenChange, medicine = null, types = [], categories = [] }) {
    const editing = !!medicine;

    const form = useForm({
        generic_name: medicine?.generic_name ?? '',
        brand_name: medicine?.brand_name ?? '',
        type: medicine?.type ?? '',
        category: medicine?.category ?? '',
        dosage: medicine?.dosage ?? '',
        price: medicine?.price ?? '',
    });

    const allTypes = [...new Set([...DEFAULT_TYPES, ...types])];
    const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])];

    useEffect(() => {
        if (!open) {
            form.reset();
            form.clearErrors();
        }
    }, [open]);

    function submit(e) {
        e.preventDefault();
        const url = editing ? `/medicine-list/${medicine.medicine_id}` : '/medicine-list';
        const method = editing ? 'put' : 'post';

        form[method](url, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-[20px] max-w-2xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg">{editing ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Generic Name<span className="text-critical-red">*</span></label>
                            <input className={inputCls} value={form.data.generic_name} onChange={(e) => form.setData('generic_name', e.target.value)} required />
                            {form.errors.generic_name && <p className="text-critical-red text-[11px] mt-1">{form.errors.generic_name}</p>}
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Brand Name<span className="text-critical-red">*</span></label>
                            <input className={inputCls} value={form.data.brand_name} onChange={(e) => form.setData('brand_name', e.target.value)} required />
                            {form.errors.brand_name && <p className="text-critical-red text-[11px] mt-1">{form.errors.brand_name}</p>}
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Type<span className="text-critical-red">*</span></label>
                            <SearchableSelect value={form.data.type} onChange={(val) => form.setData('type', val)} options={allTypes} placeholder="Select type..." allowCustom={true} />
                            {form.errors.type && <p className="text-critical-red text-[11px] mt-1">{form.errors.type}</p>}
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Category<span className="text-critical-red">*</span></label>
                            <SearchableSelect value={form.data.category} onChange={(val) => form.setData('category', val)} options={allCategories} placeholder="Select category..." allowCustom={true} />
                            {form.errors.category && <p className="text-critical-red text-[11px] mt-1">{form.errors.category}</p>}
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Dosage<span className="text-critical-red">*</span></label>
                            <input className={inputCls} value={form.data.dosage} onChange={(e) => form.setData('dosage', e.target.value)} required placeholder="e.g. 500mg" />
                            {form.errors.dosage && <p className="text-critical-red text-[11px] mt-1">{form.errors.dosage}</p>}
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Selling Price (₱)<span className="text-critical-red">*</span></label>
                            <input type="number" step="0.01" min="0" className={inputCls} value={form.data.price} onChange={(e) => form.setData('price', e.target.value)} required />
                            {form.errors.price && <p className="text-critical-red text-[11px] mt-1">{form.errors.price}</p>}
                        </div>
                    </div>

                    {!editing && <p className="text-[12px] text-gray-500">New medicines start at 0 stock — add stock via Stock Receiving.</p>}

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full text-[13px] h-9">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing} className="rounded-full text-[13px] h-9 bg-gray-900 text-white hover:bg-black">
                            {form.processing ? 'Saving...' : (editing ? 'Save Changes' : 'Add Medicine')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}