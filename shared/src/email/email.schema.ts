import { z } from "zod";
import { requiredText } from "../zodUtils";
import type { EmailType, TemplatedEmail } from "./email";
import type { Email, EmailAttachment } from "./email.dto";

export const emailAttachmentSchema: z.Schema<EmailAttachment> = z.object({
  name: z.string(),
  content: z.string(),
});

const emailTypeSchema = z.string() as z.Schema<EmailType>;

export const templatedEmailSchema = z.object({
  kind: emailTypeSchema,
  recipients: z.array(z.string()),
  cc: z.array(z.string()).optional(),
  params: z.any(),
}) as z.Schema<TemplatedEmail>;

const emailSentSchema = z.object({
  templatedEmail: templatedEmailSchema,
  sentAt: z.string(),
  error: z.optional(z.string()),
});

export const emailsSentSchema = z.array(emailSentSchema);

// Waiting zod release for bad email regex
const temporaryEmailRegex =
  /^([A-Z0-9_+-]+\.?)*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

export const emailSchema: z.Schema<Email> = z
  .string(requiredText)
  .transform((arg) =>
    arg
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""),
  )
  .pipe(
    //Temporary regex instead of email - waiting zod release
    z.string().regex(temporaryEmailRegex),
  );

export const emailPossiblyEmptySchema = emailSchema
  .optional()
  .or(z.literal(""));
