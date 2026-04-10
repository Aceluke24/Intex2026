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
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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

const inputClass = cn(
  "h-11 rounded-2xl border border-white/40 bg-white/55 font-body text-sm shadow-[inset_0_1px_2px_rgba(45,35,48,0.04)] backdrop-blur-md",
  "placeholder:text-muted-foreground/50",
  "focus-visible:border-[hsl(340_35%_75%)]/40 focus-visible:ring-2 focus-visible:ring-[hsl(340_35%_70%)]/25",
  "dark:border-white/10 dark:bg-white/[0.07]",
);

const selectTriggerClass = cn(
  "h-11 w-full rounded-2xl border border-white/40 bg-white/55 font-body text-sm shadow-[inset_0_1px_2px_rgba(45,35,48,0.04)] backdrop-blur-md",
  "focus:ring-2 focus:ring-[hsl(340_35%_70%)]/25 focus:ring-offset-0",
  "dark:border-white/10 dark:bg-white/[0.07]",
);

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">{children}</p>
  );
}

export function EditSupporterModal({
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

  const resetForClose = useCallback(() => {
    setPhase("edit");
    setBaseline(null);
    setForm(null);
    setInitialForm(null);
    setFetchError(null);
    setEmailError(null);
    setSaveError(null);
    setLoadingDetail(false);
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
    void loadDetail(supporter.id);
  }, [open, supporter, supporter?.id, loadDetail, resetForClose]);

  useEffect(() => {
    if (!open || phase !== "edit" || loadingDetail || !form) return;
    const id = requestAnimationFrame(() => {
      firstFieldRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open, phase, loadingDetail, form, supporter?.id]);

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
            "fixed inset-0 z-50 bg-black/40 backdrop-blur-[6px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[min(92vh,880px)] w-[calc(100%-2rem)] max-w-[min(100%,40rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
            "rounded-[1.35rem] border border-black/[0.07] bg-[hsl(36_33%_98%)]/95 p-0 font-body text-foreground shadow-[0_20px_64px_-24px_rgba(15,23,42,0.18)] backdrop-blur-xl",
            "dark:border-white/[0.08] dark:bg-[hsl(213_40%_11%)]/95 dark:shadow-[0_24px_80px_-24px_rgba(0,0,0,0.55)]",
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
              className="flex max-h-[min(92vh,880px)] flex-col"
            >
              <div className="shrink-0 border-b border-black/5 px-6 pb-4 pt-6 dark:border-white/5">
                <DialogHeader className="space-y-0 text-left">
                  <DialogTitle className="font-display text-xl font-semibold tracking-tight text-foreground">
                    Edit Supporter
                  </DialogTitle>
                  <DialogDescription className="mt-1.5 font-body text-sm text-muted-foreground">
                    Update supporter details. Location uses region and country fields from the database schema.
                  </DialogDescription>
                </DialogHeader>
                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-body text-xs text-muted-foreground">
                  <div>
                    <dt className="inline font-medium text-muted-foreground/90">ID</dt>{" "}
                    <dd className="inline tabular-nums text-foreground/80">{supporterIdLabel}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-muted-foreground/90">Record created</dt>{" "}
                    <dd className="inline text-foreground/80">{createdAtLabel}</dd>
                  </div>
                </dl>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {loadingDetail ? (
                  <p className="py-12 text-center font-body text-sm text-muted-foreground">Loading supporter…</p>
                ) : fetchError ? (
                  <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
                    {fetchError}
                  </p>
                ) : form ? (
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <SectionTitle>Basic info</SectionTitle>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="es-first" className="font-body text-xs font-medium text-muted-foreground">
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
                          <Label htmlFor="es-last" className="font-body text-xs font-medium text-muted-foreground">
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
                        <Label htmlFor="es-display" className="font-body text-xs font-medium text-muted-foreground">
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
                        <Label htmlFor="es-org" className="font-body text-xs font-medium text-muted-foreground">
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
                          <Label htmlFor="es-email" className="font-body text-xs font-medium text-muted-foreground">
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
                          <Label htmlFor="es-phone" className="font-body text-xs font-medium text-muted-foreground">
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
                          <Label htmlFor="es-region" className="font-body text-xs font-medium text-muted-foreground">
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
                          <Label htmlFor="es-country" className="font-body text-xs font-medium text-muted-foreground">
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
                          <Label className="font-body text-xs font-medium text-muted-foreground">Relationship</Label>
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
                          <Label className="font-body text-xs font-medium text-muted-foreground">Supporter type</Label>
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
                          <Label htmlFor="es-first-donation" className="font-body text-xs font-medium text-muted-foreground">
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
                          <Label className="font-body text-xs font-medium text-muted-foreground">Acquisition channel</Label>
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
                          <Label className="font-body text-xs font-medium text-muted-foreground">Status</Label>
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

              <div className="shrink-0 border-t border-black/5 px-6 py-4 dark:border-white/5">
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
                      className="rounded-xl border-destructive/40 font-body text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                      className="rounded-xl font-body text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!canProceedToConfirm || saving || loadingDetail || !form}
                      className="min-w-[7rem] rounded-xl bg-gradient-to-r from-[hsl(340_42%_72%)] to-[hsl(10_48%_62%)] font-body font-medium text-white shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
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
                <DialogTitle className="font-display text-xl font-semibold tracking-tight text-foreground">
                  Confirm changes
                </DialogTitle>
                <DialogDescription className="mt-3 font-body text-base text-foreground/85">
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
                  className="rounded-xl font-body text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-white/10"
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
                  className="min-w-[9rem] rounded-xl bg-gradient-to-r from-[hsl(340_42%_72%)] to-[hsl(10_48%_62%)] font-body font-medium text-white shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
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
}
