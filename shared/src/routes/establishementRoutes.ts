import { defineRoute, defineRoutes } from "shared-routes";
import { renewMagicLinkResponseSchema } from "../convention/convention.schema";
import { formEstablishmentSchema } from "../formEstablishment/FormEstablishment.schema";
import { withAuthorizationHeaders } from "../headers";
import {
  httpErrorSchema,
  legacyHttpErrorSchema,
  legacyUnauthenticatedErrorSchema,
} from "../httpClient/httpErrors.schema";
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
      401: legacyUnauthenticatedErrorSchema,
      403: renewMagicLinkResponseSchema,
      409: legacyHttpErrorSchema,
    },
  }),
  getFormEstablishment: defineRoute({
    method: "get",
    url: "/form-establishments/:siret",
    ...withAuthorizationHeaders,
    responses: {
      200: formEstablishmentSchema,
      401: legacyUnauthenticatedErrorSchema,
      403: renewMagicLinkResponseSchema,
      404: legacyHttpErrorSchema,
    },
  }),
  requestEmailToUpdateFormRoute: defineRoute({
    method: "post",
    url: "/request-email-to-update-form/:siret",
    responses: {
      201: expressEmptyResponseBody,
      400: legacyHttpErrorSchema,
    },
  }),
  deleteEstablishment: defineRoute({
    method: "delete",
    url: "/form-establishments/:siret",
    ...withAuthorizationHeaders,
    responses: {
      204: emptyObjectSchema,
      400: httpErrorSchema,
      403: renewMagicLinkResponseSchema,
      404: legacyHttpErrorSchema,
    },
  }),
});
