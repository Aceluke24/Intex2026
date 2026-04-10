import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import type { Supporter } from "@/lib/donorsTypes";
import { formatDateSafe } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type EditSupporterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supporter: Supporter | null;
  /** Full PUT body (camelCase) built from the form and original `createdAt`. */
  onSave: (body: Record<string, unknown>) => Promise<void>;
  /** Optional: close editor and open delete flow in parent. */
  onRequestDelete?: (supporter: Supporter) => void;
};

const SUPPORTER_TYPES = [
  "MonetaryDonor",
  "InKindDonor",
  "Volunteer",
  "SkillsContributor",
  "SocialMediaAdvocate",
  "PartnerOrganization",
] as const;

const RELATIONSHIP_TYPES = ["Local", "International", "PartnerOrganization"] as const;

const ACQUISITION_CHANNELS = [
  "Website",
  "SocialMedia",
  "Event",
  "WordOfMouth",
  "PartnerReferral",
  "Church",
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Phase = "edit" | "confirm";

type FormState = {
  displayName: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  email: string;
  phone: string;
  region: string;
  country: string;
  relationshipType: string;
  supporterType: string;
  status: string;
  firstDonationDate: string;
  acquisitionChannel: string;
};

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

function recordToForm(r: Record<string, unknown>): FormState {
  const fd = pickStr(r, "firstDonationDate", "FirstDonationDate");
  const fdNorm = fd.length >= 10 ? fd.slice(0, 10) : fd;
  return {
    displayName: pickStr(r, "displayName", "DisplayName"),
    firstName: pickStr(r, "firstName", "FirstName"),
    lastName: pickStr(r, "lastName", "LastName"),
    organizationName: pickStr(r, "organizationName", "OrganizationName"),
    email: pickStr(r, "email", "Email"),
    phone: pickStr(r, "phone", "Phone"),
    region: pickStr(r, "region", "Region"),
    country: pickStr(r, "country", "Country"),
    relationshipType: pickStr(r, "relationshipType", "RelationshipType") || "Local",
    supporterType: pickStr(r, "supporterType", "SupporterType") || "MonetaryDonor",
    status: pickStr(r, "status", "Status") === "Inactive" ? "Inactive" : "Active",
    firstDonationDate: fdNorm,
    acquisitionChannel: pickStr(r, "acquisitionChannel", "AcquisitionChannel"),
  };
}

function normalizeFormForCompare(f: FormState): Record<string, string | null> {
  return {
    displayName: f.displayName.trim(),
    firstName: emptyToNull(f.firstName) ?? "",
    lastName: emptyToNull(f.lastName) ?? "",
    organizationName: emptyToNull(f.organizationName) ?? "",
    email: f.email.trim().toLowerCase(),
    phone: (f.phone ?? "").trim(),
    region: emptyToNull(f.region) ?? "",
    country: emptyToNull(f.country) ?? "",
    relationshipType: f.relationshipType,
    supporterType: f.supporterType,
    status: f.status,
    firstDonationDate: f.firstDonationDate.trim(),
    acquisitionChannel: emptyToNull(f.acquisitionChannel) ?? "",
  };
}

function buildPutBody(baseline: Record<string, unknown>, form: FormState): Record<string, unknown> {
  const id = pickId(baseline);
  const createdAt = baseline.createdAt ?? baseline.CreatedAt;
  return {
    supporterId: id,
    supporterType: form.supporterType,
    displayName: form.displayName.trim(),
    organizationName: emptyToNull(form.organizationName),
    firstName: emptyToNull(form.firstName),
    lastName: emptyToNull(form.lastName),
    relationshipType: form.relationshipType,
    region: emptyToNull(form.region),
    country: emptyToNull(form.country),
    email: form.email.trim() ? form.email.trim().toLowerCase() : null,
    phone: emptyToNull(form.phone),
    status: form.status,
    firstDonationDate: form.firstDonationDate.trim() || null,
    acquisitionChannel: emptyToNull(form.acquisitionChannel),
    createdAt,
  };
}

function formatPhoneBlur(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw.trim();
}

const labelClass =
  "font-body text-xs font-medium text-gray-700 dark:text-gray-300 leading-none";

const inputClass = cn(
  "h-11 rounded-2xl border px-3.5 font-body text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)]",
  "bg-white border-gray-300/90 text-gray-900 placeholder:text-gray-400",
  "dark:bg-white/[0.06] dark:border-white/[0.10] dark:text-gray-100 dark:placeholder:text-gray-500 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]",
  "transition-[box-shadow,border-color,background-color] duration-200 ease-out",
  "focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-500/20 focus-visible:outline-none",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

const selectTriggerClass = cn(
  "h-11 w-full rounded-2xl border px-3.5 font-body text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)]",
  "bg-white border-gray-300/90 text-gray-900",
  "dark:bg-white/[0.06] dark:border-white/[0.10] dark:text-gray-100 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]",
  "transition-[box-shadow,border-color,background-color] duration-200 ease-out",
  "focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 focus:ring-offset-0 focus:outline-none",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-800 dark:text-gray-200">
      {children}
    </p>
  );
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
  const [form, setForm] = useState<FormState | null>(null);
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
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
    setEmailError(null);
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

  const emailValid = !form || !form.email.trim() || EMAIL_RE.test(form.email.trim());

  const canProceedToConfirm = Boolean(form && dirty && emailValid);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next && saving) return;
      if (!next) resetForClose();
      onOpenChange(next);
    },
    [saving, onOpenChange, resetForClose],
  );

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    if (key === "email") setEmailError(null);
    setSaveError(null);
  };

  const validateForSave = (): boolean => {
    if (!form) return false;
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
      setEmailError("Enter a valid email address.");
      return false;
    }
    setEmailError(null);
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
                  <div className="space-y-10">
                    <section className="space-y-4 pt-1">
                      <SectionTitle>Basic info</SectionTitle>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="es-first" className={labelClass}>
                            First name
                          </Label>
                          <Input
                            ref={firstFieldRef}
                            id="es-first"
                            value={form.firstName}
                            onChange={(e) => updateField("firstName", e.target.value)}
                            disabled={saving}
                            autoComplete="given-name"
                            className={cn(inputClass)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="es-last" className={labelClass}>
                            Last name
                          </Label>
                          <Input
                            id="es-last"
                            value={form.lastName}
                            onChange={(e) => updateField("lastName", e.target.value)}
                            disabled={saving}
                            autoComplete="family-name"
                            className={cn(inputClass)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="es-display" className={labelClass}>
                          Display name
                        </Label>
                        <Input
                          id="es-display"
                          value={form.displayName}
                          onChange={(e) => updateField("displayName", e.target.value)}
                          disabled={saving}
                          autoComplete="organization"
                          className={cn(inputClass)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="es-org" className={labelClass}>
                          Organization name
                        </Label>
                        <Input
                          id="es-org"
                          value={form.organizationName}
                          onChange={(e) => updateField("organizationName", e.target.value)}
                          disabled={saving}
                          className={cn(inputClass)}
                        />
                      </div>
                    </section>

                    <section className="space-y-4">
                      <SectionTitle>Contact</SectionTitle>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="es-email" className={labelClass}>
                            Email
                          </Label>
                          <Input
                            id="es-email"
                            type="email"
                            value={form.email}
                            onChange={(e) => updateField("email", e.target.value)}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v && !EMAIL_RE.test(v)) {
                                setEmailError("Enter a valid email address.");
                              }
                            }}
                            disabled={saving}
                            autoComplete="email"
                            className={cn(inputClass, (emailError || !emailValid) && "border-destructive/50 focus-visible:ring-destructive/25")}
                            aria-invalid={emailError ? true : undefined}
                            aria-describedby={emailError ? "es-email-err" : undefined}
                          />
                          {emailError ? (
                            <p id="es-email-err" className="font-body text-sm text-destructive">
                              {emailError}
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="es-phone" className={labelClass}>
                            Phone
                          </Label>
                          <Input
                            id="es-phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => updateField("phone", e.target.value)}
                            onBlur={(e) => updateField("phone", formatPhoneBlur(e.target.value))}
                            disabled={saving}
                            autoComplete="tel"
                            placeholder="Optional"
                            className={cn(inputClass)}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <SectionTitle>Location</SectionTitle>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="es-region" className={labelClass}>
                            Region
                          </Label>
                          <Input
                            id="es-region"
                            value={form.region}
                            onChange={(e) => updateField("region", e.target.value)}
                            disabled={saving}
                            className={cn(inputClass)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="es-country" className={labelClass}>
                            Country
                          </Label>
                          <Input
                            id="es-country"
                            value={form.country}
                            onChange={(e) => updateField("country", e.target.value)}
                            disabled={saving}
                            autoComplete="country-name"
                            className={cn(inputClass)}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <SectionTitle>Additional</SectionTitle>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className={labelClass}>Relationship</Label>
                          <Select
                            value={form.relationshipType}
                            onValueChange={(v) => updateField("relationshipType", v)}
                            disabled={saving}
                          >
                            <SelectTrigger className={selectTriggerClass}>
                              <SelectValue placeholder="Relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIP_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t === "PartnerOrganization" ? "Partner organization" : t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClass}>Supporter type</Label>
                          <Select
                            value={form.supporterType}
                            onValueChange={(v) => updateField("supporterType", v)}
                            disabled={saving}
                          >
                            <SelectTrigger className={selectTriggerClass}>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {SUPPORTER_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t.replace(/([A-Z])/g, " $1").trim()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="es-first-donation" className={labelClass}>
                            First donation date
                          </Label>
                          <Input
                            id="es-first-donation"
                            type="date"
                            value={form.firstDonationDate}
                            onChange={(e) => updateField("firstDonationDate", e.target.value)}
                            disabled={saving}
                            className={cn(inputClass)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClass}>Acquisition channel</Label>
                          <Select
                            value={form.acquisitionChannel || "__none__"}
                            onValueChange={(v) => updateField("acquisitionChannel", v === "__none__" ? "" : v)}
                            disabled={saving}
                          >
                            <SelectTrigger className={selectTriggerClass}>
                              <SelectValue placeholder="Optional" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">—</SelectItem>
                              {ACQUISITION_CHANNELS.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c.replace(/([A-Z])/g, " $1").trim()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className={labelClass}>Status</Label>
                          <Select value={form.status} onValueChange={(v) => updateField("status", v)} disabled={saving}>
                            <SelectTrigger className={selectTriggerClass}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>
                  </div>
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
              className="flex flex-col p-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (!saving) void confirmSave();
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
              <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                  disabled={saving}
                  className="min-w-[9rem] rounded-xl bg-primary-600 hover:bg-primary-700 font-body font-medium text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Confirm & save"}
                </Button>
              </div>
            </form>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
});
