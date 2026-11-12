import { useState, useEffect } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/Components/ui/alert-dialog';

export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    tone = 'default',
    withReason = false,
    reasonPlaceholder = 'Enter a reason (required, min 5 characters)...',
    onConfirm,
    onConfirmWithReason,
}) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) { setReason(''); setError(''); }
    }, [open]);

    const isInfo = !onConfirm && !onConfirmWithReason;

    const handleConfirm = () => {
        if (withReason) {
            if (reason.trim().length < 5) {
                setError('Please enter at least 5 characters.');
                return;
            }
            onConfirmWithReason?.(reason.trim());
        } else {
            onConfirm?.();
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
                </AlertDialogHeader>

                {withReason && !isInfo && (
                    <div className="mt-3">
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Reason for deletion<span className="text-critical-red">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); setError(''); }}
                            placeholder={reasonPlaceholder}
                            className="w-full rounded-xl border border-gray-200 bg-[#F2F2F7] px-3 py-2 text-[13px] text-gray-900 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100"
                        />
                        {error && <p className="text-critical-red text-[11px] mt-1">{error}</p>}
                    </div>
                )}

                <AlertDialogFooter>
                    {isInfo ? (
                        <AlertDialogAction>OK</AlertDialogAction>
                    ) : (
                        <>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                variant={tone === 'danger' ? 'destructive' : 'default'}
                                onClick={handleConfirm}
                            >
                                {confirmLabel}
                            </AlertDialogAction>
                        </>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}