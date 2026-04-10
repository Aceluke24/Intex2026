import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import type { Supporter } from "@/lib/donorsTypes";
import { formatDateSafe } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SupporterForm } from "./SupporterForm";
import {
  toEditPayload,
  type SupporterFormErrors,
  type SupporterFormValues,
  validateSupporterForm,
} from "./supporterFormModel";

export type EditSupporterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supporter: Supporter | null;
  /** Full PUT body (camelCase) built from the form and original `createdAt`. */
  onSave: (body: Record<string, unknown>) => Promise<void>;
  /** Optional: close editor and open delete flow in parent. */
  onRequestDelete?: (supporter: Supporter) => void;
};

type Phase = "edit" | "confirm";

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

function parseSupporterRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

function pickStr(r: Record<string, unknown>, camel: string, pascal: string): string {
  const v = r[camel] ?? r[pascal];
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

function pickId(r: Record<string, unknown>): number {
  const v = r.supporterId ?? r.SupporterId;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function recordToForm(r: Record<string, unknown>): SupporterFormValues {
  return {
    display_name: pickStr(r, "displayName", "DisplayName"),
    first_name: pickStr(r, "firstName", "FirstName"),
    last_name: pickStr(r, "lastName", "LastName"),
    organization_name: pickStr(r, "organizationName", "OrganizationName"),
    email: pickStr(r, "email", "Email"),
    phone: pickStr(r, "phone", "Phone"),
    region: pickStr(r, "region", "Region"),
    country: pickStr(r, "country", "Country"),
    relationship_type: pickStr(r, "relationshipType", "RelationshipType") || "Local",
    supporter_type: pickStr(r, "supporterType", "SupporterType") || "MonetaryDonor",
    status: pickStr(r, "status", "Status") === "Inactive" ? "Inactive" : "Active",
    acquisition_channel: pickStr(r, "acquisitionChannel", "AcquisitionChannel"),
  };
}

function normalizeFormForCompare(f: SupporterFormValues): Record<string, string | null> {
  return {
    display_name: f.display_name.trim(),
    first_name: emptyToNull(f.first_name) ?? "",
    last_name: emptyToNull(f.last_name) ?? "",
    organization_name: emptyToNull(f.organization_name) ?? "",
    email: f.email.trim().toLowerCase(),
    phone: (f.phone ?? "").trim(),
    region: emptyToNull(f.region) ?? "",
    country: emptyToNull(f.country) ?? "",
    relationship_type: f.relationship_type,
    supporter_type: f.supporter_type,
    status: f.status,
    acquisition_channel: emptyToNull(f.acquisition_channel) ?? "",
  };
}

function buildPutBody(baseline: Record<string, unknown>, form: SupporterFormValues): Record<string, unknown> {
  const id = pickId(baseline);
  const createdAt = baseline.createdAt ?? baseline.CreatedAt;
  return {
    supporterId: id,
    ...toEditPayload(form),
    createdAt,
  };
}

export const EditSupporterModal = memo(function EditSupporterModal({
  open,
  onOpenChange,
  supporter,
  onSave,
  onRequestDelete,
}: EditSupporterModalProps) {
  const [phase, setPhase] = useState<Phase>("edit");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<SupporterFormValues | null>(null);
  const [initialForm, setInitialForm] = useState<SupporterFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SupporterFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const shouldAutoFocusRef = useRef(false);

  const resetForClose = useCallback(() => {
    setPhase("edit");
    setBaseline(null);
    setForm(null);
    setInitialForm(null);
    setFetchError(null);
    setFieldErrors({});
    setSaveError(null);
    setLoadingDetail(false);
    shouldAutoFocusRef.current = false;
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const num = Number(id);
    if (!Number.isFinite(num)) {
      setFetchError("Invalid supporter ID.");
      return;
    }
    setLoadingDetail(true);
    setFetchError(null);
    try {
      const raw = await apiFetchJson<unknown>(`${API_PREFIX}/supporters/${num}`);
      const r = parseSupporterRecord(raw);
      if (pickId(r) !== num) {
        setFetchError("Could not load supporter.");
        setBaseline(null);
        setForm(null);
        setInitialForm(null);
        return;
      }
      setBaseline(r);
      const f = recordToForm(r);
      setForm(f);
      setInitialForm(f);
    } catch (e) {
      console.error(e);
      setFetchError(e instanceof Error ? e.message : "Failed to load supporter.");
      setBaseline(null);
      setForm(null);
      setInitialForm(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !supporter) {
      resetForClose();
      return;
    }
    shouldAutoFocusRef.current = true;
    void loadDetail(supporter.id);
  }, [open, supporter, supporter?.id, loadDetail, resetForClose]);

  useEffect(() => {
    if (!open || phase !== "edit" || loadingDetail || !form || !shouldAutoFocusRef.current) return;
    const id = requestAnimationFrame(() => {
      firstFieldRef.current?.focus();
      shouldAutoFocusRef.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [open, phase, loadingDetail, supporter?.id, form]);

  const dirty = useMemo(() => {
    if (!form || !initialForm) return false;
    return JSON.stringify(normalizeFormForCompare(form)) !== JSON.stringify(normalizeFormForCompare(initialForm));
  }, [form, initialForm]);

  const validNow = !form || validateSupporterForm(form).ok;

  const canProceedToConfirm = Boolean(form && dirty && validNow);
  const canConfirmSave = Boolean(form && baseline && dirty && validNow && !saving && !loadingDetail);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next && saving) return;
      if (!next) resetForClose();
      onOpenChange(next);
    },
    [saving, onOpenChange, resetForClose],
  );

  const updateField = <K extends keyof SupporterFormValues>(key: K, value: SupporterFormValues[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaveError(null);
  };

  const validateForSave = (): boolean => {
    if (!form) return false;
    const validated = validateSupporterForm(form);
    setFieldErrors(validated.errors);
    if (!validated.ok) return false;
    setForm(validated.values);
    return true;
  };

  const goConfirm = () => {
    if (!validateForSave() || !canProceedToConfirm) return;
    setPhase("confirm");
    setSaveError(null);
  };

  const confirmSave = async () => {
    if (!form || !baseline) return;
    setSaving(true);
    setSaveError(null);
    try {
      const body = buildPutBody(baseline, form);
      await onSave(body);
      handleOpenChange(false);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Could not save. Try again.";
      const line = raw.split(/\n/)[0]?.trim() || "Could not save. Try again.";
      setSaveError(line);
    } finally {
      setSaving(false);
    }
  };

  const createdAtLabel = baseline
    ? formatDateSafe(pickStr(baseline, "createdAt", "CreatedAt"), "MMM d, yyyy h:mm a", "—")
    : "—";

  const supporterIdLabel = supporter?.id ?? (baseline ? String(pickId(baseline)) : "—");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/30 dark:bg-black/45 backdrop-blur-[8px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[60] flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[min(100%,40rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden",
            "rounded-[1.35rem] border p-0 font-body text-gray-900 dark:text-gray-100",
            "border-black/[0.08] bg-white/95 shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur-xl",
            "dark:border-white/[0.10] dark:bg-[hsl(213_45%_8%)]/92 dark:shadow-[0_28px_90px_rgba(0,0,0,0.60)]",
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
          {phase === "edit" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                goConfirm();
              }}
              className="flex h-full max-h-[90vh] flex-col"
            >
              <div className="shrink-0 border-b border-black/[0.06] px-6 pb-4 pt-6 dark:border-white/[0.08]">
                <DialogHeader className="space-y-0 text-left">
                  <DialogTitle className="font-display text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                    Edit Supporter
                  </DialogTitle>
                  <DialogDescription className="mt-1.5 font-body text-sm text-gray-500 dark:text-gray-400">
                    Update supporter details. Location uses region and country fields from the database schema.
                  </DialogDescription>
                </DialogHeader>
                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-body text-xs text-gray-500 dark:text-gray-400">
                  <div>
                    <dt className="inline font-medium text-gray-500 dark:text-gray-400">ID</dt>{" "}
                    <dd className="inline tabular-nums text-gray-500 dark:text-gray-400">{supporterIdLabel}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-gray-500 dark:text-gray-400">Record created</dt>{" "}
                    <dd className="inline text-gray-500 dark:text-gray-400">{createdAtLabel}</dd>
                  </div>
                </dl>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                {loadingDetail ? (
                  <p className="py-12 text-center font-body text-sm text-gray-500 dark:text-gray-400">Loading supporter…</p>
                ) : fetchError ? (
                  <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
                    {fetchError}
                  </p>
                ) : form ? (
                  <SupporterForm
                    mode="edit"
                    values={form}
                    errors={fieldErrors}
                    disabled={saving}
                    onChange={updateField}
                    firstFieldRef={firstFieldRef}
                    idPrefix="edit-supporter"
                  />
                ) : null}
              </div>

              <div className="sticky bottom-0 z-10 shrink-0 border-t border-black/[0.06] bg-white/95 px-6 py-4 dark:border-white/[0.08] dark:bg-[hsl(213_45%_8%)]/95">
                {saveError ? (
                  <p className="mb-3 font-body text-sm text-destructive" role="status">
                    {saveError}
                  </p>
                ) : null}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {onRequestDelete && supporter ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={saving || loadingDetail}
                      className="rounded-xl font-body text-red-700 border border-red-600/90 hover:bg-red-50/80 dark:text-red-300 dark:border-red-400/40 dark:hover:bg-red-500/10"
                      onClick={() => {
                        onRequestDelete(supporter);
                        handleOpenChange(false);
                      }}
                    >
                      Delete supporter
                    </Button>
                  ) : (
                    <span />
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={saving || loadingDetail}
                      onClick={() => handleOpenChange(false)}
                      className="rounded-xl font-body text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!canProceedToConfirm || saving || loadingDetail || !form}
                      className={cn(
                        "min-w-[7.5rem] rounded-xl bg-blue-600 hover:bg-blue-700 font-body font-medium text-white",
                        "shadow-[0_10px_28px_-12px_rgba(59,130,246,0.65)] dark:shadow-[0_14px_38px_-18px_rgba(59,130,246,0.70)]",
                        "transition-[transform,box-shadow,filter] duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]",
                        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/30",
                        "disabled:pointer-events-none disabled:opacity-50",
                      )}
                    >
                      Save changes
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <form
              className="flex flex-col bg-white p-6 dark:bg-gray-900"
              onSubmit={(e) => {
                e.preventDefault();
                if (canConfirmSave) void confirmSave();
              }}
            >
              <DialogHeader className="space-y-0 text-left">
                <DialogTitle className="font-display text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                  Confirm changes
                </DialogTitle>
                <DialogDescription className="mt-3 font-body text-base text-gray-500 dark:text-gray-400">
                  Are you sure you want to update this supporter&apos;s information? This will overwrite the existing data.
                </DialogDescription>
              </DialogHeader>
              {saveError ? (
                <p className="mt-4 font-body text-sm text-destructive" role="status">
                  {saveError}
                </p>
              ) : null}
              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-black/[0.06] pt-5 dark:border-white/[0.08] sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={saving}
                  className="rounded-xl font-body text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    setPhase("edit");
                    setSaveError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!canConfirmSave}
                  className={cn(
                    "min-w-[9.5rem] rounded-lg px-4 py-2 font-body font-medium",
                    "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
                    "dark:bg-blue-500 dark:hover:bg-blue-600",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    "transition-colors duration-150",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent"
                        aria-hidden="true"
                      />
                      Saving...
                    </span>
                  ) : (
                    "Confirm & Save"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
});
