import { defineRoute, defineRoutes } from "shared-routes";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { withAuthorizationHeaders } from "../headers";
import {
  httpErrorSchema,
  legacyHttpErrorSchema,
} from "../httpClient/errors/httpErrors.schema";
import { shareLinkByEmailSchema } from "../ShareLinkByEmailDto";
import { expressEmptyResponseBody } from "../zodUtils";
import {
  conventionReadSchema,
  conventionSchema,
  findSimilarConventionsParamsSchema,
  findSimilarConventionsResponseSchema,
  renewConventionParamsSchema,
  renewMagicLinkRequestSchema,
  renewMagicLinkResponseSchema,
  updateConventionRequestSchema,
  updateConventionStatusRequestSchema,
  withConventionIdLegacySchema,
} from "./convention.schema";

export type ConventionMagicLinkRoutes = typeof conventionMagicLinkRoutes;
export const conventionMagicLinkRoutes = defineRoutes({
  getConvention: defineRoute({
    url: "/auth/demandes-immersion/:conventionId",
    method: "get",
    ...withAuthorizationHeaders,
    responses: {
      200: conventionReadSchema,
      400: httpErrorSchema,
      403: renewMagicLinkResponseSchema,
      404: legacyHttpErrorSchema,
    },
  }),
  getConventionStatusDashboard: defineRoute({
    url: "/auth/status-convention",
    method: "get",
    ...withAuthorizationHeaders,
    responses: { 200: absoluteUrlSchema },
  }),
  signConvention: defineRoute({
    url: "/auth/sign-application/:conventionId",
    method: "post",
    ...withAuthorizationHeaders,
    responses: { 200: withConventionIdLegacySchema },
  }),
  updateConvention: defineRoute({
    url: "/auth/demandes-immersion/:conventionId",
    method: "post",
    requestBodySchema: updateConventionRequestSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: withConventionIdLegacySchema,
      404: legacyHttpErrorSchema,
    },
  }),
  updateConventionStatus: defineRoute({
    url: "/auth/update-application-status",
    method: "post",
    requestBodySchema: updateConventionStatusRequestSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: withConventionIdLegacySchema,
      400: httpErrorSchema,
      403: legacyHttpErrorSchema,
      404: legacyHttpErrorSchema,
    },
  }),
  renewConvention: defineRoute({
    url: "/auth/renew-convention",
    method: "post",
    requestBodySchema: renewConventionParamsSchema,
    ...withAuthorizationHeaders,
    responses: { 200: expressEmptyResponseBody },
  }),
});

export type UnauthenticatedConventionRoutes =
  typeof unauthenticatedConventionRoutes;
export const unauthenticatedConventionRoutes = defineRoutes({
  createConvention: defineRoute({
    url: "/demandes-immersion",
    method: "post",
    requestBodySchema: conventionSchema,
    responses: {
      200: withConventionIdLegacySchema,
      400: httpErrorSchema,
      409: legacyHttpErrorSchema,
    },
  }),
  shareConvention: defineRoute({
    url: "/share-immersion-demand",
    method: "post",
    requestBodySchema: shareLinkByEmailSchema,
    responses: { 200: expressEmptyResponseBody, 400: httpErrorSchema },
  }),
  renewMagicLink: defineRoute({
    url: "/renew-magic-link",
    method: "get",
    queryParamsSchema: renewMagicLinkRequestSchema,
    responses: { 200: expressEmptyResponseBody },
  }),
  findSimilarConventions: defineRoute({
    url: "/find-similar-immersion",
    method: "get",
    queryParamsSchema: findSimilarConventionsParamsSchema,
    responses: {
      200: findSimilarConventionsResponseSchema,
    },
  }),
});
