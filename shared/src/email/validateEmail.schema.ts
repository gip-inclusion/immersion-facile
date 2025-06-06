import { z } from "zod/v4";
import { emailSchema } from "./email.schema";
import {
  type ValidateEmailFeedback,
  type ValidateEmailInput,
  validateEmailStatuses,
} from "./validateEmail.dto";

export const validateEmailInputSchema: z.Schema<ValidateEmailInput> = z.object({
  email: emailSchema,
});

export const validateEmailReasonSchema = z.enum(validateEmailStatuses);

export const validateEmailResponseSchema: z.Schema<ValidateEmailFeedback> =
  z.object({
    status: z.enum(validateEmailStatuses),
    proposal: z.string().or(z.null()),
  });
