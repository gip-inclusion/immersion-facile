import { defineRoute, defineRoutes } from "shared-routes";
import { shareLinkByEmailSchema } from "../ShareLinkByEmailDto";
import { assessmentSchema } from "../assessment/assessment.schema";
import { dashboardUrlAndNameSchema } from "../dashboard/dashboard.schema";
import { withAuthorizationHeaders } from "../headers";
import {
  httpErrorSchema,
  legacyHttpErrorSchema,
  legacyUnauthenticatedErrorSchema,
} from "../httpClient/httpErrors.schema";
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
  createAssessment: defineRoute({
    url: "/auth/assessment",
    method: "post",
    ...withAuthorizationHeaders,
    requestBodySchema: assessmentSchema,
    responses: {
      201: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: legacyUnauthenticatedErrorSchema,
      403: legacyHttpErrorSchema,
    },
  }),
  getConvention: defineRoute({
    url: "/auth/demandes-immersion/:conventionId",
    method: "get",
    ...withAuthorizationHeaders,
    responses: {
      200: conventionReadSchema,
      400: httpErrorSchema,
      403: renewMagicLinkResponseSchema.or(legacyHttpErrorSchema),
      404: legacyHttpErrorSchema,
    },
  }),
  getConventionStatusDashboard: defineRoute({
    url: "/auth/status-convention",
    method: "get",
    ...withAuthorizationHeaders,
    responses: {
      200: dashboardUrlAndNameSchema,
      401: legacyUnauthenticatedErrorSchema,
    },
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
      401: legacyUnauthenticatedErrorSchema,
      403: legacyHttpErrorSchema,
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
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
    },
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
