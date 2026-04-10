import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SupporterCategory = "individual" | "organization" | "foundation";

export type AddSupporterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the supporter row is persisted; parent should refetch directory. */
  onSuccess: (result: { id: string; name: string; notes: string }) => void | Promise<void>;
};

const FIELD_FOCUS =
  "focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-[#E8AEB7]/45 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#E8AEB7]/45 focus-visible:ring-offset-0";

const INPUT_FIELD_CLASS = cn(
  "h-11 rounded-[14px] border border-[hsl(36_18%_86%)] bg-[hsl(36_32%_99%)] px-3.5 py-2 text-sm font-body shadow-[inset_0_1px_2px_rgba(45,35,48,0.04)] transition-[box-shadow,border-color,background-color] duration-200 ease-out",
  "dark:border-[hsl(213_28%_22%)] dark:bg-[hsl(213_32%_13%)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.22)]",
  FIELD_FOCUS,
  "focus-visible:border-[#E8AEB7]/55",
);

const TEXTAREA_FIELD_CLASS = cn(
  "min-h-[88px] resize-none rounded-[14px] border border-[hsl(36_18%_86%)] bg-[hsl(36_32%_99%)] px-3.5 py-3 text-sm font-body shadow-[inset_0_1px_2px_rgba(45,35,48,0.04)] transition-[box-shadow,border-color,background-color] duration-200 ease-out",
  "dark:border-[hsl(213_28%_22%)] dark:bg-[hsl(213_32%_13%)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.22)]",
  FIELD_FOCUS,
  "focus-visible:border-[#E8AEB7]/55",
);

const SELECT_TRIGGER_CLASS = cn(
  "flex h-11 w-full items-center justify-between rounded-[14px] border border-[hsl(36_18%_86%)] bg-[hsl(36_32%_99%)] px-3.5 py-2 text-sm font-body text-foreground shadow-[inset_0_1px_2px_rgba(45,35,48,0.04)] transition-[box-shadow,border-color,background-color] duration-200 ease-out",
  "dark:border-[hsl(213_28%_22%)] dark:bg-[hsl(213_32%_13%)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.22)]",
  "data-[placeholder]:text-muted-foreground [&>span]:line-clamp-1",
  FIELD_FOCUS,
  "focus:border-[#E8AEB7]/55",
);

const SELECT_CONTENT_CLASS = cn(
  "z-[200] max-h-96 overflow-hidden rounded-[14px] border border-[hsl(36_18%_86%)] bg-[hsl(36_32%_99%)] p-1 text-popover-foreground shadow-[0_16px_48px_rgba(45,35,48,0.12)] backdrop-blur-xl",
  "dark:border-[hsl(213_28%_22%)] dark:bg-[hsl(213_32%_13%)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.45)]",
);

const SELECT_ITEM_CLASS =
  "cursor-pointer rounded-[10px] py-2.5 pl-8 pr-2 font-body text-sm outline-none focus:bg-[#E8AEB7]/16 focus:text-foreground data-[highlighted]:bg-[#E8AEB7]/16 data-[highlighted]:text-foreground";

const LABEL_CLASS = "mb-1.5 block font-body text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground";

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

function mapCategoryToBackend(category: SupporterCategory, isOrgByName: boolean): {
  supporterType: string;
  relationshipType: string;
} {
  if (isOrgByName) {
    if (category === "foundation") {
      return { supporterType: "PartnerOrganization", relationshipType: "Local" };
    }
    return { supporterType: "PartnerOrganization", relationshipType: "PartnerOrganization" };
  }
  if (category === "foundation") {
    return { supporterType: "PartnerOrganization", relationshipType: "Local" };
  }
  return { supporterType: "MonetaryDonor", relationshipType: "Local" };
}

function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t ? t : null;
}

