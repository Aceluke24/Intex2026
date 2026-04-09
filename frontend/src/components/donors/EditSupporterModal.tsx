import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Supporter } from "@/lib/donorsTypes";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

export type EditSupporterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supporter: Supporter | null;
  onSave: (displayName: string) => Promise<void>;
};

export function EditSupporterModal({ open, onOpenChange, supporter, onSave }: EditSupporterModalProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && supporter) {
      setValue(supporter.name);
      setError(null);
    }
  }, [open, supporter]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next && saving) return;
      onOpenChange(next);
    },
    [saving, onOpenChange],
  );

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      onOpenChange(false);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Could not save. Try again.";
      const line = raw.split(/\n/)[0]?.trim() || "Could not save. Try again.";
      setError(line);
    } finally {
      setSaving(false);
    }
  };

  const trimmedEmpty = !value.trim();

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
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border p-6 font-body shadow-[0_24px_80px_-20px_rgba(15,23,42,0.2)]",
            "border-black/[0.07] bg-[hsl(36_33%_98%)]/95 text-foreground backdrop-blur-xl",
            "dark:border-white/[0.08] dark:bg-[hsl(213_40%_11%)]/95 dark:shadow-[0_28px_90px_-24px_rgba(0,0,0,0.65)]",
            "duration-200 ease-out",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
          onPointerDownOutside={(e) => {
            if (saving) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (saving) e.preventDefault();
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="flex flex-col gap-6"
          >
            <DialogHeader className="space-y-0 text-left">
              <DialogTitle className="font-display text-xl font-semibold tracking-tight text-foreground">
                Edit Supporter
              </DialogTitle>
              <DialogDescription className="mt-1.5 font-body text-sm text-muted-foreground">
                Update display name
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="edit-supporter-display-name" className="font-body text-xs font-medium text-muted-foreground">
                Display Name
              </Label>
              <Input
                ref={inputRef}
                id="edit-supporter-display-name"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                autoComplete="name"
                disabled={saving}
                placeholder="Full name or organization"
                className={cn(
                  "h-11 rounded-2xl border border-white/40 bg-white/55 font-body text-sm shadow-[inset_0_1px_2px_rgba(45,35,48,0.04)] backdrop-blur-md",
                  "placeholder:text-muted-foreground/50",
                  "focus-visible:border-[hsl(340_35%_75%)]/40 focus-visible:ring-2 focus-visible:ring-[hsl(340_35%_70%)]/25",
                  "dark:border-white/10 dark:bg-white/[0.07]",
                  error && "border-destructive/50 focus-visible:ring-destructive/25",
                )}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "edit-supporter-error" : undefined}
              />
              {error ? (
                <p id="edit-supporter-error" className="font-body text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => handleOpenChange(false)}
                className="rounded-xl font-body text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={trimmedEmpty || saving}
                className="min-w-[5.5rem] rounded-xl bg-gradient-to-r from-[hsl(340_42%_72%)] to-[hsl(10_48%_62%)] font-body font-medium text-white shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
