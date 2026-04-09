import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CaseCategory, ResidentCase, SocioDemoProfile } from "@/lib/caseloadTypes";
import { caseCategories, reintegrationPhases } from "@/lib/caseloadTypes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const STEPS = ["Profile", "Case classification", "Family context", "Admission & assignment"] as const;

type AddEditCaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ResidentCase | null;
  onSave: (c: ResidentCase) => void;
  safehouseOptions: string[];
  workerOptions: string[];
  /** From GET /api/residents/next-display-name; null until first successful prefetch. */
  suggestedNextDisplayName: string | null;
};

const emptySocio: SocioDemoProfile = {
  fourPsBeneficiary: false,
  soloParentHousehold: false,
  indigenousGroup: "",
  informalSettler: false,
};

function toFormState(c: ResidentCase | null, safehouseOptions: string[], workerOptions: string[]): FormState {
  const sh = safehouseOptions[0] ?? "—";
  const wk = workerOptions[0] ?? "—";
  if (!c) {
    return {
      displayName: "",
      anonymized: true,
      age: "25",
      ageUponAdmission: "",
      presentAge: "",
      lengthOfStay: "",
      gender: "Female",
      birthStatus: "",
      religion: "",
      category: "Domestic violence" as CaseCategory,
      subcategory: "",
      disability: "",
      socio: { ...emptySocio },
      familyParentPwd: false,
      admissionDate: new Date().toISOString().slice(0, 10),
      referralSource: "",
      referringAgencyPerson: "",
      originLocation: "",
      dateColbRegistered: "",
      dateColbObtained: "",
      dateCaseStudyPrepared: "",
      safehouse: sh,
      assignedWorker: wk,
      reintegrationType: "",
      reintegrationStatus: "",
      dateClosed: "",
      caseNotes: "",
    };
  }
  return {
    displayName: c.displayName,
    anonymized: c.anonymized,
    age: String(c.age),
    ageUponAdmission: c.ageUponAdmission ?? "",
    presentAge: c.presentAge ?? "",
    lengthOfStay: c.lengthOfStay ?? "",
    gender: c.gender,
    birthStatus: c.birthStatus ?? "",
    religion: c.religion ?? "",
    category: c.category,
    subcategory: c.subcategory,
    disability: c.disability ?? "",
    socio: {
      fourPsBeneficiary: c.socio.fourPsBeneficiary,
      soloParentHousehold: c.socio.soloParentHousehold,
      indigenousGroup: c.socio.indigenousGroup ?? "",
      informalSettler: c.socio.informalSettler,
    },
    familyParentPwd: c.familyParentPwd,
    admissionDate: c.admissionDate,
    referralSource: c.referralSource,
    referringAgencyPerson: c.referringAgencyPerson ?? "",
    originLocation: c.originLocation,
    dateColbRegistered: c.dateColbRegistered ?? "",
    dateColbObtained: c.dateColbObtained ?? "",
    dateCaseStudyPrepared: c.dateCaseStudyPrepared ?? "",
    safehouse: c.safehouse,
    assignedWorker: c.assignedWorker,
    reintegrationType: c.reintegrationType ?? "",
    reintegrationStatus: c.reintegrationStatus ?? "",
    dateClosed: c.dateClosed ?? "",
    caseNotes: c.caseNotes,
  };
}

type FormState = {
  displayName: string;
  anonymized: boolean;
  age: string;
  ageUponAdmission: string;
  presentAge: string;
  lengthOfStay: string;
  gender: string;
  birthStatus: string;
  religion: string;
  category: CaseCategory;
  subcategory: string;
  disability: string;
  socio: SocioDemoProfile & { indigenousGroup: string };
  familyParentPwd: boolean;
  admissionDate: string;
  referralSource: string;
  referringAgencyPerson: string;
  originLocation: string;
  dateColbRegistered: string;
  dateColbObtained: string;
  dateCaseStudyPrepared: string;
  safehouse: string;
  assignedWorker: string;
  reintegrationType: string;
  reintegrationStatus: string;
  dateClosed: string;
  caseNotes: string;
};

