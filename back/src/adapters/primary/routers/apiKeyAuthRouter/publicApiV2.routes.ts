import { z } from "zod";
import {
  conventionReadSchema,
  httpErrorSchema,
  searchResultSchema,
  searchResultsSchema,
  withAuthorizationHeaders,
} from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { contactEstablishmentPublicV2Schema } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.schema";
import { searchParamsPublicV2Schema } from "../DtoAndSchemas/v2/input/SearchParamsPublicV2.schema";

export type PublicApiV2SearchEstablishmentRoutes =
  typeof publicApiV2SearchEstablishmentRoutes;
export const publicApiV2SearchEstablishmentRoutes = defineRoutes({
  getOfferBySiretAndAppellationCode: defineRoute({
    method: "get",
    url: "/v2/search/:siret/:appellationCode",
    ...withAuthorizationHeaders,
    responses: {
      200: searchResultSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
  searchImmersion: defineRoute({
    method: "get",
    url: "/v2/search",
    queryParamsSchema: searchParamsPublicV2Schema,
    ...withAuthorizationHeaders,
    responses: {
      200: searchResultsSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
    },
  }),
  contactEstablishment: defineRoute({
    method: "post",
    url: "/v2/contact-establishment",
    requestBodySchema: contactEstablishmentPublicV2Schema,
    ...withAuthorizationHeaders,
    responses: {
      201: z.void(),
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
});

export type PublicApiV2ConventionRoutes = typeof publicApiV2ConventionRoutes;
export const publicApiV2ConventionRoutes = defineRoutes({
  getConventionById: defineRoute({
    method: "get",
    url: "/v2/convention/:conventionId",
    ...withAuthorizationHeaders,
    responses: {
      200: conventionReadSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
});
