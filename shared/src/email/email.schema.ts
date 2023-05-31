import { z } from "zod";
import { localization, requiredText } from "../zodUtils";
import type { EmailType, TemplatedEmail } from "./email";
import { Email } from "./email.dto";
import { validateSingleEmailRegex } from "./validateEmail.dto";

const emailTypeSchema = z.string() as z.Schema<EmailType>;

export const templatedEmailSchema = z.object({
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
    z
      .string()
      .email()
      .refine(
        (email) => email.match(validateSingleEmailRegex), // emails patterns without underscore in the domain part
        (email) => ({
          message: `${localization.invalidEmailFormat} - email fourni : ${email}`,
        }),
      ),
  );

export const emailPossiblyEmptySchema = emailSchema
  .optional()
  .or(z.literal(""));
