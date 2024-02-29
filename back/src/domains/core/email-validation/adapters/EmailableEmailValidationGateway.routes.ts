import { defineRoute, defineRoutes } from "shared-routes";
import {
  emailableEmailValidationStatusSchema,
  emailableValidationTargetsQueryParamsSchema,
} from "./EmailableEmailValidationGateway.schemas";

export type EmailableValidationRoutes = typeof emailableValidationRoutes;

export const emailableValidationRoutes = defineRoutes({
  validateEmail: defineRoute({
    method: "get",
    url: "https://api.emailable.com/v1/verify",
    queryParamsSchema: emailableValidationTargetsQueryParamsSchema,
    responses: {
      200: emailableEmailValidationStatusSchema,
    },
  }),
});