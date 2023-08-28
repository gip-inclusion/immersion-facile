import { z } from "zod";
import { defineRoute, defineRoutes } from "shared-routes";
import { contactEstablishmentRequestSchema } from "../contactEstablishmentRequest/contactEstablishmentRequest.schema";
import { httpErrorSchema } from "../httpClient/errors/httpErrors.schema";
import {
  contactEstablishmentRoute,
  immersionOffersRoute,
} from "../routes/routes";
import { siretAndAppellationSchema } from "../siretAndAppellation/SiretAndAppellation.schema";
import { searchQueryParamsSchema } from "./SearchQueryParams.schema";
import { searchResultSchema, searchResultsSchema } from "./SearchResult.schema";

export type SearchRoutes = typeof searchImmersionRoutes;
export const searchImmersionRoutes = defineRoutes({
  getOffersByGroupSlug: defineRoute({
    method: "get",
    url: `/group-offers/:groupSlug`,
    responses: { 200: searchResultsSchema },
  }),
  searchImmersion: defineRoute({
    method: "get",
    url: `/${immersionOffersRoute}`,
    queryParamsSchema: searchQueryParamsSchema,
    responses: {
      200: searchResultsSchema,
      400: httpErrorSchema,
    },
  }),
  contactEstablishment: defineRoute({
    method: "post",
    url: `/${contactEstablishmentRoute}`,
    requestBodySchema: contactEstablishmentRequestSchema,
    responses: {
      201: z.string().max(0),
      400: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
  getImmersionOffer: defineRoute({
    method: "get",
    url: "/immersion-offer",
    queryParamsSchema: siretAndAppellationSchema,
    responses: {
      200: searchResultSchema,
      400: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
});
