import { defineRoute, defineRoutes } from "shared-routes";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { agencyIdsSchema } from "../agency/agency.schema";
import { markPartnersErroredConventionAsHandledRequestSchema } from "../convention/convention.schema";
import { withAuthorizationHeaders } from "../headers";
import {
  httpErrorSchema,
  legacyUnauthenticatedErrorSchema,
} from "../httpClient/errors/httpErrors.schema";
import { expressEmptyResponseBody } from "../zodUtils";
import {
  getInclusionConnectLogoutUrlQueryParamsSchema,
  inclusionConnectedUserSchema,
} from "./inclusionConnectedAllowed.schema";

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
      400: httpErrorSchema,
    },
  }),
  markPartnersErroredConventionAsHandled: defineRoute({
    url: "/inclusion-connected/mark-errored-convention-as-handled",
    method: "post",
    ...withAuthorizationHeaders,
    requestBodySchema: markPartnersErroredConventionAsHandledRequestSchema,
    responses: {
      200: expressEmptyResponseBody,
      404: httpErrorSchema,
      400: httpErrorSchema,
      403: legacyUnauthenticatedErrorSchema,
    },
  }),
  getInclusionConnectLogoutUrl: defineRoute({
    method: "get",
    url: "/inclusion-connect-logout",
    queryParamsSchema: getInclusionConnectLogoutUrlQueryParamsSchema,
    responses: {
      200: absoluteUrlSchema,
    },
  }),
});
