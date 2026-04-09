import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

export type ConfirmDeleteDetailLine = { label: string; value: string };

export type ConfirmDeleteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** @default "Delete Recording?" */
  title?: string;
  /** @default "This action cannot be undone." */
  subtitle?: string;
  detailLines?: ConfirmDeleteDetailLine[];
  /** Return true to close the modal (successful delete). */
  onConfirm: () => Promise<boolean>;
  /** @default "Delete" */
  confirmLabel?: string;
};

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  title = "Delete Recording?",
  subtitle = "This action cannot be undone.",
  detailLines,
  onConfirm,
  confirmLabel = "Delete",
}: ConfirmDeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next && deleting) return;
      onOpenChange(next);
    },
    [deleting, onOpenChange],
  );

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      const ok = await onConfirm();
      if (ok) onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  const showDetails = detailLines && detailLines.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/45 backdrop-blur-[6px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border p-6 font-body",
            "border-black/[0.07] bg-white text-foreground shadow-[0_24px_80px_-20px_rgba(15,23,42,0.18)]",
            "dark:border-white/[0.08] dark:bg-[#151515] dark:shadow-[0_28px_90px_-24px_rgba(0,0,0,0.72)]",
            "duration-200 ease-out",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
          onPointerDownOutside={(e) => {
            if (deleting) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (deleting) e.preventDefault();
          }}
        >
          <DialogHeader className="space-y-0 text-left">
            <DialogTitle className="font-display text-lg font-semibold tracking-tight sm:text-xl">{title}</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</DialogDescription>
          </DialogHeader>

          {showDetails && (
            <div className="mt-4 space-y-2 rounded-xl border border-border/50 bg-muted/30 px-3.5 py-3 dark:bg-white/[0.04] dark:border-white/[0.07]">
              {detailLines!.map((line) => (
                <div key={`${line.label}-${line.value}`} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="text-muted-foreground">{line.label}</span>
                  <span className="font-medium text-foreground">{line.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={deleting}
              onClick={() => handleOpenChange(false)}
              className="text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleConfirm()}
              className={cn(
                "min-w-[5.5rem] px-4 font-semibold text-destructive-foreground",
                "hover:shadow-[0_0_28px_-6px_hsl(var(--destructive)/0.55)] transition-shadow duration-200",
              )}
            >
              {deleting ? "Deleting…" : confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
