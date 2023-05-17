import { createTarget, createTargets } from "http-client";
import {
  emailableEmailValidationStatusSchema,
  emailableValidationTargetsQueryParamsSchema,
} from "./EmailableEmailValidationGateway.schemas";

export type EmailableValidationTargets = typeof emailableValidationTargets;
export const emailableValidationTargets = createTargets({
  validateEmail: createTarget({
    method: "GET",
    url: "https://api.emailable.com/v1/verify",
    validateQueryParams: emailableValidationTargetsQueryParamsSchema.parse,
    validateResponseBody: emailableEmailValidationStatusSchema.parse,
  }),
});
