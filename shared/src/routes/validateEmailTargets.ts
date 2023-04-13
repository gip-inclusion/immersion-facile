import { createTarget, createTargets } from "http-client";
import {
  validateEmailInputSchema,
  validateEmailResponseSchema,
} from "../email/validateEmail.schema";

export type ValidateEmailTargets = typeof validateEmailsTargets;

export const validateEmailsTargets = createTargets({
  validateEmail: createTarget({
    method: "GET",
    url: "/validate-email",
    validateQueryParams: validateEmailInputSchema.parse,
    validateResponseBody: validateEmailResponseSchema.parse,
  }),
});
