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
import type { DbCaseStatus, ResidentCase, SchemaCaseCategory, SchemaRiskLevel } from "@/lib/caseloadTypes";
import {
  birthStatuses,
  buildSubcategorySummary,
  caseCategories,
  caseStatuses,
  referralSources,
  reintegrationPhases,
  reintegrationStatuses,
  reintegrationTypes,
  schemaRiskLevels,
  sexOptions,
  subcategoryFormFields,
  uiRiskFromSchemaCurrent,
} from "@/lib/caseloadTypes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const STEPS = ["Profile", "Case Classification", "Family Context", "Admission & Assignment"] as const;

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

function defaultDobIso(): string {
  const y = new Date().getFullYear() - 10;
  return `${y}-01-01`;
}

function toFormState(c: ResidentCase | null, safehouseOptions: string[], workerOptions: string[]): FormState {
  const sh = safehouseOptions[0] ?? "—";
  const wk = workerOptions[0] ?? "—";
  if (!c) {
    return {
      displayName: "",
      caseStatus: "Active",
      sex: "F",
      dateOfBirth: defaultDobIso(),
      birthStatus: "",
      placeOfBirth: "",
      religion: "",
      caseCategory: "Neglected",
      subCatOrphaned: false,
      subCatTrafficked: false,
      subCatChildLabor: false,
      subCatPhysicalAbuse: false,
      subCatSexualAbuse: false,
      subCatOsaec: false,
      subCatCicl: false,
      subCatAtRisk: false,
      subCatStreetChild: false,
      subCatChildWithHiv: false,
      isPwd: false,
      pwdType: "",
      hasSpecialNeeds: false,
      specialNeedsDiagnosis: "",
      familyIs4ps: false,
      familySoloParent: false,
      familyIndigenous: false,
      familyParentPwd: false,
      familyInformalSettler: false,
      admissionDate: new Date().toISOString().slice(0, 10),
      dateEnrolled: new Date().toISOString().slice(0, 10),
      referralSource: "",
      referringAgencyPerson: "",
      dateColbRegistered: "",
      dateColbObtained: "",
      dateCaseStudyPrepared: "",
      initialCaseAssessment: "",
      reintegrationType: "",
      reintegrationStatus: "",
      initialRiskLevel: "Low",
      currentRiskLevel: "Low",
      dateClosed: "",
      notesRestricted: "",
      safehouse: sh,
      assignedWorker: wk,
    };
  }
  return {
    displayName: c.displayName,
    caseStatus: c.caseStatus,
    sex: c.sex || "F",
    dateOfBirth: c.dateOfBirth?.slice(0, 10) ?? defaultDobIso(),
    birthStatus: c.birthStatus ?? "",
    placeOfBirth: c.placeOfBirth ?? "",
    religion: c.religion ?? "",
    caseCategory: c.caseCategory,
    subCatOrphaned: c.subCatOrphaned,
    subCatTrafficked: c.subCatTrafficked,
    subCatChildLabor: c.subCatChildLabor,
    subCatPhysicalAbuse: c.subCatPhysicalAbuse,
    subCatSexualAbuse: c.subCatSexualAbuse,
    subCatOsaec: c.subCatOsaec,
    subCatCicl: c.subCatCicl,
    subCatAtRisk: c.subCatAtRisk,
    subCatStreetChild: c.subCatStreetChild,
    subCatChildWithHiv: c.subCatChildWithHiv,
    isPwd: c.isPwd,
    pwdType: c.pwdType ?? "",
    hasSpecialNeeds: c.hasSpecialNeeds,
    specialNeedsDiagnosis: c.specialNeedsDiagnosis ?? "",
    familyIs4ps: c.familyIs4ps,
    familySoloParent: c.familySoloParent,
    familyIndigenous: c.familyIndigenous,
    familyParentPwd: c.familyParentPwd,
    familyInformalSettler: c.familyInformalSettler,
    admissionDate: c.admissionDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    dateEnrolled: c.dateEnrolled?.slice(0, 10) ?? c.admissionDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    referralSource: c.referralSource ?? "",
    referringAgencyPerson: c.referringAgencyPerson ?? "",
    dateColbRegistered: c.dateColbRegistered ?? "",
    dateColbObtained: c.dateColbObtained ?? "",
    dateCaseStudyPrepared: c.dateCaseStudyPrepared ?? "",
    initialCaseAssessment: c.initialCaseAssessment ?? "",
    reintegrationType: c.reintegrationType ?? "",
    reintegrationStatus: c.reintegrationStatus ?? "",
    initialRiskLevel: c.initialRiskLevel,
    currentRiskLevel: c.currentRiskLevel,
    dateClosed: c.dateClosed ?? "",
    notesRestricted: c.notesRestricted ?? "",
    safehouse: c.safehouse,
    assignedWorker: c.assignedWorker,
  };
}

