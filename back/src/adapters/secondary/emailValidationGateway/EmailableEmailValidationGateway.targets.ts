import { ZodErrorMap } from "zod";
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
    validateResponseBody: (data) =>
      emailableEmailValidationStatusSchema.parse(data, {
        errorMap,
      }),
  }),
});

const errorMap: ZodErrorMap = (issue, ctx) =>
  issue.code === "invalid_enum_value"
    ? {
        message: [
          ctx.defaultError,
          `But value '${JSON.stringify(ctx.data)}' provided.`,
        ].join(" "),
      }
    : { message: ctx.defaultError };
