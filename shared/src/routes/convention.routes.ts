import { defineRoute, defineRoutes } from "shared-routes";
import { apiConsumerReadSchema } from "../apiConsumer/apiConsumer.schema";
import {
  assessmentDtoSchema,
  legacyAssessmentDtoSchema,
} from "../assessment/assessment.schema";
import { broadcastFeedbackSchema } from "../broadcast/broadcastFeedback.schema";
import { addConventionInputSchema } from "../convention/addConventionInput";
import {
  conventionReadSchema,
  editConventionCounsellorNameRequestSchema,
  findSimilarConventionsParamsSchema,
  findSimilarConventionsResponseSchema,
  flatGetConventionsForAgencyUserParamsSchema,
  markPartnersErroredConventionAsHandledRequestSchema,
  paginatedConventionsSchema,
  renewConventionParamsSchema,
  renewMagicLinkRequestSchema,
  renewMagicLinkResponseSchema,
  sendSignatureLinkRequestSchema,
  transferConventionToAgencyRequestSchema,
  updateConventionRequestSchema,
  updateConventionStatusRequestSchema,
  withConventionIdLegacySchema,
  withConventionIdSchema,
} from "../convention/convention.schema";
import { dashboardUrlAndNameSchema } from "../dashboard/dashboard.schema";
import { withAuthorizationHeaders } from "../headers";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import { shareLinkByEmailSchema } from "../ShareLinkByEmailDto";
import { expressEmptyResponseBody } from "../zodUtils";

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
      200: assessmentDtoSchema.or(legacyAssessmentDtoSchema),
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
    url: "/auth/status-convention/:conventionId",
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

  sendAssessmentLink: defineRoute({
    url: "/auth/assessment/send-assessment-link",
    method: "post",
    requestBodySchema: withConventionIdSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),

  transferConventionToAgency: defineRoute({
    url: "/auth/convention/transfer-to-agency",
    method: "post",
    requestBodySchema: transferConventionToAgencyRequestSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),

  editConventionCounsellorName: defineRoute({
    url: "/auth/convention/edit-counsellor-name",
    method: "post",
    requestBodySchema: editConventionCounsellorNameRequestSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
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
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      404: httpErrorSchema,
    },
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

  getConventionsForAgencyUser: defineRoute({
    method: "get",
    url: "/conventions-for-agency-user",
    ...withAuthorizationHeaders,
    queryParamsSchema: flatGetConventionsForAgencyUserParamsSchema,
    responses: {
      200: paginatedConventionsSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
    },
  }),

  markPartnersErroredConventionAsHandled: defineRoute({
    url: "/inclusion-connected/mark-errored-convention-as-handled",
    method: "post",
    ...withAuthorizationHeaders,
    requestBodySchema: markPartnersErroredConventionAsHandledRequestSchema,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
  broadcastConventionAgain: defineRoute({
    url: "/inclusion-connected/broadcast-convention-again",
    method: "post",
    ...withAuthorizationHeaders,
    requestBodySchema: withConventionIdSchema,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),

  getLastBroadcastFeedback: defineRoute({
    url: "/conventions/:conventionId/last-broadcast-feedback",
    method: "get",
    ...withAuthorizationHeaders,
    responses: {
      200: broadcastFeedbackSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
});
