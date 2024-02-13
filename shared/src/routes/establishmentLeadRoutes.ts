import { defineRoute, defineRoutes } from "shared-routes";
import { renewMagicLinkResponseSchema } from "../convention/convention.schema";
import { withAuthorizationHeaders } from "../headers";
import {
  httpErrorSchema,
  legacyUnauthenticatedErrorSchema,
} from "../httpClient/httpErrors.schema";
import { expressEmptyResponseBody } from "../zodUtils";

export type EstablishmentLeadRoutes = typeof establishmentLeadRoutes;
export const establishmentLeadRoutes = defineRoutes({
  unregisterEstablishmentLead: defineRoute({
    method: "post",
    url: "/establishment-lead/unregister",
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: legacyUnauthenticatedErrorSchema,
      403: renewMagicLinkResponseSchema,
      404: httpErrorSchema,
    },
  }),
});
