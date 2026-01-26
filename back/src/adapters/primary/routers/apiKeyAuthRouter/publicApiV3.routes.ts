import {
  getOffersFlatParamsSchema,
  httpErrorSchema,
  internalOfferSchema,
  paginatedSearchResultsSchema,
  withAuthorizationHeaders,
} from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { contactEstablishmentPublicV3Schema } from "../DtoAndSchemas/v3/input/ContactEstablishmentPublicV3.schema";

export type PublicApiV3SearchEstablishmentRoutes =
  typeof publicApiV3SearchEstablishmentRoutes;

export const publicApiV3SearchEstablishmentRoutes = defineRoutes({
  contactEstablishment: defineRoute({
    method: "post",
    url: "/v3/apply-to-offer",
    requestBodySchema: contactEstablishmentPublicV3Schema,
    ...withAuthorizationHeaders,
    responses: {
      201: z.void(),
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
  getOffer: defineRoute({
    method: "get",
    url: "/v3/offers/:siret/:appellationCode/:locationId",
    ...withAuthorizationHeaders,
    responses: {
      200: internalOfferSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
  getOffers: defineRoute({
    method: "get",
    url: "/v3/offers",
    ...withAuthorizationHeaders,
    queryParamsSchema: getOffersFlatParamsSchema,
    responses: {
      200: paginatedSearchResultsSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
});
