import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";

const inputCls =
    "w-full rounded-xl border border-transparent bg-gray-100 px-3 py-2 text-[14px] text-gray-900 placeholder-gray-400 transition-all focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100";

const DEFAULT_FILTERS = {
    search: "",
    type: "all",
    date_from: "",
    date_to: "",
    user: "all",
};

export default function HistoryFilters({ users = [], initialFilters = {} }) {
    const [form, setForm] = useState({
        ...DEFAULT_FILTERS,
        ...initialFilters,
        user: String(initialFilters.user ?? "all"),
    });

    useEffect(() => {
        setForm({
            ...DEFAULT_FILTERS,
            ...initialFilters,
            user: String(initialFilters.user ?? "all"),
        });
    }, [initialFilters]);

    const updateFilter = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const applyFilters = (event) => {
        event.preventDefault();

        router.get(route("transaction-history.index"), form, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <form
            onSubmit={applyFilters}
            className="no-print grid grid-cols-1 gap-4 rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-6 md:items-end"
        >
            <div className="md:col-span-2">
                <label className="mb-1 block text-[12px] font-semibold text-gray-700">
                    Search
                </label>
                <input
                    type="search"
                    className={inputCls}
                    placeholder="Medicine, Patient, Supplier..."
                    value={form.search}
                    onChange={(event) =>
                        updateFilter("search", event.target.value)
                    }
                />
            </div>

            <div>
                <label className="mb-1 block text-[12px] font-semibold text-gray-700">
                    Type
                </label>
                <select
                    className={inputCls}
                    value={form.type}
                    onChange={(event) =>
                        updateFilter("type", event.target.value)
                    }
                >
                    <option value="all">All Types</option>
                    <option value="Stock-In">Stock-In</option>
                    <option value="Stock-Out">Stock-Out</option>
                </select>
            </div>

            <div>
                <label className="mb-1 block text-[12px] font-semibold text-gray-700">
                    Date From
                </label>
                <input
                    type="date"
                    className={inputCls}
                    value={form.date_from}
                    onChange={(event) =>
                        updateFilter("date_from", event.target.value)
                    }
                />
            </div>

            <div>
                <label className="mb-1 block text-[12px] font-semibold text-gray-700">
                    Date To
                </label>
                <input
                    type="date"
                    className={inputCls}
                    value={form.date_to}
                    onChange={(event) =>
                        updateFilter("date_to", event.target.value)
                    }
                />
            </div>

            <div>
                <label className="mb-1 block text-[12px] font-semibold text-gray-700">
                    User
                </label>
                <select
                    className={inputCls}
                    value={form.user}
                    onChange={(event) =>
                        updateFilter("user", event.target.value)
                    }
                >
                    <option value="all">All Users</option>
                    {users.map((user) => (
                        <option key={user.user_id} value={user.user_id}>
                            {user.full_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex justify-end pt-1 md:col-span-6">
                <button
                    type="submit"
                    className="rounded-full bg-gray-900 px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-black"
                >
                    Apply Filters
                </button>
            </div>
        </form>
    );
}
