import { z } from "zod";
import { createTarget, createTargets } from "http-client";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { withValidateHeadersAuthorization } from "../headers";
import { shareLinkByEmailSchema } from "../ShareLinkByEmailDto";
import {
  conventionReadSchema,
  conventionSchema,
  renewConventionParamsSchema,
  renewMagicLinkRequestSchema,
  updateConventionRequestSchema,
  updateConventionStatusRequestSchema,
  withConventionIdLegacySchema,
} from "./convention.schema";

export type ConventionMagicLinkTargets = typeof conventionMagicLinkTargets;
export const conventionMagicLinkTargets = createTargets({
  getConvention: createTarget({
    url: "/auth/demandes-immersion/:conventionId",
    method: "GET",
    ...withValidateHeadersAuthorization,
    validateResponseBody: conventionReadSchema.parse,
  }),
  getConventionStatusDashboard: createTarget({
    url: "/auth/status-convention",
    method: "GET",
    ...withValidateHeadersAuthorization,
    validateResponseBody: absoluteUrlSchema.parse,
  }),
  signConvention: createTarget({
    url: "/auth/sign-application/:conventionId",
    method: "POST",
    validateRequestBody: z.void().parse,
    ...withValidateHeadersAuthorization,
    validateResponseBody: withConventionIdLegacySchema.parse,
  }),
  updateConvention: createTarget({
    url: "/auth/demandes-immersion/:conventionId",
    method: "POST",
    validateRequestBody: updateConventionRequestSchema.parse,
    ...withValidateHeadersAuthorization,
    validateResponseBody: withConventionIdLegacySchema.parse,
  }),
  updateConventionStatus: createTarget({
    url: "/auth/update-application-status/:conventionId",
    method: "POST",
    validateRequestBody: updateConventionStatusRequestSchema.parse,
    ...withValidateHeadersAuthorization,
    validateResponseBody: withConventionIdLegacySchema.parse,
  }),
  renewConvention: createTarget({
    url: "/auth/renew-convention",
    method: "POST",
    validateRequestBody: renewConventionParamsSchema.parse,
    ...withValidateHeadersAuthorization,
    validateResponseBody: z.literal("").parse,
  }),
});

export type UnauthenticatedConventionTargets =
  typeof unauthenticatedConventionTargets;
export const unauthenticatedConventionTargets = createTargets({
  createConvention: createTarget({
    url: "/demandes-immersion",
    method: "POST",
    validateRequestBody: conventionSchema.parse,
    validateResponseBody: withConventionIdLegacySchema.parse,
  }),
  shareConvention: createTarget({
    url: "/share-immersion-demand",
    method: "POST",
    validateRequestBody: shareLinkByEmailSchema.parse,
  }),
  renewMagicLink: createTarget({
    url: "/renew-magic-link",
    method: "GET",
    validateQueryParams: renewMagicLinkRequestSchema.parse,
  }),
});
