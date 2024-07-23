import { defineRoute, defineRoutes } from "shared-routes";
import { renewMagicLinkResponseSchema } from "../convention/convention.schema";
import { withAuthorizationHeaders } from "../headers";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import { expressEmptyResponseBodyOrEmptyObject } from "../zodUtils";

export type EstablishmentLeadRoutes = typeof establishmentLeadRoutes;
export const establishmentLeadRoutes = defineRoutes({
  unregisterEstablishmentLead: defineRoute({
    method: "post",
    url: "/establishment-lead/unregister",
    ...withAuthorizationHeaders,
    responses: {
      204: expressEmptyResponseBodyOrEmptyObject,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: renewMagicLinkResponseSchema,
      404: httpErrorSchema,
    },
  }),
});