export function AddSupporterModal({ open, onOpenChange, onSuccess }: AddSupporterModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<SupporterCategory>("individual");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setFirstName("");
    setLastName("");
    setOrganizationName("");
    setEmail("");
    setPhone("");
    setCategory("individual");
    setNotes("");
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const orgFilled = organizationName.trim().length > 0;
  const displayName = orgFilled
    ? organizationName.trim()
    : `${firstName.trim()} ${lastName.trim()}`.trim();

  const handleCreateSupporter = async () => {
    setError(null);

    const orgNameTrim = organizationName.trim();

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone is required.");
      return;
    }
    if (!orgFilled) {
      if (!firstName.trim() || !lastName.trim()) {
        setError("Enter first and last name, or use organization name instead.");
        return;
      }
    }

    const { supporterType, relationshipType } = mapCategoryToBackend(category, orgFilled);

    // Payload matches DB-style schema (snake_case). Backend also accepts camelCase.
    // Convert empty strings to null to avoid DB constraint / validation issues.
    const payload: Record<string, unknown> = {
      supporter_type: supporterType,
      first_name: orgFilled ? null : emptyToNull(firstName),
      last_name: orgFilled ? null : emptyToNull(lastName),
      organization_name: orgFilled ? emptyToNull(orgNameTrim) : null,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      // Backend-required fields that we default if not provided; send explicitly for clarity.
      relationship_type: relationshipType,
      status: "Active",
      // Not stored on supporter row today; backend will ignore if present.
      notes: emptyToNull(notes),
    };

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
      await onSuccess({ id: String(idNum), name: displayName, notes: notes.trim() });
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
            console.log("Submitting supporter");
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
                If organization name is filled, this record is stored as an organization. Otherwise, use first and last name for an
                individual.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 px-6 py-7 sm:px-7">
            <div className="grid gap-1">
              <Label className={LABEL_CLASS}>Supporter type</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as SupporterCategory)} disabled={saving}>
                <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className={SELECT_CONTENT_CLASS}>
                  <SelectItem value="individual" className={SELECT_ITEM_CLASS}>
                    Individual
                  </SelectItem>
                  <SelectItem value="organization" className={SELECT_ITEM_CLASS}>
                    Organization
                  </SelectItem>
                  <SelectItem value="foundation" className={SELECT_ITEM_CLASS}>
                    Foundation
                  </SelectItem>
                </SelectContent>
              </Select>
              {orgFilled ? (
                <p className="mt-1.5 font-body text-xs text-muted-foreground">
                  Organization name is set: this record is stored as an organization (foundation vs corporate partner follows your type
                  above).
                </p>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-5">
              <div className="grid gap-1">
                <Label htmlFor="ns-first" className={LABEL_CLASS}>
                  First name{orgFilled ? "" : " *"}
                </Label>
                <Input
                  id="ns-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={saving || orgFilled}
                  autoComplete="given-name"
                  className={INPUT_FIELD_CLASS}
                  placeholder={orgFilled ? "—" : "Jane"}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="ns-last" className={LABEL_CLASS}>
                  Last name{orgFilled ? "" : " *"}
                </Label>
                <Input
                  id="ns-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={saving || orgFilled}
                  autoComplete="family-name"
                  className={INPUT_FIELD_CLASS}
                  placeholder={orgFilled ? "—" : "Doe"}
                />
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="ns-org" className={LABEL_CLASS}>
                Organization name <span className="font-normal normal-case tracking-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="ns-org"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                disabled={saving}
                className={INPUT_FIELD_CLASS}
                placeholder="Leave blank for an individual"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-5">
              <div className="grid gap-1">
                <Label htmlFor="ns-email" className={LABEL_CLASS}>
                  Email *
                </Label>
                <Input
                  id="ns-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                  autoComplete="email"
                  className={INPUT_FIELD_CLASS}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="ns-phone" className={LABEL_CLASS}>
                  Phone *
                </Label>
                <Input
                  id="ns-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={saving}
                  autoComplete="tel"
                  className={INPUT_FIELD_CLASS}
                />
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="ns-notes" className={LABEL_CLASS}>
                Notes <span className="font-normal normal-case tracking-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="ns-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={saving}
                placeholder="Shown on the donor profile in this session (not stored on the supporter row)."
                rows={3}
                className={TEXTAREA_FIELD_CLASS}
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive" role="alert">
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
