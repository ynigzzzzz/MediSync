import { useForm } from "@inertiajs/react";

const inputCls =
    "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2.5 text-[14px] text-gray-900 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";

export default function AddUserForm({ onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        full_name: "",
        email: "",
        password: "",
        role: "assistant",
        status: "active",
    });

    const submit = (e) => {
        e.preventDefault();
        post("/user-management", {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 mb-4 animate-in fade-in slide-in-from-top-4">
            <h2 className="font-semibold text-gray-900 text-[15px] mb-5">
                Add New User
            </h2>
            <form
                onSubmit={submit}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Full Name<span className="text-critical-red">*</span>
                    </label>
                    <input
                        type="text"
                        className={inputCls}
                        value={data.full_name}
                        onChange={(e) => setData("full_name", e.target.value)}
                        required
                    />
                    {errors.full_name && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.full_name}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Email Address
                        <span className="text-critical-red">*</span>
                    </label>
                    <input
                        type="email"
                        className={inputCls}
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        required
                    />
                    {errors.email && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.email}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Temporary Password
                        <span className="text-critical-red">*</span>
                    </label>
                    <input
                        type="password"
                        className={inputCls}
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        required
                    />
                    {errors.password && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.password}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Role<span className="text-critical-red">*</span>
                    </label>
                    <select
                        className={inputCls}
                        value={data.role}
                        onChange={(e) => setData("role", e.target.value)}
                    >
                        <option value="admin">Admin</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="assistant">Assistant</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Status<span className="text-critical-red">*</span>
                    </label>
                    <select
                        className={inputCls}
                        value={data.status}
                        onChange={(e) => setData("status", e.target.value)}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div className="md:col-span-3 flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-full bg-[#FF4D79] text-white text-[14px] font-semibold px-8 py-2.5 hover:bg-[#E63E66] transition-colors shadow-sm"
                    >
                        {processing ? "Saving..." : "Save User"}
                    </button>
                </div>
            </form>
        </div>
    );
}
