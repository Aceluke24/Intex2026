import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { SupporterForm } from "./SupporterForm";
import {
  defaultSupporterValues,
  toCreatePayload,
  type SupporterFormErrors,
  type SupporterFormValues,
  validateSupporterForm,
} from "./supporterFormModel";

export type AddSupporterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: { id: string; name: string; notes: string }) => void | Promise<void>;
};

function parseCreatedId(raw: unknown): number {
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const v = o.supporterId ?? o.SupporterId;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function AddSupporterModal({ open, onOpenChange, onSuccess }: AddSupporterModalProps) {
  const [form, setForm] = useState<SupporterFormValues>(defaultSupporterValues());
  const [fieldErrors, setFieldErrors] = useState<SupporterFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setForm(defaultSupporterValues());
    setFieldErrors({});
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleCreateSupporter = async () => {
    setError(null);
    const validated = validateSupporterForm(form);
    setFieldErrors(validated.errors);
    if (!validated.ok) return;
    const payload = toCreatePayload(validated.values);

    setSaving(true);
    try {
      const res = await apiFetch(`${API_PREFIX}/supporters`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.status === 409) {
        let msg = "A supporter with that email or matching name and phone already exists.";
        try {
          const j = (await res.json()) as { message?: string };
          if (typeof j.message === "string" && j.message.trim()) msg = j.message.trim();
        } catch {
          /* ignore */
        }
        setError(msg);
        console.error(msg);
        return;
      }
      if (!res.ok) {
        let msg = "Failed to create supporter. Check required fields.";
        try {
          const j = (await res.json()) as { message?: string };
          if (typeof j.message === "string" && j.message.trim()) msg = j.message.trim();
        } catch {
          const t = await res.text();
          if (t && t.trim()) msg = t.trim().slice(0, 200);
        }
        setError(msg);
        console.error(msg);
        return;
      }
      const json: unknown = await res.json();
      const idNum = parseCreatedId(json);
      if (!idNum) {
        setError("Created supporter but could not read ID. Refresh the page.");
        console.error("Created supporter but could not read ID. Refresh the page.");
        return;
      }
      await onSuccess({ id: String(idNum), name: String(payload.display_name ?? ""), notes: "" });
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create supporter.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={cn(
          "fixed inset-0 z-[9998] bg-[hsl(213_35%_18%)]/35 backdrop-blur-[6px] pointer-events-auto",
          "dark:bg-[hsl(213_55%_5%)]/50",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        )}
        className={cn(
          "z-[9999] pointer-events-auto max-h-[min(92vh,840px)] w-full max-w-[min(100vw-1.5rem,520px)] gap-0 overflow-y-auto border-0 bg-[hsl(36_33%_98%)]/96 p-0 shadow-[0_28px_90px_rgba(45,35,48,0.14)] backdrop-blur-xl duration-300 ease-out",
          "dark:bg-[hsl(213_42%_11%)]/96 dark:shadow-[0_28px_90px_rgba(0,0,0,0.55)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-[1.25rem]",
        )}
        onPointerDownOutside={(e) => {
          if (saving) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (saving) e.preventDefault();
        }}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await handleCreateSupporter();
            } catch (err) {
              console.error(err);
            }
          }}
        >
          <div className="border-b border-[hsl(36_20%_90%)]/80 px-6 pb-5 pt-7 dark:border-white/[0.07] sm:px-7">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-display text-[1.35rem] font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
                New supporter
              </DialogTitle>
              <DialogDescription className="font-body text-[0.9375rem] leading-relaxed text-muted-foreground/85">
                Create a supporter with the same structure used in edit mode.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-7 sm:px-7">
            <SupporterForm
              mode="create"
              values={form}
              errors={fieldErrors}
              disabled={saving}
              idPrefix="new-supporter"
              onChange={(field, value) => {
                setForm((prev) => ({ ...prev, [field]: value }));
                setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
                setError(null);
              }}
            />
            {error ? (
              <p
                className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-3 border-t border-[hsl(36_20%_90%)]/80 px-6 py-5 dark:border-white/[0.07] sm:justify-end sm:px-7">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] border-[hsl(36_18%_86%)] font-body text-sm dark:border-[hsl(213_28%_22%)]"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className={cn(
                "rounded-[14px] px-7 font-body text-sm font-medium text-white shadow-[0_8px_24px_rgba(232,174,183,0.35)]",
                "bg-gradient-to-r from-[#E8AEB7] via-[hsl(345_42%_72%)] to-[hsl(10_48%_62%)]",
                "transition-[transform,box-shadow,filter] duration-200 ease-out",
                "hover:shadow-[0_12px_32px_rgba(232,174,183,0.42)] hover:brightness-[1.03]",
                "active:scale-[0.98] active:shadow-[0_4px_16px_rgba(232,174,183,0.28)]",
              )}
            >
              {saving ? "Saving…" : "Create supporter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
