import { z } from "zod";
import type { EmailType, TemplatedEmail } from "./email";

const emailTypeSchema = z.string() as z.Schema<EmailType>;

const templatedEmailSchema = z.object({
  type: emailTypeSchema,
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
