import { z } from "zod";
import { zEmail } from "../zodUtils";
import type { EmailType, TemplatedEmail } from "./email";
import { Email } from "./email.dto";

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

export const emailSchema: z.Schema<Email> = zEmail;
