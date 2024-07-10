import { defineRoute, defineRoutes } from "shared-routes";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { agencyIdsSchema } from "../agency/agency.schema";
import {
  markPartnersErroredConventionAsHandledRequestSchema,
  withConventionIdSchema,
} from "../convention/convention.schema";
import { discussionReadSchema } from "../discussion/discussion.schema";
import { withAuthorizationHeaders } from "../headers";
import {
  httpErrorSchema,
  legacyHttpErrorSchema,
  legacyUnauthenticatedErrorSchema,
} from "../httpClient/httpErrors.schema";
import { expressEmptyResponseBody } from "../zodUtils";
import { inclusionConnectedUserSchema } from "./inclusionConnectedAllowed.schema";

export type InclusionConnectedAllowedRoutes =
  typeof inclusionConnectedAllowedRoutes;

export const inclusionConnectedAllowedRoutes = defineRoutes({
  getInclusionConnectedUser: defineRoute({
    method: "get",
    url: "/inclusion-connected/user",
    ...withAuthorizationHeaders,
    responses: {
      200: inclusionConnectedUserSchema,
      400: httpErrorSchema,
      403: legacyUnauthenticatedErrorSchema,
    },
  }),
  registerAgenciesToUser: defineRoute({
    method: "post",
    url: "/inclusion-connected/register-agency",
    ...withAuthorizationHeaders,
    requestBodySchema: agencyIdsSchema,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema.or(legacyHttpErrorSchema),
    },
  }),
  markPartnersErroredConventionAsHandled: defineRoute({
    url: "/inclusion-connected/mark-errored-convention-as-handled",
    method: "post",
    ...withAuthorizationHeaders,
    requestBodySchema: markPartnersErroredConventionAsHandledRequestSchema,
    responses: {
      200: expressEmptyResponseBody,
      404: legacyHttpErrorSchema,
      400: httpErrorSchema,
      403: legacyUnauthenticatedErrorSchema,
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
      401: legacyHttpErrorSchema,
      403: legacyUnauthenticatedErrorSchema,
      404: legacyHttpErrorSchema,
    },
  }),
  getInclusionConnectLogoutUrl: defineRoute({
    method: "get",
    url: "/inclusion-connect-logout",
    responses: {
      200: absoluteUrlSchema,
    },
  }),
  getDiscussionByIdForEstablishment: defineRoute({
    method: "get",
    url: "/discussion-for-establishment/:discussionId",
    ...withAuthorizationHeaders,
    responses: {
      200: discussionReadSchema,
      401: legacyHttpErrorSchema,
      403: legacyHttpErrorSchema,
      404: legacyHttpErrorSchema,
    },
  }),
});
