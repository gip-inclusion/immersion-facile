import { z } from "zod";
import { createTarget, createTargets } from "http-client";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { withValidateHeadersAuthorization } from "../headers";
import { shareLinkByEmailSchema } from "../ShareLinkByEmailDto";
import {
  conventionReadSchema,
  conventionWithoutExternalIdSchema,
  renewMagicLinkRequestSchema,
  updateConventionRequestSchema,
  updateConventionStatusRequestSchema,
  withConventionIdLegacySchema,
} from "./convention.schema";

export type ConventionMagicLinkTargets = typeof conventionMagicLinkTargets;
export const conventionMagicLinkTargets = createTargets({
  getConventionStatusDashboard: createTarget({
    url: "/auth/status-convention",
    method: "GET",
    ...withValidateHeadersAuthorization,
    validateResponseBody: absoluteUrlSchema.parse,
  }),
  getConvention: createTarget({
    url: "/auth/demandes-immersion/:conventionId",
    method: "GET",
    ...withValidateHeadersAuthorization,
    validateResponseBody: conventionReadSchema.parse,
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
  signConvention: createTarget({
    url: "/auth/sign-application/:conventionId",
    method: "POST",
    validateRequestBody: z.void().parse,
    ...withValidateHeadersAuthorization,
    validateResponseBody: withConventionIdLegacySchema.parse,
  }),
});

export type UnauthenticatedConventionTargets =
  typeof unauthenticatedConventionTargets;
export const unauthenticatedConventionTargets = createTargets({
  createConvention: createTarget({
    url: "/demandes-immersion",
    method: "POST",
    validateRequestBody: conventionWithoutExternalIdSchema.parse,
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
