import { z } from "zod";
import { EmailSentDto, EmailType, TemplatedEmail, EMAIL_TYPE } from "./email";

export const emailTypeSchema: Zod.Schema<EmailType> = z.enum(EMAIL_TYPE);

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