export function AddEditCaseDialog({
  open,
  onOpenChange,
  editing,
  onSave,
  safehouseOptions,
  workerOptions,
  suggestedNextDisplayName,
}: AddEditCaseDialogProps) {
  const shOpts = useMemo(
    () => (safehouseOptions.length ? safehouseOptions : ["—"]),
    [safehouseOptions]
  );
  const wOpts = useMemo(() => (workerOptions.length ? workerOptions : ["—"]), [workerOptions]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => toFormState(null, ["—"], ["—"]));
  const displayNameEditedRef = useRef(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      displayNameEditedRef.current = false;
      setForm(toFormState(editing, shOpts, wOpts));
    }
  }, [open, editing, shOpts, wOpts]);

  useEffect(() => {
    if (open && !editing && suggestedNextDisplayName && !displayNameEditedRef.current) {
      setForm((f) => ({ ...f, displayName: suggestedNextDisplayName }));
    }
  }, [open, editing, suggestedNextDisplayName]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const buildCase = (): ResidentCase => {
    const base = editing;
    const id = base?.id ?? `CS-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const parsedAge = Number.parseInt(form.age, 10);
    const normalizedAge = Number.isNaN(parsedAge) ? 0 : parsedAge;
    const socio: SocioDemoProfile = {
      fourPsBeneficiary: form.socio.fourPsBeneficiary,
      soloParentHousehold: form.socio.soloParentHousehold,
      indigenousGroup: form.socio.indigenousGroup.trim() || null,
      informalSettler: form.socio.informalSettler,
    };
    return {
      id,
      displayName: form.displayName.trim() || "Resident (unnamed)",
      anonymized: form.anonymized,
      age: normalizedAge,
      ageUponAdmission: form.ageUponAdmission.trim(),
      presentAge: form.presentAge.trim(),
      lengthOfStay: form.lengthOfStay.trim(),
      gender: form.gender,
      birthStatus: form.birthStatus.trim() || null,
      religion: form.religion.trim() || null,
      category: form.category,
      subcategory: form.subcategory.trim() || "—",
      disability: form.disability.trim() || null,
      socio,
      familyParentPwd: form.familyParentPwd,
      admissionDate: form.admissionDate,
      referralSource: form.referralSource.trim() || "—",
      referringAgencyPerson: form.referringAgencyPerson.trim() || null,
      originLocation: form.originLocation.trim() || "—",
      dateColbRegistered: form.dateColbRegistered || null,
      dateColbObtained: form.dateColbObtained || null,
      dateCaseStudyPrepared: form.dateCaseStudyPrepared || null,
      safehouse: form.safehouse,
      assignedWorker: form.assignedWorker,
      reintegrationType: form.reintegrationType.trim() || null,
      reintegrationStatus: form.reintegrationStatus.trim() || null,
      dateClosed: form.dateClosed || null,
      caseNotes: form.caseNotes.trim() || "—",
      status: base?.status ?? "Pending",
      riskLevel: base?.riskLevel ?? "Standard",
      reintegrationProgress: base?.reintegrationProgress ?? 5,
      phaseIndex: base?.phaseIndex ?? 0,
      lastUpdate: new Date().toISOString().slice(0, 10),
      keywords: base?.keywords ?? [],
      timeline: base?.timeline ?? [
        {
          id: `t-new-${Date.now()}`,
          at: new Date().toISOString(),
          summary: "Case created or updated in the system.",
        },
      ],
    };
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,880px)] max-w-[min(100%,40rem)] overflow-hidden rounded-[1.35rem] border-0 bg-[hsl(36_32%_97%)] p-0 shadow-[0_24px_80px_rgba(45,35,48,0.12)] dark:bg-[hsl(213_40%_10%)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        <div className="border-b border-white/50 px-6 pb-4 pt-6 dark:border-white/10">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="font-display text-2xl font-bold tracking-[-0.02em]">
              {editing ? "Edit case record" : "New case record"}
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              Complete each section carefully. You can return to earlier steps before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex gap-1.5">
            {STEPS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "flex-1 rounded-xl px-2 py-2 text-center font-body text-[10px] font-semibold uppercase tracking-wide transition-colors",
                  i === step
                    ? "bg-[hsl(340_32%_88%)]/90 text-[hsl(340_32%_28%)] dark:bg-[hsl(340_22%_22%)] dark:text-[hsl(340_35%_90%)]"
                    : i < step
                      ? "bg-white/50 text-muted-foreground hover:bg-white/70 dark:bg-white/10 dark:hover:bg-white/15"
                      : "bg-white/35 text-muted-foreground/80 hover:bg-white/55 dark:bg-white/[0.07]"
                )}
              >
                <span className="block truncate">{label}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/50 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[hsl(340_42%_68%)] to-[hsl(10_40%_58%)]"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          </div>
        </div>

        <div className="max-h-[min(56vh,520px)] overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="s0"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="font-body text-xs">
                    Display name
                  </Label>
                  <Input
                    id="displayName"
                    value={form.displayName}
                    onChange={(e) => {
                      displayNameEditedRef.current = true;
                      setField("displayName", e.target.value);
                    }}
                    readOnly={!editing}
                    className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    placeholder="e.g. Resident A."
                  />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-2 dark:border-white/10 dark:bg-white/[0.06]">
                  <Checkbox
                    id="anon"
                    checked={form.anonymized}
                    onCheckedChange={(v) => setField("anonymized", !!v)}
                  />
                  <Label htmlFor="anon" className="font-body text-sm font-normal text-foreground/90">
                    Use anonymized display (recommended for reports)
                  </Label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="font-body text-xs">
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      max={120}
                      value={form.age ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                          setField("age", val);
                        }
                      }}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="font-body text-xs">
                      Gender
                    </Label>
                    <Input
                      id="gender"
                      value={form.gender}
                      onChange={(e) => setField("gender", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="birthStatus" className="font-body text-xs">
                      Birth status
                    </Label>
                    <Input
                      id="birthStatus"
                      value={form.birthStatus}
                      onChange={(e) => setField("birthStatus", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                      placeholder="Marital / Non-Marital"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="religion" className="font-body text-xs">
                      Religion
                    </Label>
                    <Input
                      id="religion"
                      value={form.religion}
                      onChange={(e) => setField("religion", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="font-body text-xs">Primary category</Label>
                  <Select value={form.category} onValueChange={(v) => setField("category", v as CaseCategory)}>
                    <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {caseCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub" className="font-body text-xs">
                    Subcategory
                  </Label>
                  <Input
                    id="sub"
                    value={form.subcategory}
                    onChange={(e) => setField("subcategory", e.target.value)}
                    className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    placeholder="Brief descriptor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dis" className="font-body text-xs">
                    Disability & accessibility needs
                  </Label>
                  <Textarea
                    id="dis"
                    value={form.disability}
                    onChange={(e) => setField("disability", e.target.value)}
                    className="min-h-[100px] rounded-xl border-white/60 bg-white/70 font-body text-sm dark:border-white/10 dark:bg-white/10"
                    placeholder="Leave blank if none, or describe supports required"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-3 dark:border-white/10 dark:bg-white/[0.06]">
                    <Checkbox
                      checked={form.socio.fourPsBeneficiary}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, socio: { ...f.socio, fourPsBeneficiary: !!v } }))
                      }
                    />
                    <span className="font-body text-sm">4Ps beneficiary</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-3 dark:border-white/10 dark:bg-white/[0.06]">
                    <Checkbox
                      checked={form.socio.soloParentHousehold}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, socio: { ...f.socio, soloParentHousehold: !!v } }))
                      }
                    />
                    <span className="font-body text-sm">Solo parent household</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-3 dark:border-white/10 dark:bg-white/[0.06]">
                    <Checkbox
                      checked={form.socio.informalSettler}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, socio: { ...f.socio, informalSettler: !!v } }))
                      }
                    />
                    <span className="font-body text-sm">Informal settler status</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-3 dark:border-white/10 dark:bg-white/[0.06]">
                    <Checkbox
                      checked={form.familyParentPwd}
                      onCheckedChange={(v) => setField("familyParentPwd", !!v)}
                    />
                    <span className="font-body text-sm">Parent/guardian with disability</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ind" className="font-body text-xs">
                    Indigenous group (if applicable)
                  </Label>
                  <Input
                    id="ind"
                    value={form.socio.indigenousGroup}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, socio: { ...f.socio, indigenousGroup: e.target.value } }))
                    }
                    className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    placeholder="e.g. Lumad — or leave blank"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="adm" className="font-body text-xs">
                      Admission date
                    </Label>
                    <Input
                      id="adm"
                      type="date"
                      value={form.admissionDate}
                      onChange={(e) => setField("admissionDate", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body text-xs">Safehouse</Label>
                    <Select value={form.safehouse} onValueChange={(v) => setField("safehouse", v)}>
                      <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {shOpts.map((sh) => (
                          <SelectItem key={sh} value={sh}>
                            {sh}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ref" className="font-body text-xs">
                    Referral source
                  </Label>
                  <Input
                    id="ref"
                    value={form.referralSource}
                    onChange={(e) => setField("referralSource", e.target.value)}
                    className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origin" className="font-body text-xs">
                    Origin location
                  </Label>
                  <Input
                    id="origin"
                    value={form.originLocation}
                    onChange={(e) => setField("originLocation", e.target.value)}
                    className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refPerson" className="font-body text-xs">
                    Referring agency person
                  </Label>
                  <Input
                    id="refPerson"
                    value={form.referringAgencyPerson}
                    onChange={(e) => setField("referringAgencyPerson", e.target.value)}
                    className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="ageAdmission" className="font-body text-xs">
                      Age upon admission
                    </Label>
                    <Input
                      id="ageAdmission"
                      value={form.ageUponAdmission}
                      onChange={(e) => setField("ageUponAdmission", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="presentAge" className="font-body text-xs">
                      Present age
                    </Label>
                    <Input
                      id="presentAge"
                      value={form.presentAge}
                      onChange={(e) => setField("presentAge", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lengthStay" className="font-body text-xs">
                      Length of stay
                    </Label>
                    <Input
                      id="lengthStay"
                      value={form.lengthOfStay}
                      onChange={(e) => setField("lengthOfStay", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="colbReg" className="font-body text-xs">
                      Date COLB registered
                    </Label>
                    <Input
                      id="colbReg"
                      type="date"
                      value={form.dateColbRegistered}
                      onChange={(e) => setField("dateColbRegistered", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colbObtained" className="font-body text-xs">
                      Date COLB obtained
                    </Label>
                    <Input
                      id="colbObtained"
                      type="date"
                      value={form.dateColbObtained}
                      onChange={(e) => setField("dateColbObtained", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="caseStudyDate" className="font-body text-xs">
                      Case study prepared
                    </Label>
                    <Input
                      id="caseStudyDate"
                      type="date"
                      value={form.dateCaseStudyPrepared}
                      onChange={(e) => setField("dateCaseStudyPrepared", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reinType" className="font-body text-xs">
                      Reintegration type
                    </Label>
                    <Input
                      id="reinType"
                      value={form.reintegrationType}
                      onChange={(e) => setField("reintegrationType", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reinStatus" className="font-body text-xs">
                      Reintegration status
                    </Label>
                    <Input
                      id="reinStatus"
                      value={form.reintegrationStatus}
                      onChange={(e) => setField("reintegrationStatus", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateClosed" className="font-body text-xs">
                    Date closed
                  </Label>
                  <Input
                    id="dateClosed"
                    type="date"
                    value={form.dateClosed}
                    onChange={(e) => setField("dateClosed", e.target.value)}
                    className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-xs">Assigned social worker</Label>
                  <Select value={form.assignedWorker} onValueChange={(v) => setField("assignedWorker", v)}>
                    <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {wOpts.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="font-body text-xs">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={form.caseNotes}
                    onChange={(e) => setField("caseNotes", e.target.value)}
                    className="min-h-[88px] rounded-xl border-white/60 bg-white/70 font-body text-sm dark:border-white/10 dark:bg-white/10"
                  />
                </div>
                <p className="rounded-xl bg-white/45 px-3 py-2 font-body text-[11px] leading-relaxed text-muted-foreground dark:bg-white/[0.06]">
                  Phases tracked: {reintegrationPhases.join(" → ")}. Status and risk level are assigned by supervisors
                  after review.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="gap-2 border-t border-white/50 px-6 py-4 dark:border-white/10 sm:justify-between">
          <Button type="button" variant="ghost" className="rounded-xl font-body" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" className="rounded-xl font-body" onClick={back}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                className="rounded-xl bg-gradient-to-r from-[hsl(340_44%_62%)] to-[hsl(10_42%_56%)] font-body font-semibold text-white shadow-md"
                onClick={next}
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-xl bg-gradient-to-r from-[hsl(340_44%_62%)] to-[hsl(10_42%_56%)] font-body font-semibold text-white shadow-md"
                onClick={() => {
                  onSave(buildCase());
                  onOpenChange(false);
                }}
              >
                Save record
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
