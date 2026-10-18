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

/**
 * Replacement for window.confirm() / window.alert().
 *
 * Confirm mode (default): pass onConfirm → shows Cancel + confirm buttons.
 * Info mode: omit onConfirm → shows a single "OK" button (replaces alert()).
 *
 * <ConfirmDialog
 *   open={!!pending}
 *   onOpenChange={(o) => !o && setPending(null)}
 *   title="Delete this medicine?"
 *   description="This cannot be undone."
 *   confirmLabel="Delete"
 *   tone="danger"
 *   onConfirm={doDelete}
 * />
 */
export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    tone = 'default', // 'default' | 'danger'
    onConfirm,
}) {
    const isInfo = !onConfirm;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {isInfo ? (
                        <AlertDialogAction>OK</AlertDialogAction>
                    ) : (
                        <>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                variant={tone === 'danger' ? 'destructive' : 'default'}
                                onClick={onConfirm}
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
