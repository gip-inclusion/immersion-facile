import { z } from "zod";
import { emailSchema } from "./email.schema";
import {
  ValidateEmailInput,
  validateEmailReason,
  ValidateEmailStatus,
} from "./validateEmail.dto";

export const validateEmailInputSchema: z.Schema<ValidateEmailInput> = z.object({
  email: emailSchema,
});

export const validateEmailResponseSchema: z.Schema<ValidateEmailStatus> =
  z.object({
    isValid: z.boolean(),
    proposal: z.string().nullable().optional(),
    reason: z.enum(validateEmailReason),
  });
