import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RefObject } from "react";
import {
  ACQUISITION_CHANNELS,
  RELATIONSHIP_TYPES,
  SUPPORTER_TYPES,
  type SupporterFormErrors,
  type SupporterFormValues,
} from "./supporterFormModel";

const labelClass = "font-body text-xs font-medium text-gray-700 dark:text-gray-300 leading-none";

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

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-800 dark:text-gray-200">
      {children}
    </p>
  );
}

type SupporterFormProps = {
  mode: "create" | "edit";
  values: SupporterFormValues;
  errors?: SupporterFormErrors;
  disabled?: boolean;
  onChange: (field: keyof SupporterFormValues, value: string) => void;
  firstFieldRef?: RefObject<HTMLInputElement>;
  idPrefix?: string;
};

export function SupporterForm({
  mode,
  values,
  errors,
  disabled = false,
  onChange,
  firstFieldRef,
  idPrefix = "sf",
}: SupporterFormProps) {
  const id = (field: string) => `${idPrefix}-${field}`;

  return (
    <div className="space-y-10">
      <section className="space-y-4 pt-1">
        <SectionTitle>Basic info</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={id("first")} className={labelClass}>
              First name
            </Label>
            <Input
              ref={firstFieldRef}
              id={id("first")}
              value={values.first_name}
              onChange={(e) => onChange("first_name", e.target.value)}
              disabled={disabled}
              autoComplete="given-name"
              className={cn(inputClass)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={id("last")} className={labelClass}>
              Last name
            </Label>
            <Input
              id={id("last")}
              value={values.last_name}
              onChange={(e) => onChange("last_name", e.target.value)}
              disabled={disabled}
              autoComplete="family-name"
              className={cn(inputClass)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("display")} className={labelClass}>
            Display name
          </Label>
          <Input
            id={id("display")}
            value={values.display_name}
            onChange={(e) => onChange("display_name", e.target.value)}
            disabled={disabled}
            autoComplete="organization"
            className={cn(inputClass, errors?.display_name && "border-destructive/50")}
            aria-invalid={errors?.display_name ? true : undefined}
          />
          {errors?.display_name ? <p className="font-body text-sm text-destructive">{errors.display_name}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("org")} className={labelClass}>
            Organization name
          </Label>
          <Input
            id={id("org")}
            value={values.organization_name}
            onChange={(e) => onChange("organization_name", e.target.value)}
            disabled={disabled}
            className={cn(inputClass)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>Contact</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={id("email")} className={labelClass}>
              Email
            </Label>
            <Input
              id={id("email")}
              type="email"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              disabled={disabled}
              autoComplete="email"
              className={cn(inputClass, errors?.email && "border-destructive/50")}
              aria-invalid={errors?.email ? true : undefined}
            />
            {errors?.email ? <p className="font-body text-sm text-destructive">{errors.email}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={id("phone")} className={labelClass}>
              Phone
            </Label>
            <Input
              id={id("phone")}
              type="tel"
              value={values.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              disabled={disabled}
              autoComplete="tel"
              placeholder="Optional"
              className={cn(inputClass, errors?.phone && "border-destructive/50")}
              aria-invalid={errors?.phone ? true : undefined}
            />
            {errors?.phone ? <p className="font-body text-sm text-destructive">{errors.phone}</p> : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>Location</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={id("region")} className={labelClass}>
              Region
            </Label>
            <Input
              id={id("region")}
              value={values.region}
              onChange={(e) => onChange("region", e.target.value)}
              disabled={disabled}
              className={cn(inputClass)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={id("country")} className={labelClass}>
              Country
            </Label>
            <Input
              id={id("country")}
              value={values.country}
              onChange={(e) => onChange("country", e.target.value)}
              disabled={disabled}
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
            <Select value={values.relationship_type} onValueChange={(v) => onChange("relationship_type", v)} disabled={disabled}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "PartnerOrganization" ? "Partner organization" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>Supporter type</Label>
            <Select value={values.supporter_type} onValueChange={(v) => onChange("supporter_type", v)} disabled={disabled}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/([A-Z])/g, " $1").trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className={labelClass}>Acquisition channel</Label>
            <Select
              value={values.acquisition_channel || "__none__"}
              onValueChange={(v) => onChange("acquisition_channel", v === "__none__" ? "" : v)}
              disabled={disabled}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {ACQUISITION_CHANNELS.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {channel.replace(/([A-Z])/g, " $1").trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>Status</Label>
            <Select value={values.status} onValueChange={(v) => onChange("status", v)} disabled={disabled || mode === "create"}>
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
  );
}
