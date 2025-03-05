import { defineRoute, defineRoutes } from "shared-routes";
import { shareLinkByEmailSchema } from "../ShareLinkByEmailDto";
import { apiConsumerReadSchema } from "../apiConsumer/apiConsumer.schema";
import { assessmentDtoSchema } from "../assessment/assessment.schema";
import { dashboardUrlAndNameSchema } from "../dashboard/dashboard.schema";
import { withAuthorizationHeaders } from "../headers";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import { expressEmptyResponseBody } from "../zodUtils";
import { addConventionInputSchema } from "./addConventionInput";
import {
  conventionReadSchema,
  findSimilarConventionsParamsSchema,
  findSimilarConventionsResponseSchema,
  renewConventionParamsSchema,
  renewMagicLinkRequestSchema,
  renewMagicLinkResponseSchema,
  sendSignatureLinkRequestSchema,
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
    requestBodySchema: assessmentDtoSchema,
    responses: {
      201: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
    },
  }),

  getAssessmentByConventionId: defineRoute({
    url: "/auth/convention/:conventionId/assessment",
    method: "get",
    ...withAuthorizationHeaders,
    responses: {
      200: assessmentDtoSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),

  getConvention: defineRoute({
    url: "/auth/demandes-immersion/:conventionId",
    method: "get",
    ...withAuthorizationHeaders,
    responses: {
      200: conventionReadSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: renewMagicLinkResponseSchema.or(httpErrorSchema),
      404: httpErrorSchema,
    },
  }),
  getConventionStatusDashboard: defineRoute({
    url: "/auth/status-convention",
    method: "get",
    ...withAuthorizationHeaders,
    responses: {
      200: dashboardUrlAndNameSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
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
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
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
      403: httpErrorSchema,
      404: httpErrorSchema,
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
  sendSignatureLink: defineRoute({
    url: "/auth/convention/signatories/send-signature-link",
    method: "post",
    requestBodySchema: sendSignatureLinkRequestSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
});

export type UnauthenticatedConventionRoutes =
  typeof unauthenticatedConventionRoutes;
export const unauthenticatedConventionRoutes = defineRoutes({
  createConvention: defineRoute({
    url: "/demandes-immersion",
    method: "post",
    requestBodySchema: addConventionInputSchema,
    responses: {
      200: withConventionIdLegacySchema,
      400: httpErrorSchema,
      409: httpErrorSchema,
      503: httpErrorSchema,
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
      400: httpErrorSchema,
    },
  }),
});

export type AuthenticatedConventionRoutes =
  typeof authenticatedConventionRoutes;

export const authenticatedConventionRoutes = defineRoutes({
  getApiConsumersByConvention: defineRoute({
    method: "get",
    url: "/conventions/:conventionId/api-consumers",
    ...withAuthorizationHeaders,
    responses: {
      200: apiConsumerReadSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
});
