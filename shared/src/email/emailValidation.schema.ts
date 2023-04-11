import { z } from "zod";
import { zEmail } from "../zodUtils";
import {
  emailValidationReason,
  EmailValidationStatus,
} from "./emailValidation";
import { WithEmailInput } from "./emailValidation.dto";

export const emailValidationInputSchema: z.Schema<WithEmailInput> = z.object({
  email: zEmail,
});

export const emailValidationResponseSchema: z.Schema<EmailValidationStatus> =
  z.object({
    isValid: z.boolean(),
    proposal: z.string().nullable().optional(),
    isFree: z.boolean().optional(),
    reason: z.enum(emailValidationReason),
  });
