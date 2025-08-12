import { z } from "zod";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import { emailSchema } from "./email.schema";
import {
  type ValidateEmailFeedback,
  type ValidateEmailInput,
  validateEmailStatuses,
} from "./validateEmail.dto";

export const validateEmailInputSchema: ZodSchemaWithInputMatchingOutput<ValidateEmailInput> =
  z.object({
    email: emailSchema,
  });

export const validateEmailReasonSchema = z.enum(validateEmailStatuses, {
  error: localization.invalidEnum,
});

export const validateEmailResponseSchema: ZodSchemaWithInputMatchingOutput<ValidateEmailFeedback> =
  z.object({
    status: z.enum(validateEmailStatuses, {
      error: localization.invalidEnum,
    }),
    proposal: z.string().or(z.null()),
  });
