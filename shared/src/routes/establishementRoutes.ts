import { z } from "zod";
import { defineRoute, defineRoutes } from "shared-routes";
import { renewMagicLinkResponseSchema } from "../convention/convention.schema";
import { formEstablishmentSchema } from "../formEstablishment/FormEstablishment.schema";
import { withAuthorizationHeaders } from "../headers";
import {
  httpErrorSchema,
  legacyBadRequestErrorSchema,
  legacyUnauthenticatedErrorSchema,
} from "../httpClient/errors/httpErrors.schema";

const formEstablishmentsUrl = "/form-establishments";

export type EstablishmentRoutes = typeof establishmentRoutes;
export const establishmentRoutes = defineRoutes({
  addFormEstablishment: defineRoute({
    method: "post",
    url: formEstablishmentsUrl,
    requestBodySchema: formEstablishmentSchema,
    responses: {
      200: z.literal(""),
    },
  }),
  updateFormEstablishment: defineRoute({
    method: "put",
    url: formEstablishmentsUrl,
    requestBodySchema: formEstablishmentSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: z.literal(""),
      400: httpErrorSchema,
      401: legacyUnauthenticatedErrorSchema,
      403: renewMagicLinkResponseSchema,
      409: legacyBadRequestErrorSchema,
    },
  }),
  getFormEstablishment: defineRoute({
    method: "get",
    url: `${formEstablishmentsUrl}/:siret`,
    ...withAuthorizationHeaders,
    responses: {
      200: formEstablishmentSchema,
      400: legacyBadRequestErrorSchema,
      401: legacyUnauthenticatedErrorSchema,
    },
  }),
  requestEmailToUpdateFormRoute: defineRoute({
    method: "post",
    url: "/request-email-to-update-form/:siret",
  }),
  deleteEstablishment: defineRoute({
    method: "delete",
    url: `${formEstablishmentsUrl}/:siret`,
    ...withAuthorizationHeaders,
    responses: {
      204: z.object({}),
      400: httpErrorSchema,
      403: renewMagicLinkResponseSchema,
      404: legacyBadRequestErrorSchema,
    },
  }),
});
