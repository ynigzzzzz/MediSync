import { useState } from "react";
import { router } from "@inertiajs/react";

const inputCls =
    "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";

export default function HistoryFilters({ users, initialFilters }) {
    const [search, setSearch] = useState(initialFilters.search || "");
    const [type, setType] = useState(initialFilters.type || "all");
    const [dateFrom, setDateFrom] = useState(initialFilters.date_from || "");
    const [dateTo, setDateTo] = useState(initialFilters.date_to || "");
    const [user, setUser] = useState(initialFilters.user || "all");

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(
            "/transaction-history",
            { search, type, date_from: dateFrom, date_to: dateTo, user },
            { preserveState: true, preserveScroll: true },
        );
    };

    const clearFilters = () => {
        setSearch("");
        setType("all");
        setDateFrom("");
        setDateTo("");
        setUser("all");
        router.get("/transaction-history");
    };

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-5 mb-4">
            <form
                onSubmit={applyFilters}
                className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
            >
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Search
                    </label>
                    <input
                        type="text"
                        className={inputCls}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Medicine, Patient, Supplier..."
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Type
                    </label>
                    <select
                        className={inputCls}
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="Stock-In">Stock-In</option>
                        <option value="Stock-Out">Stock-Out</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Date From
                    </label>
                    <input
                        type="date"
                        className={inputCls}
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Date To
                    </label>
                    <input
                        type="date"
                        className={inputCls}
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        User
                    </label>
                    <select
                        className={inputCls}
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                    >
                        <option value="all">All Users</option>
                        {users.map((u, i) => (
                            <option key={i} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-5 flex justify-end gap-3 mt-2">
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="px-4 py-2 text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        type="submit"
                        className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-6 py-2 hover:bg-black transition-colors shadow-sm"
                    >
                        Apply Filters
                    </button>
                </div>
            </form>
        </div>
    );
}
