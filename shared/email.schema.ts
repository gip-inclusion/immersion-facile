import { z } from "zod";
import { EmailType } from "./email";

export const emailTypeSchema: Zod.Schema<EmailType> = z.any();

export const templatedEmailSchema = z.object({
  type: emailTypeSchema,
  recipients: z.array(z.string()),
  cc: z.array(z.string()),
  params: z.object({}),
});

export const emailSentSchema = z.object({
  templatedEmail: templatedEmailSchema,
  sentAt: z.string(),
  error: z.optional(z.string()),
});
export const emailsSentSchema = z.array(emailSentSchema);

/* TODO Expérimentation d'appliquer le type DTO aux schema mais influctueux

export const emailTypeSchema: Zod.Schema<EmailType> = z.enum([
  "NEW_CONVENTION_AGENCY_NOTIFICATION",
  "NEW_CONVENTION_BENEFICIARY_CONFIRMATION",
  "NEW_CONVENTION_MENTOR_CONFIRMATION",
  "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
  "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
  "POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION",
  "REJECTED_CONVENTION_NOTIFICATION",
  "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
  "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
  "MAGIC_LINK_RENEWAL",
  "BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION",
  "NEW_CONVENTION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE",
  "NEW_CONVENTION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE",
  "CONTACT_BY_EMAIL_REQUEST",
  "CONTACT_BY_PHONE_INSTRUCTIONS",
  "CONTACT_IN_PERSON_INSTRUCTIONS",
  "SHARE_DRAFT_CONVENTION_BY_LINK",
  "AGENCY_WAS_ACTIVATED",
  "EDIT_FORM_ESTABLISHMENT_LINK",
  "SUGGEST_EDIT_FORM_ESTABLISHMENT",
  "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
  "CREATE_IMMERSION_ASSESSMENT",
]);

export const templatedEmailSchema: Zod.Schema<TemplatedEmail> = z.object({
  type: emailTypeSchema,
  recipients: z.array(z.string()),
  cc: z.array(z.string()),
  params: z.object({}),
});

export const emailSentSchema: Zod.Schema<EmailSentDto> = z.object({
  templatedEmail: templatedEmailSchema,
  sentAt: z.string(),
  error: z.optional(z.string()),
});
export const emailsSentSchema: Zod.Schema<EmailSentDto[]> =
  z.array(emailSentSchema);

*/
