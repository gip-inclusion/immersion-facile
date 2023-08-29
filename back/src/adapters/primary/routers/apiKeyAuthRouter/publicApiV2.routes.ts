import { z } from "zod";
import {
  httpErrorSchema,
  searchResultSchema,
  searchResultsSchema,
  withAuthorizationHeaders,
} from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { contactEstablishmentPublicV2Schema } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.schema";
import { searchParamsPublicV2Schema } from "../DtoAndSchemas/v2/input/SearchParamsPublicV2.schema";

export type PublicApiV2Routes = typeof publicApiV2Routes;
export const publicApiV2Routes = defineRoutes({
  getOfferBySiretAndAppellationCode: defineRoute({
    method: "get",
    url: "/v2/offers/:siret/:appellationCode",
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
    url: "/v2/offers",
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
