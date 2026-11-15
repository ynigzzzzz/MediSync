import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import HistoryTable from './Partials/HistoryTable';

export default function Index({ transactions, totalFilteredRecords, stockInTotal, stockOutTotal, totalTransactions, users, filters = {} }) {
    const netChange = stockInTotal - stockOutTotal;

    // Filter State
    const [search, setSearch] = useState(filters?.search || '');
    const [type, setType] = useState(filters?.type || 'all');
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');
    const [user, setUser] = useState(filters?.user || 'all');

    const applyFilters = (e) => {
        e.preventDefault();
        router.get('/transaction-history', { search, type, date_from: dateFrom, date_to: dateTo, user }, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        setSearch(''); setType('all'); setDateFrom(''); setDateTo(''); setUser('all');
        router.get('/transaction-history');
    };

    function openPrint() {
        const params = new URLSearchParams(filters).toString();
        const url = `/transaction-history/print?${params}`;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = url;

        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => {
                    if (document.body.contains(iframe)) document.body.removeChild(iframe);
                }, 2000);
            }, 500);
        };
        document.body.appendChild(iframe);
    }

    return (
        <AuthenticatedLayout>
            <Head title="Transaction History" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Transaction History</h1>
                    <p className="text-[13px] text-gray-500">All stock-in and stock-out activity across the system.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard label="Total Transactions" value={totalTransactions} icon="fa-receipt" />
                <StatCard label="Stock-In (Month)" value={stockInTotal} icon="fa-arrow-down" tone="success" />
                <StatCard label="Stock-Out (Month)" value={stockOutTotal} icon="fa-arrow-up" tone="danger" />
                <StatCard label="Net Change" value={netChange > 0 ? `+${netChange}` : netChange} icon="fa-chart-line" tone={netChange < 0 ? 'danger' : 'neutral'} />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
                <p className="text-[13px] text-gray-500 font-medium">{totalFilteredRecords.toLocaleString()} record(s) match filters.</p>
                <div className="flex gap-2">
                    <a href={`/transaction-history/export?${new URLSearchParams(filters).toString()}`} className="rounded-full border border-gray-200 bg-white text-gray-700 text-[13px] font-semibold px-4 py-2 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                        <i className="fas fa-file-csv text-gray-400" /> Export CSV
                    </a>
                    <button onClick={openPrint} className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-4 py-2 hover:bg-black transition-colors shadow-sm flex items-center gap-2">
                        <i className="fas fa-print" /> Print
                    </button>
                </div>
            </div>

            <HistoryTable 
                transactions={transactions} 
                users={users}
                search={search} setSearch={setSearch}
                type={type} setType={setType}
                dateFrom={dateFrom} setDateFrom={setDateFrom}
                dateTo={dateTo} setDateTo={setDateTo}
                user={user} setUser={setUser}
                applyFilters={applyFilters} clearFilters={clearFilters}
            />
        </AuthenticatedLayout>
    );
}