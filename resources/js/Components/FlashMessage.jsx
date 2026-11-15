import { usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function FlashMessage() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(false);

    // Show the banner whenever flash data changes
    useEffect(() => {
        if (
            flash?.success ||
            flash?.error ||
            flash?.warning ||
            flash?.message ||
            flash?.status
        ) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [flash]);

    if (!visible) return null;

    // Determine type and message
    const type = flash.error ? "error" : flash.warning ? "warning" : "success";
    const message =
        flash.success ||
        flash.error ||
        flash.warning ||
        flash.message ||
        flash.status;

    const styles = {
        success: "bg-green-50 border-green-200 text-green-800",
        error: "bg-red-50 border-red-200 text-red-800",
        warning: "bg-amber-50 border-amber-200 text-amber-800",
    };

    const icons = {
        success: "fa-check-circle text-green-600",
        error: "fa-circle-exclamation text-red-600",
        warning: "fa-triangle-exclamation text-amber-600",
    };

    return (
        <div
            className={`mb-4 border rounded-[16px] p-4 text-[13px] shadow-sm flex items-start justify-between animate-in fade-in slide-in-from-top-2 ${styles[type]}`}
        >
            <div>
                <h4 className="font-semibold mb-1 capitalize flex items-center">
                    <i className={`fas ${icons[type]} mr-2`} /> {type}
                </h4>
                <p className="whitespace-pre-line">{message}</p>
            </div>
            <button
                onClick={() => setVisible(false)}
                className="opacity-50 hover:opacity-100 transition-opacity ml-4"
            >
                <i className="fas fa-times" />
            </button>
        </div>
    );
}
