import { z } from "zod";

export const SUPPORTER_TYPES = [
  "MonetaryDonor",
  "InKindDonor",
  "Volunteer",
  "SkillsContributor",
  "SocialMediaAdvocate",
  "PartnerOrganization",
] as const;

export const RELATIONSHIP_TYPES = ["Local", "International", "PartnerOrganization"] as const;

export const ACQUISITION_CHANNELS = [
  "Website",
  "SocialMedia",
  "Event",
  "WordOfMouth",
  "PartnerReferral",
  "Church",
] as const;

export const STATUS_TYPES = ["Active", "Inactive"] as const;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9()\-\s.]{7,20}$/;

export type SupporterFormValues = {
  first_name: string;
  last_name: string;
  display_name: string;
  organization_name: string;
  email: string;
  phone: string;
  region: string;
  country: string;
  supporter_type: string;
  relationship_type: string;
  acquisition_channel: string;
  status: string;
};

export const supporterFormSchema = z
  .object({
    first_name: z.string(),
    last_name: z.string(),
    display_name: z.string(),
    organization_name: z.string(),
    email: z.string(),
    phone: z.string(),
    region: z.string(),
    country: z.string(),
    supporter_type: z.enum(SUPPORTER_TYPES),
    relationship_type: z.enum(RELATIONSHIP_TYPES),
    acquisition_channel: z.string(),
    status: z.enum(STATUS_TYPES),
  })
  .superRefine((values, ctx) => {
    const first = values.first_name.trim();
    const last = values.last_name.trim();
    const display = values.display_name.trim();
    const org = values.organization_name.trim();
    const email = values.email.trim();
    const phone = values.phone.trim();

    const hasDisplayRule = Boolean(display || (first && last) || org);
    if (!hasDisplayRule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["display_name"],
        message: "Enter display name, first + last name, or organization name.",
      });
    }

    if (email && !EMAIL_RE.test(email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Enter a valid email address.",
      });
    }

    if (phone && !PHONE_RE.test(phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Enter a valid phone number.",
      });
    }
  });

export type SupporterFormErrors = Partial<Record<keyof SupporterFormValues, string>>;

export function defaultSupporterValues(): SupporterFormValues {
  return {
    first_name: "",
    last_name: "",
    display_name: "",
    organization_name: "",
    email: "",
    phone: "",
    region: "",
    country: "",
    supporter_type: "MonetaryDonor",
    relationship_type: "Local",
    acquisition_channel: "",
    status: "Active",
  };
}

function emptyToNull(v: string): string | null {
  const trimmed = v.trim();
  return trimmed ? trimmed : null;
}

export function computeDisplayName(values: SupporterFormValues): string {
  const org = values.organization_name.trim();
  if (org) return org;
  const display = values.display_name.trim();
  if (display) return display;
  return `${values.first_name.trim()} ${values.last_name.trim()}`.trim();
}

export function normalizeValues(values: SupporterFormValues): SupporterFormValues {
  const display = computeDisplayName(values);
  return {
    ...values,
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    display_name: display,
    organization_name: values.organization_name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    region: values.region.trim(),
    country: values.country.trim(),
    acquisition_channel: values.acquisition_channel.trim(),
  };
}

export function validateSupporterForm(values: SupporterFormValues): {
  ok: boolean;
  values: SupporterFormValues;
  errors: SupporterFormErrors;
} {
  const normalized = normalizeValues(values);
  const parsed = supporterFormSchema.safeParse(normalized);
  if (parsed.success) {
    return { ok: true, values: parsed.data, errors: {} };
  }
  const errors: SupporterFormErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key as keyof SupporterFormValues]) {
      errors[key as keyof SupporterFormValues] = issue.message;
    }
  }
  return { ok: false, values: normalized, errors };
}

export function toCreatePayload(values: SupporterFormValues): Record<string, unknown> {
  const normalized = normalizeValues(values);
  return {
    first_name: emptyToNull(normalized.first_name),
    last_name: emptyToNull(normalized.last_name),
    display_name: emptyToNull(normalized.display_name),
    organization_name: emptyToNull(normalized.organization_name),
    email: emptyToNull(normalized.email),
    phone: emptyToNull(normalized.phone),
    region: emptyToNull(normalized.region),
    country: emptyToNull(normalized.country),
    supporter_type: normalized.supporter_type,
    relationship_type: normalized.relationship_type,
    acquisition_channel: emptyToNull(normalized.acquisition_channel),
    status: normalized.status,
  };
}

export function toEditPayload(values: SupporterFormValues): Record<string, unknown> {
  const normalized = normalizeValues(values);
  return {
    firstName: emptyToNull(normalized.first_name),
    lastName: emptyToNull(normalized.last_name),
    displayName: emptyToNull(normalized.display_name),
    organizationName: emptyToNull(normalized.organization_name),
    email: emptyToNull(normalized.email),
    phone: emptyToNull(normalized.phone),
    region: emptyToNull(normalized.region),
    country: emptyToNull(normalized.country),
    supporterType: normalized.supporter_type,
    relationshipType: normalized.relationship_type,
    acquisitionChannel: emptyToNull(normalized.acquisition_channel),
    status: normalized.status,
  };
}
