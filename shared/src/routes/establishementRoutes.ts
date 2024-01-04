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

const formEstablishmentsUrl = "/form-establishments";

export type EstablishmentRoutes = typeof establishmentRoutes;
export const establishmentRoutes = defineRoutes({
  addFormEstablishment: defineRoute({
    method: "post",
    url: formEstablishmentsUrl,
    requestBodySchema: formEstablishmentSchema,
    responses: {
      200: expressEmptyResponseBody,
    },
  }),
  updateFormEstablishment: defineRoute({
    method: "put",
    url: formEstablishmentsUrl,
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
    url: `${formEstablishmentsUrl}/:siret`,
    ...withAuthorizationHeaders,
    responses: {
      200: formEstablishmentSchema,
      400: legacyHttpErrorSchema,
      401: legacyUnauthenticatedErrorSchema,
      403: renewMagicLinkResponseSchema,
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
    url: `${formEstablishmentsUrl}/:siret`,
    ...withAuthorizationHeaders,
    responses: {
      204: emptyObjectSchema,
      400: httpErrorSchema,
      403: renewMagicLinkResponseSchema,
      404: legacyHttpErrorSchema,
    },
  }),
});
