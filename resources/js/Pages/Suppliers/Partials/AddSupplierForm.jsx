import { useForm } from "@inertiajs/react";

const inputCls =
    "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2.5 text-[14px] text-gray-900 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";

export default function AddSupplierForm({ onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        status: "active",
    });

    const submit = (e) => {
        e.preventDefault();
        post("/suppliers", {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 mb-4 animate-in fade-in slide-in-from-top-4">
            <h2 className="font-semibold text-gray-900 text-[15px] mb-5">
                Add New Supplier
            </h2>
            <form
                onSubmit={submit}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Name<span className="text-critical-red">*</span>
                    </label>
                    <input
                        type="text"
                        className={inputCls}
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        required
                    />
                    {errors.name && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.name}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Contact Person
                    </label>
                    <input
                        type="text"
                        className={inputCls}
                        value={data.contact_person}
                        onChange={(e) =>
                            setData("contact_person", e.target.value)
                        }
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Phone
                    </label>
                    <input
                        type="text"
                        className={inputCls}
                        value={data.phone}
                        onChange={(e) => setData("phone", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Email
                    </label>
                    <input
                        type="email"
                        className={inputCls}
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.email}
                        </p>
                    )}
                </div>
                <div className="md:col-span-2">
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Address
                    </label>
                    <input
                        type="text"
                        className={inputCls}
                        value={data.address}
                        onChange={(e) => setData("address", e.target.value)}
                    />
                </div>
                <div className="md:col-span-3 flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-full bg-[#FF4D79] text-white text-[14px] font-semibold px-8 py-2.5 hover:bg-[#E63E66] transition-colors shadow-sm"
                    >
                        {processing ? "Saving..." : "Save Supplier"}
                    </button>
                </div>
            </form>
        </div>
    );
}
