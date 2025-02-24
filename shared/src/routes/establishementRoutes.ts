import { defineRoute, defineRoutes } from "shared-routes";
import { renewMagicLinkResponseSchema } from "../convention/convention.schema";
import { formEstablishmentSchema } from "../formEstablishment/FormEstablishment.schema";
import { withAuthorizationHeaders } from "../headers";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import { emptyObjectSchema, expressEmptyResponseBody } from "../zodUtils";

export type EstablishmentRoutes = typeof establishmentRoutes;
export const establishmentRoutes = defineRoutes({
  addFormEstablishment: defineRoute({
    method: "post",
    url: "/form-establishments",
    requestBodySchema: formEstablishmentSchema,
    responses: {
      200: expressEmptyResponseBody,
    },
  }),
  updateFormEstablishment: defineRoute({
    method: "put",
    url: "/form-establishments",
    requestBodySchema: formEstablishmentSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      404: httpErrorSchema,
      403: renewMagicLinkResponseSchema,
      409: httpErrorSchema,
    },
  }),
  getFormEstablishment: defineRoute({
    method: "get",
    url: "/form-establishments/:siret",
    ...withAuthorizationHeaders,
    responses: {
      200: formEstablishmentSchema,
      401: httpErrorSchema,
      403: renewMagicLinkResponseSchema,
      404: httpErrorSchema,
    },
  }),
  requestEmailToUpdateFormRoute: defineRoute({
    method: "post",
    url: "/request-email-to-update-form/:siret",
    responses: {
      201: expressEmptyResponseBody,
      400: httpErrorSchema,
    },
  }),
  deleteEstablishment: defineRoute({
    method: "delete",
    url: "/form-establishments/:siret",
    ...withAuthorizationHeaders,
    responses: {
      204: emptyObjectSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: renewMagicLinkResponseSchema,
      404: httpErrorSchema,
    },
  }),
});
