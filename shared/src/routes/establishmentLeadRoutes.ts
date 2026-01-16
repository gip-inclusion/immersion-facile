import { defineRoute, defineRoutes } from "shared-routes";
import { withAuthorizationHeaders } from "../headers";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import { renewExpiredJwtResponseSchema } from "../tokens/jwt.schema";
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
      403: renewExpiredJwtResponseSchema,
      404: httpErrorSchema,
    },
  }),
});