type FormState = {
  displayName: string;
  caseStatus: DbCaseStatus;
  sex: string;
  dateOfBirth: string;
  birthStatus: string;
  placeOfBirth: string;
  religion: string;
  caseCategory: SchemaCaseCategory;
  subCatOrphaned: boolean;
  subCatTrafficked: boolean;
  subCatChildLabor: boolean;
  subCatPhysicalAbuse: boolean;
  subCatSexualAbuse: boolean;
  subCatOsaec: boolean;
  subCatCicl: boolean;
  subCatAtRisk: boolean;
  subCatStreetChild: boolean;
  subCatChildWithHiv: boolean;
  isPwd: boolean;
  pwdType: string;
  hasSpecialNeeds: boolean;
  specialNeedsDiagnosis: string;
  familyIs4ps: boolean;
  familySoloParent: boolean;
  familyIndigenous: boolean;
  familyParentPwd: boolean;
  familyInformalSettler: boolean;
  admissionDate: string;
  dateEnrolled: string;
  referralSource: string;
  referringAgencyPerson: string;
  dateColbRegistered: string;
  dateColbObtained: string;
  dateCaseStudyPrepared: string;
  initialCaseAssessment: string;
  reintegrationType: string;
  reintegrationStatus: string;
  initialRiskLevel: SchemaRiskLevel;
  currentRiskLevel: SchemaRiskLevel;
  dateClosed: string;
  notesRestricted: string;
  safehouse: string;
  assignedWorker: string;
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
    const residentId = base?.residentId ?? 0;

    const subPick = {
      subCatOrphaned: form.subCatOrphaned,
      subCatTrafficked: form.subCatTrafficked,
      subCatChildLabor: form.subCatChildLabor,
      subCatPhysicalAbuse: form.subCatPhysicalAbuse,
      subCatSexualAbuse: form.subCatSexualAbuse,
      subCatOsaec: form.subCatOsaec,
      subCatCicl: form.subCatCicl,
      subCatAtRisk: form.subCatAtRisk,
      subCatStreetChild: form.subCatStreetChild,
      subCatChildWithHiv: form.subCatChildWithHiv,
    };

    return {
      residentId,
      id,
      displayName: form.displayName.trim() || "LS-0001",
      caseStatus: form.caseStatus,
      sex: form.sex,
      dateOfBirth: form.dateOfBirth,
      birthStatus: form.birthStatus.trim() || null,
      placeOfBirth: form.placeOfBirth.trim() || null,
      religion: form.religion.trim() || null,
      caseCategory: form.caseCategory,
      subcategory: buildSubcategorySummary(subPick),
      ...subPick,
      isPwd: form.isPwd,
      pwdType: form.pwdType.trim() || null,
      hasSpecialNeeds: form.hasSpecialNeeds,
      specialNeedsDiagnosis: form.specialNeedsDiagnosis.trim() || null,
      familyIs4ps: form.familyIs4ps,
      familySoloParent: form.familySoloParent,
      familyIndigenous: form.familyIndigenous,
      familyParentPwd: form.familyParentPwd,
      familyInformalSettler: form.familyInformalSettler,
      admissionDate: form.admissionDate,
      dateEnrolled: form.dateEnrolled,
      referralSource: form.referralSource.trim() || null,
      referringAgencyPerson: form.referringAgencyPerson.trim() || null,
      dateColbRegistered: form.dateColbRegistered || null,
      dateColbObtained: form.dateColbObtained || null,
      dateCaseStudyPrepared: form.dateCaseStudyPrepared || null,
      initialCaseAssessment: form.initialCaseAssessment.trim() || null,
      reintegrationType: form.reintegrationType.trim() || null,
      reintegrationStatus: form.reintegrationStatus.trim() || null,
      dateClosed: form.dateClosed || null,
      initialRiskLevel: form.initialRiskLevel,
      currentRiskLevel: form.currentRiskLevel,
      notesRestricted: form.notesRestricted.trim() || null,
      safehouse: form.safehouse,
      assignedWorker: form.assignedWorker,
      status: base?.status ?? "Active",
      riskLevel: uiRiskFromSchemaCurrent(form.currentRiskLevel),
      reintegrationProgress: base?.reintegrationProgress ?? 0,
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
                    className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    placeholder="Internal code (e.g. LS-0067)"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="font-body text-xs">
                      Date of birth
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setField("dateOfBirth", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body text-xs">Sex</Label>
                    <Select value={form.sex} onValueChange={(v) => setField("sex", v)}>
                      <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sexOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s === "F" ? "F" : "M"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-body text-xs">Birth status</Label>
                    <Select value={form.birthStatus || "__none__"} onValueChange={(v) => setField("birthStatus", v === "__none__" ? "" : v)}>
                      <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Not specified</SelectItem>
                        {birthStatuses.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                <div className="space-y-2">
                  <Label htmlFor="pob" className="font-body text-xs">
                    Place of birth
                  </Label>
                  <Input
                    id="pob"
                    value={form.placeOfBirth}
                    onChange={(e) => setField("placeOfBirth", e.target.value)}
                    className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    placeholder="Optional"
                  />
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
                  <Label className="font-body text-xs">Case status</Label>
                  <Select value={form.caseStatus} onValueChange={(v) => setField("caseStatus", v as DbCaseStatus)}>
                    <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {caseStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-xs">Case category</Label>
                  <Select
                    value={form.caseCategory}
                    onValueChange={(v) => setField("caseCategory", v as SchemaCaseCategory)}
                  >
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
                  <Label className="font-body text-xs">Subcategory flags</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {subcategoryFormFields.map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-2 dark:border-white/10 dark:bg-white/[0.06]"
                      >
                        <Checkbox
                          checked={form[key]}
                          onCheckedChange={(v) => setField(key, !!v)}
                        />
                        <span className="font-body text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-2 dark:border-white/10 dark:bg-white/[0.06]">
                    <Checkbox checked={form.isPwd} onCheckedChange={(v) => setField("isPwd", !!v)} />
                    <span className="font-body text-sm">PWD</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-2 dark:border-white/10 dark:bg-white/[0.06]">
                    <Checkbox
                      checked={form.hasSpecialNeeds}
                      onCheckedChange={(v) => setField("hasSpecialNeeds", !!v)}
                    />
                    <span className="font-body text-sm">Special needs</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pwdType" className="font-body text-xs">
                    PWD type
                  </Label>
                  <Input
                    id="pwdType"
                    value={form.pwdType}
                    onChange={(e) => setField("pwdType", e.target.value)}
                    className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="snd" className="font-body text-xs">
                    Special needs diagnosis
                  </Label>
                  <Textarea
                    id="snd"
                    value={form.specialNeedsDiagnosis}
                    onChange={(e) => setField("specialNeedsDiagnosis", e.target.value)}
                    className="min-h-[88px] rounded-xl border-white/60 bg-white/70 font-body text-sm dark:border-white/10 dark:bg-white/10"
                    placeholder="Optional"
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
                      checked={form.familyIs4ps}
                      onCheckedChange={(v) => setField("familyIs4ps", !!v)}
                    />
                    <span className="font-body text-sm">4Ps beneficiary</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-3 dark:border-white/10 dark:bg-white/[0.06]">
                    <Checkbox
                      checked={form.familySoloParent}
                      onCheckedChange={(v) => setField("familySoloParent", !!v)}
                    />
                    <span className="font-body text-sm">Solo parent household</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-3 dark:border-white/10 dark:bg-white/[0.06]">
                    <Checkbox
                      checked={form.familyIndigenous}
                      onCheckedChange={(v) => setField("familyIndigenous", !!v)}
                    />
                    <span className="font-body text-sm">Indigenous</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-3 dark:border-white/10 dark:bg-white/[0.06]">
                    <Checkbox
                      checked={form.familyInformalSettler}
                      onCheckedChange={(v) => setField("familyInformalSettler", !!v)}
                    />
                    <span className="font-body text-sm">Informal settler</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-3 dark:border-white/10 dark:bg-white/[0.06]">
                    <Checkbox
                      checked={form.familyParentPwd}
                      onCheckedChange={(v) => setField("familyParentPwd", !!v)}
                    />
                    <span className="font-body text-sm">Parent/guardian with disability</span>
                  </label>
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
                      Date of admission
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
                    <Label htmlFor="enr" className="font-body text-xs">
                      Date enrolled
                    </Label>
                    <Input
                      id="enr"
                      type="date"
                      value={form.dateEnrolled}
                      onChange={(e) => setField("dateEnrolled", e.target.value)}
                      className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-xs">Referral source</Label>
                  <Select
                    value={form.referralSource || "__none__"}
                    onValueChange={(v) => setField("referralSource", v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not specified</SelectItem>
                      {referralSources.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="caseStudyDate" className="font-body text-xs">
                      Date case study prepared
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
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-body text-xs">Initial risk level</Label>
                    <Select
                      value={form.initialRiskLevel}
                      onValueChange={(v) => setField("initialRiskLevel", v as SchemaRiskLevel)}
                    >
                      <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {schemaRiskLevels.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body text-xs">Current risk level</Label>
                    <Select
                      value={form.currentRiskLevel}
                      onValueChange={(v) => setField("currentRiskLevel", v as SchemaRiskLevel)}
                    >
                      <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {schemaRiskLevels.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-body text-xs">Reintegration type</Label>
                    <Select
                      value={form.reintegrationType || "__none__"}
                      onValueChange={(v) => setField("reintegrationType", v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Not specified</SelectItem>
                        {reintegrationTypes.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body text-xs">Reintegration status</Label>
                    <Select
                      value={form.reintegrationStatus || "__none__"}
                      onValueChange={(v) => setField("reintegrationStatus", v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Not specified</SelectItem>
                        {reintegrationStatuses.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ica" className="font-body text-xs">
                    Initial case assessment
                  </Label>
                  <Textarea
                    id="ica"
                    value={form.initialCaseAssessment}
                    onChange={(e) => setField("initialCaseAssessment", e.target.value)}
                    className="min-h-[88px] rounded-xl border-white/60 bg-white/70 font-body text-sm dark:border-white/10 dark:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notesRest" className="font-body text-xs">
                    Notes (restricted)
                  </Label>
                  <Textarea
                    id="notesRest"
                    value={form.notesRestricted}
                    onChange={(e) => setField("notesRestricted", e.target.value)}
                    className="min-h-[88px] rounded-xl border-white/60 bg-white/70 font-body text-sm dark:border-white/10 dark:bg-white/10"
                  />
                </div>
                <p className="rounded-xl bg-white/45 px-3 py-2 font-body text-[11px] leading-relaxed text-muted-foreground dark:bg-white/[0.06]">
                  Phases tracked: {reintegrationPhases.join(" → ")}. List status reflects case status, risk, and
                  reintegration rules after save.
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
